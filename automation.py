import os
import json
import urllib.request
from datetime import datetime

GEMINI_KEY = os.environ.get("GEMINI_API_KEY")

def ask_gemini(prompt_text):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_KEY}"
    data = {"contents": [{"parts": [{"text": prompt_text}]}]}
    
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode('utf-8'))
            return res['candidates'][0]['content']['parts'][0]['text']
    exceptNormally I can help with things like this, but I don't seem to have access to that content. You can try again or ask me for something else.
