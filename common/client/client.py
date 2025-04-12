import httpx
from typing import Any, Dict
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
)
import json
from uuid import uuid4


class A2AClient:
    def __init__(self, agent_card: AgentCard = None, url: str = None):
        if agent_card:
            self.url = agent_card.url
        elif url:
            self.url = url
        else:
            raise ValueError("Must provide either agent_card or url")

    async def send_task(self, message: str or Dict[str, Any]) -> SendTaskResponse:
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
        request = SendTaskRequest(params=payload)
        return SendTaskResponse(**await self._send_request(request))

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