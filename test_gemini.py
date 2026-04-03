import google.generativeai as genai
import os

# Using the API key from your .env file
genai.configure(api_key="AIzaSyCy6jcgCCP71t9Bq-jSnWgpMcv4IZ0FqvI")

# Initialize the Gemini 1.5 Flash model
model = genai.GenerativeModel('gemini-1.5-flash-latest')

# Generate text
response = model.generate_content("Write a short poem about artificial intelligence.")

print(response.text)
