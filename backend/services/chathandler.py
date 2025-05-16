from typing import List
import os
from google import genai
from google.genai.types import Tool, GenerateContentConfig, GoogleSearch
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document
from aitrendshopper.database import chats_collection
from aitrendshopper.config import settings

FAISS_DIR = "/home/hasnain/PycharmProjects/fastApiProject/aitrendshopper/faiss_index_dir"
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY", settings.gemini_api)

os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY


# --- Chatbot wrapper ---
class Chatbot:
    def __init__(self):
        # Gemini client + search tool
        self.client = genai.Client(api_key=GEMINI_API_KEY)
        self.google_search_tool = Tool(google_search=GoogleSearch())
        # Embeddings + FAISS
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
        print('hj')
        self.faiss = FAISS.load_local(FAISS_DIR, self.embeddings,
                                      allow_dangerous_deserialization=True
                                      )
        # else:
        #     # initialize empty index
        #     self.faiss = FAISS.from_documents([], self.embeddings)
        #     self.faiss.save_local(FAISS_DIR)

        # Chat LLM
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-pro",
            temperature=0,
            max_tokens=None,
            timeout=None,
            max_retries=2,
        )

    async def create_chat(self, user_id: str):
        await chats_collection.insert_one({"_id": user_id, "history": []})

    async def load_chat(self, user_id: str) -> List[dict]:
        rec = await chats_collection.find_one({"_id": user_id})
        return rec["history"] if rec else []

    async def update_chat(self, user_id: str, question: str, answer: str):
        await chats_collection.update_one(
            {"_id": user_id},
            {"$push": {"history": {"question": question, "response": answer}}}
        )

    async def update_faiss(self, plain_text: str) -> dict:
        # 1. Wrap & split
        docs = [Document(page_content=plain_text)]
        splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=200)
        chunks = splitter.split_documents(docs)
        new_faiss_index = FAISS.from_documents(chunks, self.embeddings)

        self.faiss.merge_from(new_faiss_index)

        self.faiss.save_local(FAISS_DIR)
        self.faiss = FAISS.load_local(FAISS_DIR, self.embeddings,
                                      allow_dangerous_deserialization=True
                                      )
        return {"status": True, "message": "FAISS index updated with new text."}

    async def inference(self, question: str, chat_history, search=False) -> str:
        # 1) retrieval
        docs = self.faiss.similarity_search(question, k=5)
        context = " ".join(d.page_content for d in docs)
        print(context)
        # 2) build prompt
        prompt = (
            f"You are expert shop-advisor aitrendshopper.\n"
            f"Context: {context}\n"
            f"Chat history: {chat_history}\n"
            f"User: {question}\n"
            "Assistant:"
        )
        if search:
            resp = self.client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config=GenerateContentConfig(
                    tools=[self.google_search_tool],
                    response_modalities=["TEXT"],
                )
            )
            resp_answer = ''
            for part in resp.candidates[0].content.parts:
                resp_answer = resp_answer + ' ' + part.text.strip()
            return resp_answer
        else:
            response = self.client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt,

            )

            return response.text



