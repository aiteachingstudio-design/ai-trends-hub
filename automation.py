import os
import google.generativeai as genai
from datetime import datetime

# Gemini API ko naye tareeqay se configure karna
GEMINI_KEY = os.environ.get("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_KEY)

def generate_content():
    current_date = datetime.now().strftime("%d %B %Y")
    
    print("AI se content generate ho raha hai...")
    
    # Naya recommended model 'gemini-1.5-flash' istemal kar rahe hain
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    # 1. Prompts ki request
    prompt_query = "Generate 3 highly useful and trending ChatGPT prompts for developers or designers. Format them nicely with markdown headings."
    prompts_response = model.generate_content(prompt_query)
    prompts = prompts_response.text if prompts_response.text else "No prompts generated."
    
    # 2. Tech News ki request
    news_query = "Provide 2 latest technology news bullet points for today. Keep it short and exciting."
    news_response = model.generate_content(news_query)
    news = news_response.text if news_response.text else "No news available today."
    
    # 3. 1000 Words Article ki request
    article_query = "Write a comprehensive educational article on a trending AI or Tech topic. Include headings, introduction, and conclusion."
    article_response = model.generate_content(article_query)
    article = article_response.text if article_response.text else "No article generated."
    
    # Naya HTML page ka design aur content
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Trends Hub - Daily Updates</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f9; color: #333; }}
        .container {{ max-width: 800px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }}
        h1 {{ color: #007bff; text-align: center; }}
        h2 {{ color: #333; border-bottom: 2px solid #007bff; padding-bottom: 5px; margin-top: 30px; }}
        .date {{ text-align: center; color: #666; font-style: italic; }}
        .section {{ background: #fdfdfd; padding: 15px; border-left: 5px solid #007bff; margin: 10px 0; border-radius: 4px; white-space: pre-line; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>AI Trends Hub 🚀</h1>
        <p class="date">Updated on: {current_date}</p>
        
        <h2>Today's Top 3 AI Prompts</h2>
        <div class="section">{prompts}</div>
        
        <h2>Latest Tech News</h2>
        <div class="section">{news}</div>
        
        <h2>Featured Tech Article</h2>
        <div class="section">{article}</div>
    </div>
</body>
</html>"""

    # index.html file ko naye content ke sath rewrite karna
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(html_content)
    print("Website kamyaabi se update ho gayi!")

if __name__ == "__main__":
    generate_content()
