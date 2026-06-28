import os
import google.generativeai as genai

# API Key check karna
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY missing in environment variables.")
    exit(1)

# Purana configure method jo aapki current workflow ke sath match karta hai
genai.configure(api_key=api_key)

def generate_daily_content():
    # 2026 ka stable model (bina beta version ke error ke)
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    prompt = (
        "Create a modern, clean HTML content section for an AI website. "
        "Include today's top 3 trending AI news/articles and 3 high-quality useful AI prompts. "
        "Return ONLY the clean HTML block, no markdown wrappers like ```html."
    )
    
    try:
        response = model.generate_content(prompt)
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
