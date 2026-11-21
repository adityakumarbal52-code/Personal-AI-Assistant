import os
from dotenv import load_dotenv
from google import genai

# Load API key from .env file
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("Error: Gemini API key not found!")
else:
    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model="gemini-3.1-flash-lite",
        contents="Hello Gemini! Introduce yourself in one sentence."
    )

    print("Gemini connected successfully!")
    print("Gemini Response:", response.text)