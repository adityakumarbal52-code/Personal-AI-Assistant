
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load API key
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("Gemini API key not found in .env file")

# Connect to Gemini
client = genai.Client(api_key=api_key)


def ask_gemini(prompt: str, tools=None) -> str:
    """Send a prompt to Gemini with optional Python tools."""

    config = None

    if tools:
        config = types.GenerateContentConfig(
            tools=tools
        )

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt,
        config=config
    )

    return response.text or "Gemini returned an empty response."
