from starlette.applications import Starlette
from starlette.responses import JSONResponse, PlainTextResponse
from starlette.requests import Request
from sse_starlette.sse import EventSourceResponse
import uvicorn
import asyncio
import json
import logging

# Setup logging
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

app = Starlette()

@app.route("/", methods=["POST"])
async def handle_request(request: Request):
    try:
        body = await request.json()
        logger.info(f"Received request: {body}")
        
        # Handle different methods
        if body.get("method") == "tasks/send":
            # Regular request
            result = {
                "jsonrpc": "2.0",
                "id": body.get("id", "default-id"),
                "result": {
                    "id": body.get("params", {}).get("id", "task-id"),
                    "status": {
                        "state": "completed",
                        "timestamp": "2023-07-21T12:00:00Z"
                    },
                    "artifacts": [
                        {
                            "name": "response",
                            "parts": [
                                {
                                    "type": "text",
                                    "text": "This is a regular response."
                                }
                            ]
                        }
                    ]
                }
            }
            return JSONResponse(result)
            
        elif body.get("method") == "tasks/send/stream":
            # Streaming request
            logger.info("Preparing streaming response")
            return EventSourceResponse(stream_response(body.get("id", "default-id")))
            
        else:
            # Unsupported method
            return PlainTextResponse(
                f"Unsupported method: {body.get('method')}", 
                status_code=400
            )
            
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        return PlainTextResponse(f"Error: {str(e)}", status_code=500)

async def stream_response(request_id):
    """Generate streaming responses"""
    # First response: status update
    status_update = {
        "jsonrpc": "2.0",
        "id": request_id,
        "result": {
            "id": "task-id",
            "status": {
                "state": "working",
                "timestamp": "2023-07-21T12:00:00Z"
            },
            "final": False
        }
    }
    logger.info(f"Sending status update")
    yield {"data": json.dumps(status_update)}
    await asyncio.sleep(0.5)
    
    # Send a series of text chunks
    for i in range(5):
        artifact_update = {
            "jsonrpc": "2.0",
            "id": request_id,
            "result": {
                "id": "task-id",
                "artifact": {
                    "name": "response",
                    "parts": [
                        {
                            "type": "text",
                            "text": f"Chunk {i+1} of streaming response."
                        }
                    ]
                }
            }
        }
        logger.info(f"Sending chunk {i+1}")
        yield {"data": json.dumps(artifact_update)}
        await asyncio.sleep(0.5)
    
    # Final response: status update
    final_update = {
        "jsonrpc": "2.0",
        "id": request_id,
        "result": {
            "id": "task-id",
            "status": {
                "state": "completed",
                "timestamp": "2023-07-21T12:00:01Z"
            },
            "final": True
        }
    }
    logger.info(f"Sending final update")
    yield {"data": json.dumps(final_update)}

if __name__ == "__main__":
    print("Starting debug server on http://localhost:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning") 