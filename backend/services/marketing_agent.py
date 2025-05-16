import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
from datetime import datetime
from aitrendshopper.database import user_collection, marketing_collection
from aitrendshopper.config import settings
from bson import ObjectId
from google.genai import types
import base64


class MarketingBot:
    def __init__(self):
        self.sending_email = 'hasnainnaseer987@gmail.com'
        self.password = 'vnlh hafc sflj fwrp'  # Replace with a secure method of retrieving credentials.
        self.model_id = 'gemini-2.0-flash'
        self.image_model_id = "gemini-2.0-flash-exp"
        self.client = settings.client

    async def send_email(self, email_subject, email_text, receiver_email, receiver_name="Valued Customer"):
        """
        Send a personalized marketing email via SMTP.
        Returns a string indicating success or an error message.
        """
        sender_email = self.sending_email
        smtp_server = "smtp.gmail.com"
        port = 587

        # Use a professional greeting in the email text.
        professional_email_text = f"Dear {receiver_name},\n\n" + email_text

        message = MIMEMultipart("alternative")
        message["Subject"] = email_subject
        message["From"] = sender_email
        message["To"] = receiver_email

        # Attach the plain text part.
        part1 = MIMEText(professional_email_text, "plain")
        message.attach(part1)

        try:
            server = smtplib.SMTP(smtp_server, port)
            server.starttls()
            server.login(sender_email, self.password)
            server.sendmail(sender_email, receiver_email, message.as_string())
            server.quit()
            return "Successful"
        except Exception as e:
            return f"Error: {e}"

    async def blog_post(self, context):
        """
        Generate and return a captivating blog post using the language model.
        """
        prompt = f"""You are an expert content strategist and marketing professional.
Generate a captivating blog post that highlights the unique features and benefits 
of our latest product using persuasive and professional language.
Include an engaging headline, clear sections, and a strong call-to-action.
Write just the blog post text.

Context:
{context}

Template:
[shop_name] – [tagline]

About Us:
[description]
Location: [address]
Contact:
Phone: [contact_number]
Email: [contact_email]

Featured Product: [product_name]

Product Details:
[description]
Price: $[price]
Available Quantity: [quantity]

Why Shop With Us?
Experience quality and exceptional service at [shop_name]. Our featured product, [product_name], is designed to deliver outstanding value and performance.

Visit Us Today:
Discover more about our products and special offers by visiting our store or contacting us directly.
"""
        response = self.client.models.generate_content(
            model=self.model_id,
            contents=prompt,
        )
        return response.text

    async def marketing_strategy_prompt(self, context):
        """
        Generate a comprehensive and professional marketing strategy in JSON format.
        The output includes target audience analysis, social media campaign ideas, email marketing plans,
        promotional poster designs, budget planning, campaign duration, and performance metrics.
        """
        prompt = f"""Generate a comprehensive and professional marketing strategy for our shop. 
Include a detailed target audience analysis, creative social media campaign ideas, 
effective email marketing plans, and attractive promotional poster design suggestions. 
Also provide a proposed campaign budget, recommended campaign duration, and key performance metrics for success. 
Use persuasive language and actionable steps. 
Context: {context}
Generate the answer according to provided json format
Output JSON Format (Make sure the output is valid JSON):

{{
  "target_audience": "Provide two descriptive words that best describe the target audience.",
  "poster_design": "Provide creative poster design ideas in a string of approximately 20 words.",
  "gender": "Specify the target gender: 'male', 'female', or 'both'.",
  "age": "Specify the ideal age range for the product (e.g., '18-35').",
  "social_media": "Provide social media marketing ideas for platforms such as TikTok, Instagram, YouTube, and Facebook in a string of around 20 words.",
  "email_marketing": "Describe detailed email marketing strategies in one concise string. 20 words",
  "campaign_duration": "Specify the recommended duration for the campaign (e.g., '3 months')."
}}
"""
        response = self.client.models.generate_content(
            model=self.model_id,
            contents=prompt,
            config=types.GenerateContentConfig(
        response_mime_type="application/json"
    ))
        return json.loads(response.text)

    async def start_campaign(self, product, shop):
        if not product or not shop:
            raise Exception("Invalid product or shop provided.")

        # Compose the email message.
        email_subject = f"Introducing Our Latest Product: {product.get('product_name', '')}"
        email_body = (
            f"We are delighted to announce the launch of our new product, '{product.get('product_name', '')}', "
            f"available now at '{shop.get('shop_name', '')}'.\n\n"
            f"Product Overview:\n{product.get('description', '')}\n\n"
            f"Price: ${product.get('price', '')}\n\n"
            "We invite you to explore this exclusive offering and experience the quality and innovation "
            "that define our brand.\n\n"
            "Best regards,\n"
            f"The {shop.get('shop_name', '')} Team"
        )

        # Retrieve all user documents from the database.
        users = await user_collection.find({}).to_list(length=1000)
        img_data = await self.generate_poster(product, shop)
        # Prepare campaign data with enriched analysis values.
        campaign_data = {
            "_id": str(ObjectId()),
            "product_id": product['_id'],
            "shop_id": shop['_id'],
            "target_mails": len(users),
            "successfully_send_mails": 0,
            "blog_post": None,
            "marketing_strategy": None,
            "created_at": datetime.utcnow(),
            "image": img_data
        }
        # Insert campaign details into the marketing collection.
        await marketing_collection.insert_one(campaign_data)

        try:
        # Generate marketing materials.
            blog = await self.blog_post(f'Product details: {product}\nShop details: {shop}')
        except Exception as e:
            blog = None

        try:
        # Generate marketing materials.
            strategy = await self.marketing_strategy_prompt(f'Product details: {product}\nShop details: {shop}')
        except Exception as e:
            strategy = None
        # Update the campaign with generated marketing materials.
        await marketing_collection.update_one(
            {"product_id": product['_id']},
            {"$set": {"blog_post": blog, "marketing_strategy": strategy}}
        )

        # Send emails to each user.
        for user_doc in users:
            email = user_doc.get("email")
            receiver_name = user_doc.get("name", "Valued Customer")
            if email:
                try:
                    # Generate marketing materials.
                    result = await self.send_email(email_subject, email_body, email, receiver_name)
                except Exception as e:
                    result = 'unsuccessful'

                if "successful" in result.lower():
                    await marketing_collection.update_one(
                        {"product_id": product['_id']},
                        {"$inc": {"successfully_send_mails": 1}}
                    )
                else:
                    pass

    async def get_result(self, product_id):
        """
        Retrieve marketing campaign details based on a given product_id.
        """
        result = await marketing_collection.find_one({"product_id": product_id})

        result.pop('image', None)
        return result

    async def generate_poster(self, product, shop) -> None:

        prompt = f"""
        Just add product name and make it poster structure dont need to add too many text and this detail is about the fashion cloth product about ecommerce and your poster should be look like ecommerce and i repeat again generate a poster ecommerce product and detail is given below.
        
        As an expert illustrator, create a professional-quality image for this text and write text in image with correct characters and spelling mistakes are not allowed and this poster should be design for social media platfor and i want correct written text on poster for this product.. 
        
        I need the full quality image and fullfill the all following requirements. 
        here is 
        concept:
         - Product Name: {product.get('product_name', '')}
        - Shop Name: {shop.get('shop_name', '')}
        - Contact Number: {shop.get('contact_number', '')}
        - Contact Email: {shop.get('contact_email', '')}
        - Visit: www.aitrendshopper.com
        """

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
                    # Update the marketing collection with generated image

                return data


        return None

