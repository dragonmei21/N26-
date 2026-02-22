import os
import openai
from pathlib import Path

N26_VOICE = "onyx"  # deep, authoritative male voice — Economist/FT tone


async def generate_audio(full_text: str, user_id: str, podcast_id: str) -> str:
    """Convert script text to MP3. Returns file path."""
    output_path = Path(f"/tmp/audio/{user_id}_{podcast_id}.mp3")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    client = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    chunks = _split_for_tts(full_text)

    with open(output_path, "wb") as f:
        for chunk in chunks:
            response = await client.audio.speech.create(
                model="tts-1",
                voice=N26_VOICE,
                input=chunk,
                response_format="mp3"
            )
            f.write(response.content)

    return str(output_path)


def _split_for_tts(text: str, max_chars: int = 4000) -> list[str]:
    """Split at sentence boundaries to respect OpenAI 4096 char limit."""
    if len(text) <= max_chars:
        return [text]

    sentences = text.replace(". ", ".|").split("|")
    chunks, current = [], ""

    for s in sentences:
        if len(current) + len(s) < max_chars:
            current += s + " "
        else:
            if current:
                chunks.append(current.strip())
            current = s + " "

    if current:
        chunks.append(current.strip())

    return chunks
