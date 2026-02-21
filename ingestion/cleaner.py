import re
from bs4 import BeautifulSoup
from models.news import RawArticle


def strip_html(text: str) -> str:
    """Remove HTML tags and decode entities. Skip parsing if no HTML detected."""
    if "<" not in text:
        return text
    return BeautifulSoup(text, "html.parser").get_text(separator=" ")


def normalize(text: str) -> str:
    """Collapse whitespace, remove control characters."""
    text = re.sub(r"[\r\n\t]+", " ", text)
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip()


def clean_article(article: RawArticle) -> RawArticle:
    """Return a copy of the article with cleaned content and title."""
    cleaned_content = normalize(strip_html(article.content))
    cleaned_title = normalize(strip_html(article.title))
    return article.model_copy(update={
        "content": cleaned_content,
        "title": cleaned_title,
    })


def clean_articles(articles: list[RawArticle]) -> list[RawArticle]:
    return [clean_article(a) for a in articles]
