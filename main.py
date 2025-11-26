from fastapi import FastAPI
from pydantic import BaseModel
import re
from datetime import datetime, timedelta

app = FastAPI()

# This defines the data we expect from Node.js
class Message(BaseModel):
    text: str

def extract_money(text):
    # Regex to find money patterns like $500, 500usd, 500 dollars
    match = re.search(r'\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:usd|dollars)?', text.lower())
    if match:
        return float(match.group(1).replace(',', ''))
    return 0.0

def extract_deadline(text):
    # Logic to convert words like "Friday" into actual dates
    text = text.lower()
    today = datetime.now()
    
    if "friday" in text:
        # Calculate days until next Friday
        days_ahead = (4 - today.weekday() + 7) % 7
        if days_ahead == 0: days_ahead = 7
        return today + timedelta(days=days_ahead)
    elif "monday" in text:
        days_ahead = (0 - today.weekday() + 7) % 7
        if days_ahead == 0: days_ahead = 7
        return today + timedelta(days=days_ahead)
    elif "tomorrow" in text:
        return today + timedelta(days=1)
    elif "next week" in text:
        return today + timedelta(days=7)
    
    # Default: If no date found, set it to 3 days from now
    return today + timedelta(days=3)

@app.post("/analyze")
async def analyze_text(msg: Message):
    print(f"🧠 AI Processing: {msg.text}")
    
    # 1. Extract Money
    budget = extract_money(msg.text)
    
    # 2. Extract Client Name 
    # (Simple logic: take the first capitalized word that isn't a common keyword)
    client_name = "New Client"
    words = msg.text.split()
    ignore_list = ["hi", "hello", "hey", "i", "we", "need", "urgent", "budget", "usd", "dollars", "please"]
    
    for word in words:
        clean_word = word.strip(".,?!")
        if clean_word[0].isupper() and clean_word.lower() not in ignore_list:
            client_name = clean_word
            break

    # 3. Extract Task Title
    task_title = "Freelance Project"
    lower_text = msg.text.lower()
    
    if "logo" in lower_text: task_title = "Logo Design"
    elif "website" in lower_text or "web" in lower_text: task_title = "Website Development"
    elif "app" in lower_text: task_title = "Mobile App Development"
    elif "write" in lower_text or "content" in lower_text: task_title = "Content Writing"
    elif "design" in lower_text: task_title = "Graphic Design"

    # 4. Extract Deadline
    deadline = extract_deadline(msg.text)

    # Return structured JSON to Node.js
    return {
        "client": client_name,
        "task": task_title,
        "budget": budget,
        "deadline": deadline.isoformat()
    }