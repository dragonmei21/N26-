from datetime import datetime, timedelta
import random


def sparkline_data(ticker: str, days: int = 7, base: float = 100.0, color: str = "#00D4A8") -> dict:
    random.seed(ticker)
    labels = []
    values = []
    now = datetime.utcnow()
    for i in range(days):
        d = now - timedelta(days=days - i)
        labels.append(f"{d.month}/{d.day}")
        noise = (random.random() - 0.5) * base * 0.02
        values.append(round(base + noise * (i + 1), 2))
    return {
        "type": "sparkline",
        "title": f"{ticker} 7-day",
        "data": {"labels": labels, "values": values},
        "color": color,
    }


def line_chart_data(title: str, label: str, labels: list, values: list, color: str = "#00D4A8") -> dict:
    return {
        "type": "line_chart",
        "title": title,
        "data": {
            "labels": labels,
            "datasets": [{"id": label.lower().replace(" ", "_"), "label": label, "color": color, "values": values}],
        },
        "annotation": None,
    }


def category_chart(article_category: str, title: str) -> dict:
    CATEGORY_CHARTS = {
        "macro": {
            "type": "line_chart",
            "title": "ECB Rate History (12 months)",
            "data": {
                "labels": ["Feb 25", "Mar 25", "Apr 25", "May 25", "Jun 25", "Jul 25", "Aug 25", "Sep 25", "Oct 25", "Nov 25", "Dec 25", "Jan 26", "Feb 26"],
                "datasets": [{"id": "ecb_rate", "label": "ECB Rate (%)", "color": "#00D4A8", "values": [4.0, 3.75, 3.75, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5]}],
            },
            "annotation": "Rate held steady for 7 months",
        },
        "crypto": {
            "type": "sparkline",
            "title": "Bitcoin 7-day price",
            "data": {
                "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                "values": [82000, 85000, 88000, 86000, 90000, 93000, 94000],
            },
            "color": "#F7931A",
        },
        "etf": {
            "type": "comparison_bar",
            "title": "Top Fund Allocations",
            "data": {
                "categories": ["Euro Bonds", "EU Equities", "US Equities", "Cash", "Commodities"],
                "datasets": [
                    {"label": "Vanguard", "color": "#00D4A8", "values": [35, 28, 20, 12, 5]},
                    {"label": "BlackRock", "color": "#6C5CE7", "values": [20, 35, 30, 10, 5]},
                ],
            },
        },
        "stocks": {
            "type": "sparkline",
            "title": f"{title[:20]} trend",
            "data": {
                "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                "values": [100, 101.5, 99.8, 102.3, 103.1, 104.5, 105.2],
            },
            "color": "#00D4A8",
        },
    }
    return CATEGORY_CHARTS.get(article_category, CATEGORY_CHARTS["stocks"])
