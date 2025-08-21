from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SMAD Sentiment Analysis API",
    description="High-accuracy sentiment analysis using HuggingFace transformers",
    version="1.0.0"
)

# Global variables for models
sentiment_pipeline = None
emotion_pipeline = None

# Pydantic models
class TextInput(BaseModel):
    text: str
    
class BatchTextInput(BaseModel):
    texts: List[str]
    
class SentimentResult(BaseModel):
    text: str
    sentiment: str  # 'positive', 'negative', 'neutral'
    confidence: float
    score: float  # -1 to 1 scale
    emotions: Optional[dict] = None
    processing_time: float
    
class BatchSentimentResult(BaseModel):
    results: List[SentimentResult]
    total_processing_time: float
    
@app.on_event("startup")
async def load_models():
    """Load HuggingFace models on startup"""
    global sentiment_pipeline, emotion_pipeline
    
    try:
        logger.info("Loading sentiment analysis models...")
        
        # Load sentiment analysis model (RoBERTa-based)
        sentiment_pipeline = pipeline(
            "sentiment-analysis",
            model="cardiffnlp/twitter-roberta-base-sentiment-latest",
            tokenizer="cardiffnlp/twitter-roberta-base-sentiment-latest",
            device=0 if torch.cuda.is_available() else -1
        )
        
        # Load emotion analysis model (optional)
        try:
            emotion_pipeline = pipeline(
                "text-classification",
                model="j-hartmann/emotion-english-distilroberta-base",
                device=0 if torch.cuda.is_available() else -1
            )
            logger.info("Emotion analysis model loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load emotion model: {e}")
            emotion_pipeline = None
        
        logger.info("Models loaded successfully")
        
    except Exception as e:
        logger.error(f"Error loading models: {e}")
        raise e

def analyze_single_text(text: str) -> SentimentResult:
    """Analyze sentiment for a single text"""
    start_time = datetime.now()
    
    try:
        # Get sentiment prediction
        sentiment_result = sentiment_pipeline(text)[0]
        
        # Map model output to our format
        label = sentiment_result['label'].lower()
        confidence = sentiment_result['score']
        
        # Convert to standardized format
        if label in ['positive', 'pos']:
            sentiment = 'positive'
            score = confidence
        elif label in ['negative', 'neg']:
            sentiment = 'negative'
            score = -confidence
        else:
            sentiment = 'neutral'
            score = 0.0
        
        # Get emotions if available
        emotions = None
        if emotion_pipeline:
            try:
                emotion_results = emotion_pipeline(text)
                emotions = {
                    result['label']: result['score'] 
                    for result in emotion_results[:3]  # Top 3 emotions
                }
            except Exception as e:
                logger.warning(f"Error in emotion analysis: {e}")
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return SentimentResult(
            text=text,
            sentiment=sentiment,
            confidence=confidence,
            score=score,
            emotions=emotions,
            processing_time=processing_time
        )
        
    except Exception as e:
        logger.error(f"Error analyzing text: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/")
async def root():
    """API health check"""
    return {
        "message": "SMAD Sentiment Analysis API",
        "status": "healthy",
        "models_loaded": {
            "sentiment": sentiment_pipeline is not None,
            "emotion": emotion_pipeline is not None
        },
        "device": "cuda" if torch.cuda.is_available() else "cpu"
    }

@app.post("/analyze", response_model=SentimentResult)
async def analyze_sentiment(input_data: TextInput):
    """Analyze sentiment for a single text"""
    if not sentiment_pipeline:
        raise HTTPException(status_code=503, detail="Sentiment model not loaded")
    
    if not input_data.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    return analyze_single_text(input_data.text)

@app.post("/analyze/batch", response_model=BatchSentimentResult)
async def analyze_batch_sentiment(input_data: BatchTextInput):
    """Analyze sentiment for multiple texts"""
    if not sentiment_pipeline:
        raise HTTPException(status_code=503, detail="Sentiment model not loaded")
    
    if not input_data.texts:
        raise HTTPException(status_code=400, detail="Texts list cannot be empty")
    
    if len(input_data.texts) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 texts per batch")
    
    start_time = datetime.now()
    results = []
    
    for text in input_data.texts:
        if text.strip():  # Skip empty texts
            result = analyze_single_text(text)
            results.append(result)
    
    total_processing_time = (datetime.now() - start_time).total_seconds()
    
    return BatchSentimentResult(
        results=results,
        total_processing_time=total_processing_time
    )

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models": {
            "sentiment_loaded": sentiment_pipeline is not None,
            "emotion_loaded": emotion_pipeline is not None
        },
        "system": {
            "cuda_available": torch.cuda.is_available(),
            "device_count": torch.cuda.device_count() if torch.cuda.is_available() else 0
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )