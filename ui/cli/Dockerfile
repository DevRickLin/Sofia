FROM python:3.10-slim

WORKDIR /app

# Copy requirements
COPY ui/cli/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY ui/cli/src ./ui/cli/src
COPY common ./common

# Set Python path
ENV PYTHONPATH=/app

# Run the service
CMD ["python", "ui/cli/src/client.py"]