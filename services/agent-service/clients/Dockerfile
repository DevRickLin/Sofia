FROM python:3.10-slim

WORKDIR /app

# Copy requirements
COPY clients/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY clients/src ./clients/src
COPY common ./common

# Set Python path
ENV PYTHONPATH=/app

# Run the service
CMD ["python", "clients/src/client.py"]