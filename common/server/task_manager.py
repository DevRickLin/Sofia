from typing import AsyncIterable, Any, Dict, Callable, Awaitable, Optional, Union
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
    SendTaskStreamingRequest,
    SendTaskStreamingResponse,
)
import logging
from uuid import uuid4

logger = logging.getLogger(__name__)

class TaskManager:
    def __init__(self):
        self.tasks: Dict[str, Task] = {}
        self.handlers: Dict[str, Callable[[Message], Awaitable[Union[str, Dict[str, Any]]]]] = {}
        # For streaming handlers
        self.streaming_handlers: Dict[str, Callable[[Message], AsyncIterable[Union[str, Dict[str, Any]]]]] = {}

    def register_handler(self, handler: Callable[[Message], Awaitable[Union[str, Dict[str, Any]]]]):
        """Register a handler for processing tasks"""
        handler_id = str(uuid4())
        self.handlers[handler_id] = handler
        logger.info(f"Registered handler with ID: {handler_id}")
        return handler_id
        
    def register_streaming_handler(self, handler: Callable[[Message], AsyncIterable[Union[str, Dict[str, Any]]]]):
        """Register a streaming handler for processing tasks"""
        handler_id = str(uuid4())
        self.streaming_handlers[handler_id] = handler
        logger.info(f"Registered streaming handler with ID: {handler_id}")
        return handler_id

    async def on_send_task(self, request: SendTaskRequest) -> JSONRPCResponse:
        """Handle a new task request"""
        try:
            # Extract task parameters
            task_params = request.params
            task_id = task_params.id

            logger.info(f"Task params: {task_params}")

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
            
    async def on_send_task_streaming(self, request: SendTaskStreamingRequest) -> AsyncIterable[SendTaskStreamingResponse]:
        """Handle a new streaming task request"""
        try:
            # Extract task parameters
            task_params = request.params
            task_id = task_params.id
            
            logger.info(f"Starting streaming task with ID: {task_id}")
            logger.info(f"Available streaming handlers: {len(self.streaming_handlers)}")

            logger.info(f"Task params: {task_params}")

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
            
            # First response: task submitted
            status_update = TaskStatusUpdateEvent(
                id=task_id,
                status=TaskStatus(state=TaskState.SUBMITTED),
                final=False
            )
            logger.info(f"Yielding initial status update for task: {task_id}")
            yield SendTaskStreamingResponse(id=request.id, result=status_update)
            
            # Stream task processing
            logger.info(f"Starting to stream task processing for: {task_id}")
            async for response in self._stream_task_processing(task_id, task_params.message, request.id):
                logger.info(f"Yielding streaming response for task: {task_id}")
                yield response
            
        except Exception as e:
            logger.error(f"Error processing streaming task: {e}")
            # Return error response
            yield SendTaskStreamingResponse(
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
            
    async def _stream_task_processing(self, task_id: str, message: Message, request_id: str) -> AsyncIterable[SendTaskStreamingResponse]:
        """Stream task processing with registered streaming handlers"""
        task = self.tasks.get(task_id)
        if not task:
            logger.error(f"Task not found: {task_id}")
            return
        
        # Update and stream task status to working
        task.status.state = TaskState.WORKING
        status_update = TaskStatusUpdateEvent(
            id=task_id,
            status=TaskStatus(state=TaskState.WORKING),
            final=False
        )
        logger.info(f"Task {task_id} status set to WORKING")
        yield SendTaskStreamingResponse(id=request_id, result=status_update)
        
        try:
            # Check if we have streaming handlers
            if not self.streaming_handlers:
                logger.warning("No streaming handlers registered, falling back to regular handlers")
                # Fall back to regular handlers
                for handler_id, handler in self.handlers.items():
                    logger.info(f"Using regular handler {handler_id} for streaming")
                    result = await handler(message)
                    
                    # Create and stream artifact from result
                    if isinstance(result, str):
                        # Text response
                        logger.info(f"Creating text artifact from string: {result[:50]}...")
                        artifact = self._create_text_artifact(result)
                    elif isinstance(result, dict):
                        # Data response
                        logger.info(f"Creating data artifact from dict with keys: {list(result.keys())}")
                        artifact = self._create_data_artifact(result)
                    else:
                        # Unsupported response
                        logger.warning(f"Unsupported result type: {type(result)}")
                        continue
                        
                    # Add artifact to task and stream it
                    if not task.artifacts:
                        task.artifacts = []
                    task.artifacts.append(artifact)
                    
                    artifact_update = TaskArtifactUpdateEvent(
                        id=task_id,
                        artifact=artifact
                    )
                    logger.info(f"Streaming artifact update from regular handler")
                    yield SendTaskStreamingResponse(id=request_id, result=artifact_update)
            else:
                # Use streaming handlers
                logger.info(f"Using {len(self.streaming_handlers)} streaming handlers")
                for handler_id, streaming_handler in self.streaming_handlers.items():
                    logger.info(f"Invoking streaming handler {handler_id}")
                    try:
                        chunk_counter = 0
                        async for chunk in streaming_handler(message):
                            chunk_counter += 1
                            logger.info(f"Got chunk {chunk_counter} from streaming handler: {chunk}")
                            
                            # Process each chunk
                            if isinstance(chunk, str):
                                # Text chunk
                                logger.info(f"Creating text artifact from chunk: {chunk[:50]}...")
                                artifact = self._create_text_artifact(chunk)
                            elif isinstance(chunk, dict):
                                # Data chunk
                                logger.info(f"Creating data artifact from chunk with keys: {list(chunk.keys())}")
                                artifact = self._create_data_artifact(chunk)
                            else:
                                # Unsupported chunk
                                logger.warning(f"Unsupported chunk type: {type(chunk)}")
                                continue
                                
                            # Add artifact to task and stream it
                            if not task.artifacts:
                                task.artifacts = []
                            task.artifacts.append(artifact)
                            
                            artifact_update = TaskArtifactUpdateEvent(
                                id=task_id,
                                artifact=artifact
                            )
                            logger.info(f"Yielding artifact update from streaming handler chunk {chunk_counter}")
                            yield SendTaskStreamingResponse(id=request_id, result=artifact_update)
                        
                        logger.info(f"Streaming handler {handler_id} completed with {chunk_counter} chunks")
                    except Exception as e:
                        logger.error(f"Error in streaming handler {handler_id}: {e}")
            
            # Update task status to completed
            task.status.state = TaskState.COMPLETED
            status_update = TaskStatusUpdateEvent(
                id=task_id,
                status=TaskStatus(state=TaskState.COMPLETED),
                final=True
            )
            logger.info(f"Task {task_id} status set to COMPLETED")
            yield SendTaskStreamingResponse(id=request_id, result=status_update)
            
        except Exception as e:
            logger.error(f"Error during streaming task processing: {e}")
            task.status.state = TaskState.FAILED
            status_update = TaskStatusUpdateEvent(
                id=task_id,
                status=TaskStatus(state=TaskState.FAILED),
                final=True
            )
            logger.info(f"Task {task_id} status set to FAILED due to: {e}")
            yield SendTaskStreamingResponse(id=request_id, result=status_update)
    
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