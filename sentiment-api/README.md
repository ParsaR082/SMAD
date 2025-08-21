# SMAD Sentiment Analysis API

A high-accuracy sentiment analysis service using HuggingFace transformers, built with FastAPI.

## Features

- **High-accuracy sentiment analysis** using RoBERTa-based models
- **Emotion detection** with additional emotion classification
- **Batch processing** for multiple texts
- **GPU acceleration** support (CUDA)
- **RESTful API** with automatic documentation
- **Health checks** and monitoring
- **Docker support** for easy deployment

## Models Used

- **Sentiment Analysis**: `cardiffnlp/twitter-roberta-base-sentiment-latest`
- **Emotion Detection**: `j-hartmann/emotion-english-distilroberta-base`

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Build and run with docker-compose
docker-compose up --build

# Or run with Docker directly
docker build -t smad-sentiment-api .
docker run -p 8000:8000 smad-sentiment-api
```

### Option 2: Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### Health Check
```bash
GET /health
```

Returns service health status and model information.

### Single Text Analysis
```bash
POST /analyze
Content-Type: application/json

{
  "text": "I love this new feature!"
}
```

Response:
```json
{
  "text": "I love this new feature!",
  "sentiment": "positive",
  "confidence": 0.9876,
  "score": 0.9876,
  "emotions": {
    "joy": 0.8234,
    "love": 0.1234,
    "optimism": 0.0532
  },
  "processing_time": 0.045
}
```

### Batch Analysis
```bash
POST /analyze/batch
Content-Type: application/json

{
  "texts": [
    "I love this!",
    "This is terrible.",
    "It's okay, I guess."
  ]
}
```

Response:
```json
{
  "results": [
    {
      "text": "I love this!",
      "sentiment": "positive",
      "confidence": 0.9876,
      "score": 0.9876,
      "emotions": {...},
      "processing_time": 0.045
    },
    ...
  ],
  "total_processing_time": 0.123
}
```

## Integration with Next.js Backend

The FastAPI service integrates with the Next.js backend through the `fastApiClient`:

```typescript
import { fastApiClient } from '@/lib/fastApiClient';

// Check if service is available
const isAvailable = await fastApiClient.isAvailable();

// Analyze single text
const result = await fastApiClient.analyzeSentiment("Hello world!");

// Batch analysis
const batchResult = await fastApiClient.analyzeBatchSentiment([
  "Text 1", "Text 2", "Text 3"
]);
```

## Environment Variables

- `FASTAPI_URL`: URL of the FastAPI service (default: `http://localhost:8000`)
- `TRANSFORMERS_CACHE`: Directory for caching HuggingFace models
- `CUDA_VISIBLE_DEVICES`: GPU devices to use (if available)

## Performance Considerations

### GPU Acceleration
The service automatically detects and uses CUDA if available. For better performance:

```bash
# Check GPU availability
nvidia-smi

# Run with specific GPU
CUDA_VISIBLE_DEVICES=0 uvicorn main:app --host 0.0.0.0 --port 8000
```

### Model Caching
Models are automatically downloaded and cached on first use. To pre-download:

```python
from transformers import pipeline

# Pre-download models
sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment-latest"
)
```

### Batch Processing
For better throughput, use batch processing:
- Maximum 100 texts per batch
- Optimal batch size: 10-50 texts
- Larger batches may cause memory issues

## Monitoring and Logging

### Health Checks
```bash
# Basic health check
curl http://localhost:8000/health

# Detailed status
curl http://localhost:8000/
```

### Logs
The service uses structured logging. Key log events:
- Model loading status
- Request processing times
- Error conditions
- GPU/CPU usage

## Deployment

### Docker Compose (Production)
```yaml
version: '3.8'
services:
  sentiment-api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - TRANSFORMERS_CACHE=/app/.cache
    volumes:
      - ./cache:/app/.cache
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sentiment-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: sentiment-api
  template:
    metadata:
      labels:
        app: sentiment-api
    spec:
      containers:
      - name: sentiment-api
        image: smad-sentiment-api:latest
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
```

## Troubleshooting

### Common Issues

1. **Models not loading**
   - Check internet connection for model download
   - Verify disk space for model cache
   - Check TRANSFORMERS_CACHE permissions

2. **Out of memory errors**
   - Reduce batch size
   - Use CPU instead of GPU for large batches
   - Increase container memory limits

3. **Slow performance**
   - Enable GPU acceleration
   - Use batch processing
   - Pre-warm models with dummy requests

4. **Connection timeouts**
   - Increase client timeout settings
   - Check network connectivity
   - Monitor service health endpoint

### Debug Mode
```bash
# Run with debug logging
uvicorn main:app --host 0.0.0.0 --port 8000 --log-level debug

# Check model status
curl http://localhost:8000/health
```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## License

This project is part of the SMAD (Social Media Analytics Dashboard) system.