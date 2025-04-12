from typing import AsyncIterable, Any, Dict, Callable, Awaitable, Optional
import asyncio
from common.a2a.protocol import (
    Task,
    TaskStatus,
    TaskState,
    Message,
    SendTaskRequest,
    SendTaskResponse,
    JSONRPCResponse,
    TaskArtifactUpdateEvent,
    TaskStatusUpdateEvent,
    Artifact,
    JSONRPCError,
)
import logging
from uuid import uuid4

logger = logging.getLogger(__name__)

class TaskManager:
    def __init__(self):
        self.tasks: Dict[str, Task] = {}
        self.handlers: Dict[str, Callable[[Message], Awaitable[Any]]] = {}

    def register_handler(self, handler: Callable[[Message], Awaitable[Any]]):
        """Register a handler for processing tasks"""
        handler_id = str(uuid4())
        self.handlers[handler_id] = handler
        return handler_id

    async def on_send_task(self, request: SendTaskRequest) -> JSONRPCResponse:
        """Handle a new task request"""
        try:
            # Extract task parameters
            task_params = request.params
            task_id = task_params.id
            
            # Create initial task
            task = Task(
                id=task_id,
                sessionId=task_params.sessionId,
                status=TaskStatus(
                    state=TaskState.SUBMITTED,
                ),
                history=[task_params.message] if task_params.message else [],
            )
            self.tasks[task_id] = task

            # Process the task asynchronously
            asyncio.create_task(self._process_task(task_id, task_params.message))
            
            # Return the initial task
            return SendTaskResponse(id=request.id, result=task)
            
        except Exception as e:
            logger.error(f"Error processing task: {e}")
            return SendTaskResponse(
                id=request.id,
                error=JSONRPCError(
                    code=-32603,
                    message=f"Internal error: {str(e)}",
                )
            )

    async def _process_task(self, task_id: str, message: Message):
        """Process a task with registered handlers"""
        task = self.tasks.get(task_id)
        if not task:
            return
        
        # Update task status to working
        task.status.state = TaskState.WORKING
        
        try:
            # Process the message with all handlers
            for handler_id, handler in self.handlers.items():
                result = await handler(message)
                
                # Create artifact from result
                if isinstance(result, str):
                    # Text response
                    artifact = self._create_text_artifact(result)
                elif isinstance(result, dict):
                    # Data response
                    artifact = self._create_data_artifact(result)
                else:
                    # Unsupported response
                    logger.warning(f"Unsupported result type: {type(result)}")
                    continue
                    
                # Add artifact to task
                if not task.artifacts:
                    task.artifacts = []
                task.artifacts.append(artifact)
            
            # Update task status to completed
            task.status.state = TaskState.COMPLETED
            
        except Exception as e:
            logger.error(f"Error during task processing: {e}")
            task.status.state = TaskState.FAILED
    
    def _create_text_artifact(self, text: str) -> Artifact:
        """Create a text artifact from a string"""
        from common.a2a.protocol import TextPart
        
        return Artifact(
            name="response",
            parts=[
                TextPart(
                    text=text
                )
            ]
        )
    
    def _create_data_artifact(self, data: Dict[str, Any]) -> Artifact:
        """Create a data artifact from a dictionary"""
        from common.a2a.protocol import DataPart
        
        return Artifact(
            name="result",
            parts=[
                DataPart(
                    data=data
                )
            ]
        ) 