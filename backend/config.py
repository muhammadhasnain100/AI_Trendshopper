import os
import secrets
import urllib.parse
from google import genai
import googlemaps
# Generate a secure random secret key
secret_key = '4567890sdfghjk456789dfg567'

class Settings:
    MONGO_DETAILS = os.getenv("MONGO_DETAILS", "mongodb://localhost:27017")
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "34128153484-2lfk3rb9pn431vscnsmb252t0n4oibqh.apps.googleusercontent.com")
    SECRET_KEY = os.getenv("SECRET_KEY", secret_key)
    ALGORITHM = "HS256"
    map_api = os.getenv("map_api", "AIzaSyA4WeE-BvNOhIA7g3sxQQ_bVlEmGu2adhs")
    gemini_api = os.getenv('gemini_api',"AIzaSyA6cpd0kH1fm6JDuJE8YHMcc9X4RVTYEk4")
    client = genai.Client(api_key=gemini_api)
    gmaps = googlemaps.Client(key=map_api)

settings = Settings()
