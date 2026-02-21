import os
import json
from groq import Groq

_client: Groq | None = None


def get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client


def call_llm(prompt: str, system: str, temperature: float = 0.2, max_tokens: int = 1024) -> dict:
    client = get_client()
    response = client.chat.completions.create(
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"},
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return json.loads(response.choices[0].message.content)
