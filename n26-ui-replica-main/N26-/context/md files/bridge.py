import time
import json
import uuid
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, JSONResponse
from curl_cffi.requests import AsyncSession

app = FastAPI()

TARGET_URL = "https://playground.outlier.ai/internal/experts/assistant/conversations/6998a8c379cabfc244b65f13/turn-streaming"

INITIAL_COOKIES = {
    "_jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzNjgyMjY4Zi03ODcxLTQ0ZjktYjk0Yy1mZDEzZDcwNzk5OTciLCJ1c2VySWQiOiI2OGI5NjAwODhmYTk2YTk4OWI3MzgzZjMiLCJzdGFydGVkQXQiOjE3NzE2MTIyMjA3MTgsIm1heFJlZnJlc2giOjE3NzY3OTYyMjA3MTgsImlhdCI6MTc3MTYxMjIyMCwiZXhwIjoxNzcxODcxNDIwfQ.NizeWU9-1iZalczD8V5uZKYEWH6qE1Bpyck99hyV4Z4",
    "_session": "eyJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uSWQiOiIzNjgyMjY4Zi03ODcxLTQ0ZjktYjk0Yy1mZDEzZDcwNzk5OTc6NjhiOTYwMDg4ZmE5NmE5ODliNzM4M2YzOnYxIiwic2Vzc2lvbkV4cGlyeSI6IjIwMjYtMDgtMTlUMTg6MzA6NTguODkxWiIsInNlc3Npb25UeXBlIjoiY29udHJpYnV0b3IiLCJzdGF0ZSI6ImV5SnlaV1JwY21WamRGVnliQ0k2SWk4aWZRPT0iLCJleHAiOjE3ODcxNjQyNTguODkxfQ.FAaZD6lAjqgooCOQJpjD-fxWBHUQVCbtJ4ASE7Q85oM",
    "ajs_anonymous_id": "5f208a45-4e74-4914-b388-5d1d2f24d3f1"
}

INITIAL_HEADERS = {
    "X-CSRF-Token": "uw9r6ezsz62GkAbfflJxy36Uz+sZYuTpGPN2rbBge6c=:V2jhfIPPZo8mRHCotb6G9w==",
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0"
}

client_session = AsyncSession(impersonate="chrome120", headers=INITIAL_HEADERS, cookies=INITIAL_COOKIES)


def extract_prompt(messages):
    if not messages: return ""
    last_msg = messages[-1].get("content", "")
    if isinstance(last_msg, list):
        return " ".join([block.get("text", "") for block in last_msg if block.get("type") == "text"])
    return str(last_msg)


def create_outlier_payload(prompt_text):
    return {
        "prompt": {"text": prompt_text, "images": []},
        "model": "claude-opus-4-6",
        "modelId": "6984f819cfe8911f7189318e",
        "isMysteryModel": False,
        "systemMessage": ""
    }


@app.post("/api/event_logging/batch")
async def handle_telemetry(request: Request):

    return JSONResponse(content={"status": "success", "discarded": True})



#tokencount

@app.post("/v1/messages/count_tokens")
async def count_tokens(request: Request):

    body = await request.json()
    prompt_text = extract_prompt(body.get("messages", []))

    #tokdivision
    estimated_tokens = len(prompt_text) // 4
    if estimated_tokens == 0: estimated_tokens = 1

    return JSONResponse(content={"input_tokens": estimated_tokens})



# Claude CLI


@app.post("/v1/messages")
async def anthropic_endpoint(request: Request):
    body = await request.json()
    prompt_text = extract_prompt(body.get("messages", []))
    payload = create_outlier_payload(prompt_text)

    async def event_generator():
        msg_id = f"msg_{uuid.uuid4().hex[:24]}"


        start_payload = {
            'type': 'message_start',
            'message': {
                'id': msg_id, 'type': 'message', 'role': 'assistant',
                'content': [], 'model': 'claude-opus-4-6',
                'stop_reason': None, 'stop_sequence': None,
                'usage': {'input_tokens': 10, 'output_tokens': 1}
            }
        }
        yield f"event: message_start\ndata: {json.dumps(start_payload)}\n\n"
        yield f"event: content_block_start\ndata: {json.dumps({'type': 'content_block_start', 'index': 0, 'content_block': {'type': 'text', 'text': ''}})}\n\n"


        response = await client_session.post(TARGET_URL, json=payload, stream=True, timeout=600)

        remaining = response.headers.get("x-ratelimit-remaining", "Unknown")
        reset_timestamp = response.headers.get("x-ratelimit-reset")

        reset_clock = "Unknown"
        if reset_timestamp and reset_timestamp.isdigit():

            reset_clock = time.strftime('%H:%M:%S', time.localtime(int(reset_timestamp)))

        print(f"[GAS GAUGE] Requests: {remaining}/200 | Refills at: {reset_clock}")

        async for line in response.aiter_lines():
            if line:
                decoded = line.decode('utf-8').strip()
                if decoded.startswith("data: "):
                    data_str = decoded[6:]
                    if data_str == "[DONE]": break

                    try:
                        data_json = json.loads(data_str)
                        choices = data_json.get("choices", [])
                        if choices:
                            content = choices[0].get("delta", {}).get("content")
                            if content:

                                yield f"event: content_block_delta\ndata: {json.dumps({'type': 'content_block_delta', 'index': 0, 'delta': {'type': 'text_delta', 'text': content}})}\n\n"
                    except json.JSONDecodeError:
                        continue

        #out->tok met
        yield f"event: content_block_stop\ndata: {json.dumps({'type': 'content_block_stop', 'index': 0})}\n\n"

        stop_payload = {
            'type': 'message_delta',
            'delta': {'stop_reason': 'end_turn', 'stop_sequence': None},
            'usage': {'output_tokens': 50}
        }
        yield f"event: message_delta\ndata: {json.dumps(stop_payload)}\n\n"
        yield f"event: message_stop\ndata: {json.dumps({'type': 'message_stop'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8080)