import httpx
from httpx_sse import connect_sse
from typing import Any, Dict, AsyncIterable
from common.a2a.protocol import (
    AgentCard,
    SendTaskRequest,
    SendTaskResponse,
    JSONRPCRequest,
    A2AClientHTTPError,
    A2AClientJSONError,
    Message,
    TextPart,
    DataPart,
    SendTaskStreamingRequest,
    SendTaskStreamingResponse,
)
import json
from uuid import uuid4
import logging

logger = logging.getLogger(__name__)

class A2AClient:
    def __init__(self, agent_card: AgentCard = None, url: str = None):
        if agent_card:
            self.url = agent_card.url
        elif url:
            self.url = url
        else:
            raise ValueError("Must provide either agent_card or url")

    async def send_task(self, message: str or Dict[str, Any], id: str = None) -> SendTaskResponse:
        """Send a task to the agent"""
        # Create message object
        if isinstance(message, str):
            # String message
            msg = Message(
                role="user",
                parts=[TextPart(text=message)]
            )
        elif isinstance(message, dict):
            # Data message
            msg = Message(
                role="user",
                parts=[DataPart(data=message)]
            )
        else:
            raise ValueError(f"Unsupported message type: {type(message)}")
        
        # Create task payload
        task_id = str(uuid4())
        payload = {
            "id": task_id,
            "sessionId": str(uuid4()),
            "message": msg.model_dump()
        }
        
        # Create request
        request = SendTaskRequest(params=payload, id=id or str(uuid4()))
        return SendTaskResponse(**await self._send_request(request))
    
    async def send_task_streaming(self, message: str or Dict[str, Any], id: str = None) -> AsyncIterable[SendTaskStreamingResponse]:
        """Send a task to the agent and receive streaming responses"""
        # Create message object
        if isinstance(message, str):
            # String message
            msg = Message(
                role="user",
                parts=[TextPart(text=message)]
            )
        elif isinstance(message, dict):
            # Data message
            msg = Message(
                role="user",
                parts=[DataPart(data=message)]
            )
        else:
            raise ValueError(f"Unsupported message type: {type(message)}")
        
        # Create task payload
        task_id = str(uuid4())
        request_id = id or str(uuid4())
        payload = {
            "id": task_id,
            "sessionId": str(uuid4()),
            "message": msg.model_dump()
        }
        
        # Create streaming request
        request = SendTaskStreamingRequest(params=payload, id=request_id)
        logger.info(f"Sending streaming request with ID {request_id}")
        
        with httpx.Client(timeout=None) as client:
            try:
                logger.info(f"Connecting to SSE stream at {self.url}")
                with connect_sse(
                    client, "POST", self.url, json=request.model_dump()
                ) as event_source:
                    try:
                        for sse in event_source.iter_sse():
                            logger.info(f"Received SSE event: {sse.data[:100]}...")
                            response_data = json.loads(sse.data)
                            yield SendTaskStreamingResponse(**response_data)
                    except json.JSONDecodeError as e:
                        logger.error(f"JSON decode error: {e}, data: {sse.data[:100]}...")
                        raise A2AClientJSONError(str(e)) from e
            except httpx.RequestError as e:
                logger.error(f"HTTP request error: {e}")
                raise A2AClientHTTPError(400, str(e)) from e

    async def _send_request(self, request: JSONRPCRequest) -> dict[str, Any]:
        """Send a request to the agent"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.url, json=request.model_dump(), timeout=30
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                raise A2AClientHTTPError(e.response.status_code, str(e)) from e
            except json.JSONDecodeError as e:
                raise A2AClientJSONError(str(e)) from e 