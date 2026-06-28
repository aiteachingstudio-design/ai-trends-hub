import os
import google.generativeai as genai

# Gemini API Key set karna
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

def generate_daily_content():
    # Latest Gemini model use karna
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    prompt = "Write a daily update about the latest AI trends, news, and 3 useful AI prompts for today in clean HTML format."
    
    try:
        response = model.generate_content(prompt)
        content = response.text
        
        # index.html file ko update/overwrite karna
        with open("index.html", "w", encoding="utf-8") as f:
            f.write(content)
        print("Website successfully updated with fresh AI content!")
        
    except Exception as e:
        print(f"Error generating content: {e}")
        exit(1)

if __name__ == "__main__":
    generate_daily_content()
