from models.news import RawArticle


def score(article: RawArticle, ticker_interests: list[str]) -> float:
    """
    Score 0.0–1.0 based on how many of the user's tickers appear in the article.
    Falls back to keyword matching on category.
    """
    if not ticker_interests:
        return 0.5

    text = f"{article.title} {article.content}".upper()
    hits = sum(1 for t in ticker_interests if t.upper() in text)
    return round(min(hits / max(len(ticker_interests), 1), 1.0), 3)
