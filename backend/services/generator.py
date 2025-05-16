from google.genai import types
import base64
from typing import Optional, List, Dict
import json
from google import genai
from google.genai.types import Tool, GenerateContentConfig, GoogleSearch

class ImageGenerator:

    def __init__(self, api_key: Optional[str] = None):

        self.api_key = api_key

        self.client = genai.Client(api_key=self.api_key)
        self.google_search_tool = Tool(
            google_search=GoogleSearch()
        )

    def _call_text_model(self, prompt: str) -> str:

        response = self.client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config={
                'response_mime_type': 'application/json'
            }
        )

        return response.text

    def refine_prompt(self, base_prompt: str) -> str:
        """
        Uses the search tool to polish a base prompt into a more professional style.

        :param base_prompt: Initial user‐supplied prompt.
        :return: Refined prompt.
        """
        response = self.client.models.generate_content(
            model='gemini-2.0-flash',
            contents=base_prompt,
            config=GenerateContentConfig(
                tools=[self.google_search_tool],
                response_modalities=["TEXT"],
            ))
        for part in response.candidates[0].content.parts:
            return part.text.strip()

    def recommend_trends(self,
                         gender: str,
                         dress_type: str,
                         occasion: str,
                         region: str = "Pakistan"
                         ) -> Dict[str, List[str]]:

        base_prompt = f"""Search the List the top {gender} {dress_type} design trends 
            for a {occasion} in {region}, with professional detail."""

        polished = self.refine_prompt(base_prompt)

        # Build JSON‐output prompt
        json_prompt = f"""
        you will extract and design the output prompt for the following dress {dress_type} and it should be in list. your prompt should be related to this dress type {dress_type} and i need this dress {dress_type}  prompt that you extract from the provided context for image.generate for the following dress type {dress_type} . 
        we have generate the image of this type {dress_type} from your provided prompt and i need this prompy according context design for this dress dress only {dress_type} and i repeat again kindly make sure that your generated prompt should be related to this dress type {dress_type} and dont need to generate a prompt of irrelevant dress type i repeat again dont need to generate irrelevant prompt for any another dress type.
        You are a fashion industry expert. You will extract the trends description with proper dress type {dress_type} and occasion {occasion} for the gender {gender}. You will extract the one trend design of dress and mention the color and design on one design only in provided description and first you will analyze text in context and check how many design of dress it contain for example it conatin one then return one trend descrption in response in case 2 design then return 2 trends in list w with condition dress type should be related not irrelevant. You will define and mention proper dress design and colors everything in trend description. You will extract the detailed trend descriptions of design in list form.
            Generate a JSON output structure according to following format:

            {{'trends': [write here with proper dress type, color , detail design in string in the form of list for how many design it detect in following context]}}
            Context:
            {polished}"""

        raw_json = self._call_text_model(prompt=json_prompt)

        data = json.loads(raw_json)
        return {'trends': data['trends'],
                'gender': gender,
                'occasion': occasion}

    def generate_image(self, dress_type:str, trend_description: str, gender: str, occasion: str) -> None:

        prompt = f"""
        You will generate a dress for following dress type {dress_type} and your generated image dress  should be like this and it is compulsory {dress_type} just copy design from the trend description and  repeat again generate a dress of {dress_type} with design according to trend description.
        As an expert illustrator, create a professional-quality image for this design. I need the full quality image and fullfill the all following requirements. here is concept: gender : {gender} , occasion : {occasion},trend description: {trend_description}"""

        # Use the refined prompt to generate an image with attributes emphasizing 'professional' and 'best'
        response = self.client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["Text", "Image"]
            ),
        )
        for part in response.candidates[0].content.parts:
            # Skip parts with text content.
            if part.text is not None:
                continue
            elif part.inline_data is not None:
                mime = part.inline_data.mime_type
                data = part.inline_data.data
                # If data is a base64 string, decode it.
                if isinstance(data, str):
                    data = base64.b64decode(data)
                return data
        return None

class RecommendGenerator:

    def __init__(self, api_key: Optional[str] = None):

        self.api_key = api_key

        self.client = genai.Client(api_key=self.api_key)
        self.google_search_tool = Tool(
            google_search=GoogleSearch()
        )

    def _call_text_model(self, prompt: str) -> str:

        response = self.client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config={
                'response_mime_type': 'application/json'
            }
        )

        return response.text

    def refine_prompt(self, base_prompt: str) -> str:
        """
        Uses the search tool to polish a base prompt into a more professional style.

        :param base_prompt: Initial user‐supplied prompt.
        :return: Refined prompt.
        """
        response = self.client.models.generate_content(
            model='gemini-2.0-flash',
            contents=base_prompt,
            config=GenerateContentConfig(
                tools=[self.google_search_tool],
                response_modalities=["TEXT"],
            ))
        for part in response.candidates[0].content.parts:
            return part.text.strip()

    def recommend_trends(self
                         ):

        base_prompt = f"""Search the top trend in dress name which kind of dress likes in pakistan pent, shalwar, kameez etc everything detail search out for men, boys , girl, females for everyone"""

        polished = self.refine_prompt(base_prompt)

        # Build JSON‐output prompt
        json_prompt = f"""You are a fashion industry expert. You will extract the fress name from the following text top 6 dres name
            Generate a JSON output structure according to following format:

            {{'dresses': [write here dresses here ]}}
            Context:
            {polished}"""

        raw_json = self._call_text_model(prompt=json_prompt)

        data = json.loads(raw_json)
        return data












