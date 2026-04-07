import google.generativeai as genai
import os
from dotenv import load_dotenv

# Path to the .env file in the backend directory
env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
load_dotenv(dotenv_path=env_path)

# Retrieve the API key and model from environment variables
api_key = os.getenv("GOOGLE_API_KEY")
model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

if not api_key:
    print("Error: GOOGLE_API_KEY not found in backend/.env")
else:
    # Configure the Gemini API
    genai.configure(api_key=api_key)

    # Initialize the Gemini model
    model = genai.GenerativeModel(model_name)

    # Generate text
    try:
        response = model.generate_content("Write a short poem about artificial intelligence.")
        print(response.text)
    except Exception as e:
        print(f"Error occurred: {e}")
