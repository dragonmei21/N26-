import os
from openai import OpenAI

_client: OpenAI | None = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _client


def complete(prompt: str, temperature: float = 0.2, max_tokens: int = 400) -> str:
    """Single synchronous OpenAI call. Returns text or empty string on failure."""
    try:
        response = get_client().chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[llm] call failed: {e}")
        return ""


def complete_json(system: str, user: str, temperature: float = 0.2, max_tokens: int = 800) -> str:
    """
    OpenAI call with JSON mode enforced.
    Use for structured outputs (causal chain, event classifier).
    Returns raw JSON string or empty string on failure.
    """
    try:
        response = get_client().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            response_format={"type": "json_object"},
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[llm] complete_json failed: {e}")
        return ""
