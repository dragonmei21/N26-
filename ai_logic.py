import os
import json
from groq import Groq
from mock_data import USER_PROFILE, FINANCIAL_NEWS

# Initialize Groq Client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_personalized_news():
    user_context = f"User {USER_PROFILE['name']} has €{USER_PROFILE['balance']} and likes {', '.join(USER_PROFILE['interests'])}."
    
    news_string = ""
    for article in FINANCIAL_NEWS:
        news_string += f"ID {article['id']}: {article['title']} - {article['content']}\n"

    prompt = f"""
    You are an N26 AI Financial Curator. 
    Context: {user_context}
    
    News:
    {news_string}
    
    Task:
    Pick the 2 most relevant news items. 
    For each, explain:
    1. Why it matters to them personally.
    2. A simple 'ELI10' summary.
    3. An 'action' they could take in the N26 app (e.g., 'Move to Savings', 'Check Crypto').

    Return ONLY a JSON object like this:
    {{
        "articles": [
            {{"title": "...", "summary": "...", "impact": "...", "action_label": "..."}}
        ]
    }}
    """

    # Using Groq's super-fast inference
    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a helpful fintech assistant that only speaks JSON."},
            {"role": "user", "content": prompt}
        ],
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"} # Ensures valid JSON
    )
    
    return chat_completion.choices[0].message.content