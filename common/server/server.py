from starlette.applications import Starlette
from starlette.responses import JSONResponse, PlainTextResponse
from starlette.requests import Request
from starlette.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from common.a2a.protocol import (
    SendTaskRequest,
    SendTaskStreamingRequest,
    JSONRPCResponse,
    InvalidRequestError,
    JSONParseError,
    InternalError,
    AgentCard,
)
from pydantic import ValidationError
import json
import uuid
from typing import Any, AsyncIterable
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
        allow_origins: list[str] = ["*"],
        allow_methods: list[str] = ["GET", "POST", "OPTIONS"],
        allow_headers: list[str] = ["*"],
        allow_credentials: bool = False,
    ):
        self.host = host
        self.port = port
        self.endpoint = endpoint
        self.task_manager = task_manager
        self.agent_card = agent_card
        self.app = Starlette()
        
        # Add CORS middleware
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=allow_origins,
            allow_methods=allow_methods,
            allow_headers=allow_headers,
            allow_credentials=allow_credentials,
        )
        
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
                    ),
                    request_id=body.get("id", str(uuid.uuid4()))  # 获取请求中的id或生成一个
                )
                
            # Handle different methods
            if body.get("method") == "tasks/send":
                json_rpc_request = SendTaskRequest(**body)
                result = await self.task_manager.on_send_task(json_rpc_request)
                # Use our serialize_model helper to safely handle datetime objects
                return JSONResponse(serialize_model(result))
            elif body.get("method") == "tasks/send/stream":
                logger.info(f"Received streaming request: {body}")
                json_rpc_request = SendTaskStreamingRequest(**body)
                # 不对异步生成器使用await，直接传递给_create_streaming_response
                result = self.task_manager.on_send_task_streaming(json_rpc_request)
                
                # Check if we have streaming handlers
                has_streaming = hasattr(self.task_manager, "streaming_handlers") and len(self.task_manager.streaming_handlers) > 0
                logger.info(f"Has streaming handlers: {has_streaming}")
                
                # Create streaming response
                return self._create_streaming_response(result)
            else:
                return self._handle_exception(
                    ValueError(f"Unsupported method: {body.get('method')}"),
                    request_id=body.get("id", str(uuid.uuid4()))  # 获取请求中的id或生成一个
                )

        except Exception as e:
            logger.error(f"Error processing request: {e}")
            # 无法从请求中获取id时生成一个新的唯一id
            request_id = str(uuid.uuid4())
            return self._handle_exception(e, request_id=request_id)

    def _create_streaming_response(self, result: AsyncIterable) -> EventSourceResponse:
        """Create a streaming Server-Sent Events response"""
        async def event_generator(result) -> AsyncIterable[dict[str, str]]:
            try:
                async for item in result:
                    # Log the item 
                    logger.info(f"Streaming item: {item}")
                    
                    # Serialize the item to JSON
                    serialized = json.dumps(serialize_model(item))
                    yield {"data": serialized}
            except Exception as e:
                logger.error(f"Error in streaming generator: {e}")
                raise

        return EventSourceResponse(event_generator(result))

    def _handle_exception(self, e: Exception, request_id: str = "") -> JSONResponse:
        # 确保request_id始终是一个非空字符串
        if not request_id:
            request_id = str(uuid.uuid4())
            
        if isinstance(e, json.decoder.JSONDecodeError):
            json_rpc_error = JSONParseError()
        elif isinstance(e, ValidationError):
            json_rpc_error = InvalidRequestError(data=str(e))
        else:
            logger.error(f"Unhandled exception: {e}")
            json_rpc_error = InternalError(message=str(e))

        response = JSONRPCResponse(id=request_id, error=json_rpc_error)
        return JSONResponse(serialize_model(response), status_code=400) 