from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.requests import Request
from common.a2a.protocol import (
    SendTaskRequest,
    JSONRPCResponse,
    InvalidRequestError,
    JSONParseError,
    InternalError,
    AgentCard,
)
from pydantic import ValidationError
import json
from typing import Any
from common.server.task_manager import TaskManager
import uvicorn
import asyncio
from datetime import datetime

import logging

logger = logging.getLogger(__name__)

# Custom JSON encoder to handle datetime objects
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# Helper function to safely serialize Pydantic models with datetime objects
def serialize_model(model):
    """Safely serialize Pydantic models with datetime objects"""
    # First convert to dict with model_dump
    model_dict = model.model_dump(exclude_none=True)
    # Then use custom JSON encoder for datetime
    json_str = json.dumps(model_dict, cls=DateTimeEncoder)
    # Convert back to dict
    return json.loads(json_str)


class A2AServer:
    def __init__(
        self,
        host="0.0.0.0",
        port=5000,
        endpoint="/",
        agent_card: AgentCard = None,
        task_manager: TaskManager = None,
    ):
        self.host = host
        self.port = port
        self.endpoint = endpoint
        self.task_manager = task_manager
        self.agent_card = agent_card
        self.app = Starlette()
        self.app.add_route(self.endpoint, self._process_request, methods=["POST"])
        self.app.add_route(
            "/.well-known/agent.json", self._get_agent_card, methods=["GET"]
        )
        self.server = None

    def start(self):
        """Start the server in a blocking way (not async-friendly)"""
        if self.agent_card is None:
            raise ValueError("agent_card is not defined")

        if self.task_manager is None:
            raise ValueError("task_manager is not defined")

        # This blocks until the server is stopped - not async-friendly
        uvicorn.run(self.app, host=self.host, port=self.port)
        
    async def start_async(self):
        """Start the server in an async-friendly way"""
        if self.agent_card is None:
            raise ValueError("agent_card is not defined")

        if self.task_manager is None:
            raise ValueError("task_manager is not defined")
            
        # Use uvicorn's Server class directly for async compatibility
        config = uvicorn.Config(self.app, host=self.host, port=self.port)
        self.server = uvicorn.Server(config)
        await self.server.serve()

    def _get_agent_card(self, request: Request) -> JSONResponse:
        return JSONResponse(serialize_model(self.agent_card))

    async def _process_request(self, request: Request):
        try:
            body = await request.json()
            
            # Basic validation
            if not isinstance(body, dict) or "method" not in body:
                return self._handle_exception(
                    ValidationError(
                        ["Invalid request format"], model=SendTaskRequest
                    )
                )
                
            # Currently we only support tasks/send method for simplicity
            if body.get("method") == "tasks/send":
                json_rpc_request = SendTaskRequest(**body)
                result = await self.task_manager.on_send_task(json_rpc_request)
                # Use our serialize_model helper to safely handle datetime objects
                return JSONResponse(serialize_model(result))
            else:
                return self._handle_exception(
                    ValueError(f"Unsupported method: {body.get('method')}")
                )

        except Exception as e:
            return self._handle_exception(e)

    def _handle_exception(self, e: Exception) -> JSONResponse:
        if isinstance(e, json.decoder.JSONDecodeError):
            json_rpc_error = JSONParseError()
        elif isinstance(e, ValidationError):
            json_rpc_error = InvalidRequestError(data=str(e))
        else:
            logger.error(f"Unhandled exception: {e}")
            json_rpc_error = InternalError(message=str(e))

        response = JSONRPCResponse(id=None, error=json_rpc_error)
        return JSONResponse(serialize_model(response), status_code=400) 