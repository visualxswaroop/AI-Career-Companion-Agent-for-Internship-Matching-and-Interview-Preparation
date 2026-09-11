"""Check available Groq models."""
import os
from dotenv import load_dotenv
load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
print(f"API Key present: {bool(api_key)}")

try:
    from groq import Groq
    client = Groq(api_key=api_key)
    models = client.models.list()
    print("\nAvailable models:")
    for m in models.data:
        print(f"  - {m.id}")
except Exception as e:
    print(f"Error: {e}")
