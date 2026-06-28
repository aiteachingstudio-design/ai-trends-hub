import os
from google import genai

# Naya 2026 SDK Client initialization
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY missing in environment variables.")
    exit(1)

client = genai.Client(api_key=api_key)

def generate_daily_content():
    # Bilkul sahi aur updated model name
    model_name = "gemini-1.5-flash"
    
    prompt = (
        "Create a modern, clean HTML content section for an AI website. "
        "Include today's top 3 trending AI news/articles and 3 high-quality useful AI prompts. "
        "Return ONLY the clean HTML block, no markdown wrappers like ```html."
    )
    
    try:
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
        )
        content = response.text.strip()
        
        # index.html ko naye content se overwrite karna
        with open("index.html", "w", encoding="utf-8") as f:
            f.write(content)
        print("Website successfully updated with fresh AI content!")
        
    except Exception as e:
        print(f"Error during content generation: {e}")
        exit(1)

if __name__ == "__main__":
    generate_daily_content()
