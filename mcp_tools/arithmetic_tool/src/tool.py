import re
import logging
import json
from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Arithmetic Tool")

class Operation(BaseModel):
    """Model for arithmetic operations"""
    operation: str
    numbers: List[float]

class ToolResponse(BaseModel):
    """Model for tool response"""
    result: float
    operation: str
    numbers: List[float]

@app.post("/operate")
async def operate(request: Request):
    """Endpoint to perform arithmetic operations"""
    try:
        # Parse request body
        body = await request.json()
        logger.info(f"Received request: {body}")
        
        # Extract operation details
        if "content" not in body:
            raise HTTPException(status_code=400, detail="Missing content field")
        
        content = body["content"]
        
        # Parse content to extract operation and numbers
        operation, numbers = parse_arithmetic_expression(content)
        
        # Perform calculation
        if operation == "add":
            result = sum(numbers)
        elif operation == "subtract":
            result = numbers[0] - sum(numbers[1:]) if numbers else 0
        elif operation == "multiply":
            result = 1
            for num in numbers:
                result *= num
        elif operation == "divide":
            if 0 in numbers[1:]:
                raise HTTPException(status_code=400, detail="Division by zero")
            result = numbers[0]
            for num in numbers[1:]:
                result /= num
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported operation: {operation}")
        
        # Create response
        response = ToolResponse(
            result=result,
            operation=operation,
            numbers=numbers
        )
        
        logger.info(f"Sending response: {response.model_dump()}")
        return response.model_dump()
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def parse_arithmetic_expression(content: str) -> tuple[str, List[float]]:
    """Parse an arithmetic expression from text content"""
    # Try to detect operation from keywords
    content = content.lower()
    
    if "add" in content or "sum" in content or "plus" in content or "+" in content:
        operation = "add"
    elif "subtract" in content or "minus" in content or "-" in content:
        operation = "subtract"
    elif "multiply" in content or "product" in content or "times" in content or "*" in content:
        operation = "multiply"
    elif "divide" in content or "quotient" in content or "divided by" in content or "/" in content:
        operation = "divide"
    else:
        # Default to addition if no operation is specified
        operation = "add"
    
    # Extract numbers
    numbers = []
    for num_str in re.findall(r'-?\d+\.?\d*', content):
        try:
            numbers.append(float(num_str))
        except ValueError:
            continue
    
    return operation, numbers

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("tool:app", host="0.0.0.0", port=5001, reload=True) 