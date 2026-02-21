import json
from rag.llm_client import complete

SYSTEM_PROMPT = """You are generating an educational portfolio reflection after a macro investment event has been explained.

This is NOT financial advice.

Input Fields:
- exposure_type: direct | indirect | none
- dominant_sector: string
- risk_alignment: aligned | volatility_mismatch | sector_concentration
- strategy_type: conservative | moderate | growth
- emergency_months: number

Your Task:
Generate JSON with exactly these keys:
- portfolio_exposure
- risk_alignment
- educational_next_step
- confidence

Rules:
- Max 90 words total across all fields.
- Educational, neutral tone.
- No buy/sell language.
- No allocation suggestions.
- No timing guidance.
- Use probabilistic language (may, can, tends to).
- Frame as reflection, not instruction.
- End educational_next_step with: "Educational only, not financial advice."

Exposure Logic:
- direct → user holds affected companies/sector directly
- indirect → exposure via broad ETF
- none → no meaningful exposure

Risk Logic:
- volatility_mismatch → high volatility asset + less than 3 months emergency fund
- sector_concentration → heavy exposure concentrated in same sector
- aligned → no structural mismatch detected

Confidence:
- high → direct exposure
- medium → indirect exposure
- low → weak or no exposure

Return valid JSON only. No markdown, no explanation."""


def build_reflection_prompt(
    exposure_type: str,
    dominant_sector: str,
    risk_alignment: str,
    strategy_type: str,
    emergency_months: float,
) -> str:
    return f"""{SYSTEM_PROMPT}

Input:
{{
  "exposure_type": "{exposure_type}",
  "dominant_sector": "{dominant_sector}",
  "risk_alignment": "{risk_alignment}",
  "strategy_type": "{strategy_type}",
  "emergency_months": {emergency_months}
}}"""


def generate_reflection(
    exposure_type: str,
    dominant_sector: str,
    risk_alignment: str,
    strategy_type: str,
    emergency_months: float,
) -> dict:
    """
    Generate an educational portfolio reflection for a macro event.
    Returns structured dict with portfolio_exposure, risk_alignment,
    educational_next_step, confidence.
    """
    prompt = build_reflection_prompt(
        exposure_type=exposure_type,
        dominant_sector=dominant_sector,
        risk_alignment=risk_alignment,
        strategy_type=strategy_type,
        emergency_months=emergency_months,
    )

    raw = complete(prompt, temperature=0.2, max_tokens=200)

    try:
        return json.loads(raw)
    except Exception:
        # Safe fallback — never crash the feed
        return {
            "portfolio_exposure": f"Your portfolio may have {exposure_type} exposure to the {dominant_sector} sector.",
            "risk_alignment": "Unable to assess risk alignment at this time.",
            "educational_next_step": "Consider reviewing your holdings in relation to this event. Educational only, not financial advice.",
            "confidence": "low",
        }
