/**
 * FastAPI Sentiment Analysis Client
 * Handles communication with the FastAPI sentiment service
 */

interface SentimentResult {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  score: number;
  emotions?: Record<string, number>;
  processing_time: number;
}

interface BatchSentimentResult {
  results: SentimentResult[];
  total_processing_time: number;
}

interface FastApiHealthCheck {
  status: string;
  models_loaded: {
    sentiment: boolean;
    emotion: boolean;
  };
  device: string;
}

class FastApiClient {
  private baseUrl: string;
  private timeout: number;
  private retries: number;

  constructor(
    baseUrl: string = process.env.FASTAPI_URL || 'http://localhost:8000',
    timeout: number = 30000,
    retries: number = 3
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = timeout;
    this.retries = retries;
  }

  /**
   * Check if the FastAPI service is healthy and models are loaded
   */
  async healthCheck(): Promise<FastApiHealthCheck> {
    const response = await this.makeRequest<FastApiHealthCheck>('/health', {
      method: 'GET'
    });
    return response;
  }

  /**
   * Analyze sentiment for a single text
   */
  async analyzeSentiment(text: string): Promise<SentimentResult> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const response = await this.makeRequest<SentimentResult>('/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: text.trim() })
    });

    return response;
  }

  /**
   * Analyze sentiment for multiple texts in batch
   */
  async analyzeBatchSentiment(texts: string[]): Promise<BatchSentimentResult> {
    if (!texts || texts.length === 0) {
      throw new Error('Texts array cannot be empty');
    }

    if (texts.length > 100) {
      throw new Error('Maximum 100 texts per batch');
    }

    // Filter out empty texts
    const validTexts = texts.filter(text => text && text.trim().length > 0);
    
    if (validTexts.length === 0) {
      throw new Error('No valid texts provided');
    }

    const response = await this.makeRequest<BatchSentimentResult>('/analyze/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ texts: validTexts })
    });

    return response;
  }

  /**
   * Check if the FastAPI service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const health = await this.healthCheck();
      return health.status === 'healthy' && health.models_loaded.sentiment;
    } catch (error) {
      console.warn('FastAPI service not available:', error);
      return false;
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T = unknown>(endpoint: string, options: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data;

      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.retries) {
          // Exponential backoff: wait 1s, 2s, 4s...
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.warn(`FastAPI request failed (attempt ${attempt}/${this.retries}), retrying in ${delay}ms:`, error);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`FastAPI request failed after ${this.retries} attempts: ${lastError.message}`);
  }
}

// Export singleton instance
export const fastApiClient = new FastApiClient();

// Export types
export type {
  SentimentResult,
  BatchSentimentResult,
  FastApiHealthCheck
};

// Export class for custom instances
export { FastApiClient };