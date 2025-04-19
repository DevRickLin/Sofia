import httpx
import logging
import os
from dotenv import load_dotenv
from typing import Dict, Any

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ArithmeticToolClient:
    """Client for the arithmetic tool service"""
    
    def __init__(self, base_url: str = None):
        """Initialize the client with the service URL"""
        self.base_url = base_url or os.getenv("ARITHMETIC_TOOL_URL", "http://localhost:5001")
        self.operate_url = f"{self.base_url}/operate"
    
    async def calculate(self, expression: str) -> Dict[str, Any]:
        """Send a calculation request to the arithmetic tool service"""
        try:
            logger.info(f"Sending calculation request: {expression}")
            
            # Prepare request payload
            payload = {
                "content": expression
            }
            
            # Send request
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.operate_url,
                    json=payload,
                    timeout=10.0
                )
                
                # Raise for non-2xx status codes
                response.raise_for_status()
                
                # Parse response
                result = response.json()
                logger.info(f"Received calculation result: {result}")
                return result
                
        except httpx.RequestError as e:
            logger.error(f"Error making request to arithmetic tool: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise 