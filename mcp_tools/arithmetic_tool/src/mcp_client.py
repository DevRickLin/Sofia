import httpx
import logging
from typing import Dict, Any

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ArithmeticToolClient:
    """Client for the arithmetic tool service"""
    
    def __init__(self, base_url: str = "http://localhost:5001"):
        """Initialize the client with the service URL"""
        self.base_url = base_url
        self.operate_url = f"{base_url}/operate"
    
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