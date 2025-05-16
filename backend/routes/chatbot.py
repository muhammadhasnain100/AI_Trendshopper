from aitrendshopper.services.chathandler import Chatbot
from aitrendshopper.database import user_collection
from aitrendshopper.models import ChatRequest
from fastapi import APIRouter, HTTPException, Response
import os
from aitrendshopper.config import settings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.memory import ConversationTokenBufferMemory

router = APIRouter()

bot = Chatbot()
if "GOOGLE_API_KEY" not in os.environ:
    os.environ["GOOGLE_API_KEY"] = settings.gemini_api
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-pro",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)


# --- Endpoints ---
@router.post("/get_response")
async def get_response(data: ChatRequest):
    bot = Chatbot()
    user = await user_collection.find_one({"token": data.token})
    if not user:
        return {"status": False, "message": "User not found"}

    uid = str(user["_id"])
    if not await bot.load_chat(uid):
        await bot.create_chat(uid)


    history = await bot.load_chat(uid)
    memory = ConversationTokenBufferMemory(llm=llm, max_token_limit=8000)
    for entry in history:
        memory.save_context({"input": entry["question"]}, {"output": entry["response"]})

    chat_history = memory.load_memory_variables({}).get('history', [])
    answer  = await bot.inference(data.query, chat_history, data.search)
    await bot.update_chat(uid, data.query, answer)
    return {"status": True,"message": "succussfully", "answer": answer}


@router.post("/get_history/{token}")
async def get_history(token: str):
    user = await user_collection.find_one({"token": token})
    if not user:
        return {"status": False, "message": "User not found"}

    history = await bot.load_chat(str(user["_id"]))
    return {"status": True,"message": "succussfully", "history": history}

