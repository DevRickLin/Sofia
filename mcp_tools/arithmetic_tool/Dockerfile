FROM python:3.10-slim

WORKDIR /app

# Copy requirements
COPY mcp_tools/arithmetic_tool/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY mcp_tools/arithmetic_tool/src ./mcp_tools/arithmetic_tool/src
COPY common ./common

# Set Python path
ENV PYTHONPATH=/app

# Expose port
EXPOSE 5001

# Run the service
CMD ["python", "mcp_tools/arithmetic_tool/src/tool.py"]