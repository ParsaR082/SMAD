// Lexicon-based sentiment analysis utility

// Simple sentiment lexicon with common words and their sentiment scores
// Positive words: +1, Negative words: -1
const SENTIMENT_LEXICON: Record<string, number> = {
  // Positive words
  'good': 1, 'great': 1, 'excellent': 1, 'amazing': 1, 'awesome': 1,
  'fantastic': 1, 'wonderful': 1, 'perfect': 1, 'love': 1, 'like': 1,
  'happy': 1, 'joy': 1, 'excited': 1, 'thrilled': 1, 'pleased': 1,
  'satisfied': 1, 'delighted': 1, 'impressed': 1, 'brilliant': 1, 'outstanding': 1,
  'superb': 1, 'magnificent': 1, 'marvelous': 1, 'incredible': 1, 'fabulous': 1,
  'success': 1, 'win': 1, 'winner': 1, 'victory': 1, 'achieve': 1,
  'positive': 1, 'optimistic': 1, 'hope': 1, 'hopeful': 1, 'confident': 1,
  
  // Negative words
  'bad': -1, 'terrible': -1, 'awful': -1, 'horrible': -1, 'disgusting': -1,
  'hate': -1, 'dislike': -1, 'angry': -1, 'mad': -1, 'furious': -1,
  'sad': -1, 'depressed': -1, 'disappointed': -1, 'frustrated': -1, 'annoyed': -1,
  'upset': -1, 'worried': -1, 'concerned': -1, 'anxious': -1, 'stressed': -1,
  'fail': -1, 'failure': -1, 'lose': -1, 'loss': -1, 'defeat': -1,
  'negative': -1, 'pessimistic': -1, 'hopeless': -1, 'doubt': -1, 'fear': -1,
  'worst': -1, 'worse': -1, 'problem': -1, 'issue': -1, 'trouble': -1,
  'disaster': -1, 'crisis': -1, 'emergency': -1, 'danger': -1, 'risk': -1
};

// Intensifiers that modify sentiment strength
const INTENSIFIERS: Record<string, number> = {
  'very': 1.5,
  'extremely': 2.0,
  'incredibly': 2.0,
  'absolutely': 1.8,
  'completely': 1.7,
  'totally': 1.6,
  'really': 1.3,
  'quite': 1.2,
  'rather': 1.1,
  'somewhat': 0.8,
  'slightly': 0.7,
  'barely': 0.5
};

// Negation words that flip sentiment
const NEGATIONS = ['not', 'no', 'never', 'none', 'nobody', 'nothing', 'neither', 'nowhere', 'hardly'];

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
  details: {
    positiveWords: string[];
    negativeWords: string[];
    totalWords: number;
    sentimentWords: number;
  };
}

/**
 * Analyzes the sentiment of a given text using lexicon-based approach
 * @param text - The text to analyze
 * @returns SentimentResult object with sentiment classification and details
 */
export function analyzeSentiment(text: string): SentimentResult {
  if (!text || typeof text !== 'string') {
    return {
      sentiment: 'neutral',
      score: 0,
      confidence: 0,
      details: {
        positiveWords: [],
        negativeWords: [],
        totalWords: 0,
        sentimentWords: 0
      }
    };
  }

  // Normalize text: lowercase, remove punctuation, split into words
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0);

  let totalScore = 0;
  const positiveWords: string[] = [];
  const negativeWords: string[] = [];
  let sentimentWordCount = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let wordScore = SENTIMENT_LEXICON[word];

    if (wordScore !== undefined) {
      sentimentWordCount++;
      
      // Check for intensifiers in the previous word
      if (i > 0 && INTENSIFIERS[words[i - 1]]) {
        wordScore *= INTENSIFIERS[words[i - 1]];
      }

      // Check for negations in the previous 1-3 words
      let isNegated = false;
      for (let j = Math.max(0, i - 3); j < i; j++) {
        if (NEGATIONS.includes(words[j])) {
          isNegated = true;
          break;
        }
      }

      // Flip sentiment if negated
      if (isNegated) {
        wordScore *= -1;
      }

      totalScore += wordScore;

      // Track positive and negative words
      if (wordScore > 0) {
        positiveWords.push(word);
      } else if (wordScore < 0) {
        negativeWords.push(word);
      }
    }
  }

  // Calculate confidence based on the ratio of sentiment words to total words
  const confidence = sentimentWordCount > 0 ? Math.min(sentimentWordCount / words.length * 2, 1) : 0;

  // Determine sentiment classification
  let sentiment: 'positive' | 'negative' | 'neutral';
  if (totalScore > 0.5) {
    sentiment = 'positive';
  } else if (totalScore < -0.5) {
    sentiment = 'negative';
  } else {
    sentiment = 'neutral';
  }

  return {
    sentiment,
    score: totalScore,
    confidence,
    details: {
      positiveWords,
      negativeWords,
      totalWords: words.length,
      sentimentWords: sentimentWordCount
    }
  };
}

/**
 * Batch analyze sentiment for multiple texts
 * @param texts - Array of texts to analyze
 * @returns Array of SentimentResult objects
 */
export function batchAnalyzeSentiment(texts: string[]): SentimentResult[] {
  return texts.map(text => analyzeSentiment(text));
}

/**
 * Get sentiment statistics for an array of texts
 * @param texts - Array of texts to analyze
 * @returns Statistics object with counts and percentages
 */
export function getSentimentStats(texts: string[]) {
  const results = batchAnalyzeSentiment(texts);
  const total = results.length;
  
  const counts = {
    positive: results.filter(r => r.sentiment === 'positive').length,
    negative: results.filter(r => r.sentiment === 'negative').length,
    neutral: results.filter(r => r.sentiment === 'neutral').length
  };

  const percentages = {
    positive: total > 0 ? (counts.positive / total) * 100 : 0,
    negative: total > 0 ? (counts.negative / total) * 100 : 0,
    neutral: total > 0 ? (counts.neutral / total) * 100 : 0
  };

  const averageScore = total > 0 ? results.reduce((sum, r) => sum + r.score, 0) / total : 0;
  const averageConfidence = total > 0 ? results.reduce((sum, r) => sum + r.confidence, 0) / total : 0;

  return {
    total,
    counts,
    percentages,
    averageScore,
    averageConfidence,
    results
  };
}