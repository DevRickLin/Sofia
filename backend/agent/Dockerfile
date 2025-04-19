FROM python:3.10-slim

WORKDIR /app

# Copy requirements
COPY agent/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY agent/src ./agent/src
COPY common ./common
COPY mcp_tools/arithmetic_tool/src ./mcp_tools/arithmetic_tool/src

# Set Python path
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Run the service
CMD ["python", "agent/src/main.py"] 