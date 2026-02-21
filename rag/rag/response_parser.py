from models.news import AISummary
from models.causal import CausalChainResponse, PricedCausalStep, PriceData


def parse_summary(raw: dict, sources: list[str]) -> AISummary:
    return AISummary(
        plain_english=raw.get("plain_english", "Summary unavailable."),
        for_you=raw.get("for_you", ""),
        confidence=raw.get("confidence", "medium"),
        sources=sources,
        disclaimer=raw.get("disclaimer", "Educational only, not financial advice."),
    )


def parse_causal_chain(raw: dict, event: dict, price_timelines: dict) -> CausalChainResponse:
    chain_steps = []
    for step in raw.get("chain", []):
        ticker = step.get("ticker")
        price_data = None
        if ticker and ticker in price_timelines:
            pd = price_timelines[ticker]
            price_data = PriceData(
                type="timeline_with_event",
                title=f"{ticker} 30-day price",
                event_label=event["title"],
                data=pd,
            )
        chain_steps.append(PricedCausalStep(
            step_number=step.get("step_number", 0),
            event=step.get("event", ""),
            mechanism=step.get("mechanism", ""),
            affected_entity=step.get("affected_entity", ""),
            entity_type=step.get("entity_type", "company"),
            ticker=ticker,
            direction=step.get("direction", "neutral"),
            confidence=step.get("confidence", "medium"),
            plain_english=step.get("plain_english", ""),
            plain_english_eli10=step.get("plain_english_eli10", ""),
            price_data=price_data,
            price_change_pct=step.get("price_change_pct"),
            event_date=step.get("event_date", event["date"]),
        ))

    return CausalChainResponse(
        trigger_event=event["title"],
        trigger_date=event["date"],
        trigger_source_url=f"https://{event['source'].lower().replace(' ', '')}.com",
        chain=chain_steps,
        summary=raw.get("summary", ""),
        summary_eli10=raw.get("summary_eli10", ""),
        summary_bullets=raw.get("summary_bullets", []),
        summary_bullets_eli10=raw.get("summary_bullets_eli10", []),
        user_connection=raw.get("user_connection", ""),
        user_connection_eli10=raw.get("user_connection_eli10", ""),
        user_relevance_score=raw.get("user_relevance_score", 0.5),
        disclaimer="This is for educational purposes only and does not constitute financial advice. Past performance does not guarantee future results.",
    )
