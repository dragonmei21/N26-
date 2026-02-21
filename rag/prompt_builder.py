from models.news import RawArticle


def build_summary_prompt(article: RawArticle, spend_summary: str) -> str:
    return f"""You are a financial news assistant for N26 bank customers.

Article title: {article.title}
Article content: {article.content}
User context: {spend_summary}

Write a JSON response with exactly these two fields:
- "plain_english": one sentence explaining what happened and why it matters (max 30 words)
- "for_you": one sentence connecting this news to the user's spending or savings (max 25 words)

Respond ONLY with valid JSON. No markdown, no explanation."""
