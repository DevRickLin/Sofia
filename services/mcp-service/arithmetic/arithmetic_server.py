from fastmcp import FastMCP
import re
from typing import List, Dict, Any
from pydantic import BaseModel

# Create FastMCP app
mcp = FastMCP("Arithmetic Tool")

class ArithmeticInput(BaseModel):
    """Model for arithmetic operation input"""
    expression: str

@mcp.tool()
def calculate(expression: str) -> dict:
    """
    Perform arithmetic calculations based on the provided expression.
    The function detects the operation type and extracts numbers from the text.
    
    Args:
        expression: A string containing an arithmetic expression like "add 5 and 10" or "multiply 3, 4, and 5"
        
    Returns:
        A dictionary containing the result, operation type, and the numbers used
    """
    # Parse the expression to extract operation and numbers
    operation, numbers = parse_arithmetic_expression(expression)
    
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
            raise ValueError("Division by zero is not allowed")
        result = numbers[0]
        for num in numbers[1:]:
            result /= num
    else:
        raise ValueError(f"Unsupported operation: {operation}")
    
    # Return response
    return {
        "result": result,
        "operation": operation,
        "numbers": numbers
    }

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
    mcp.run(transport="stdio") 