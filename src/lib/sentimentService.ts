import { PrismaClient, Sentiment } from '@prisma/client';
import { analyzeSentiment, batchAnalyzeSentiment } from '../utils/sentiment';
import { fastApiClient } from './fastApiClient';

const prisma = new PrismaClient();

/**
 * Maps sentiment analysis result to Prisma Sentiment enum
 */
function mapSentimentToPrisma(sentiment: 'positive' | 'negative' | 'neutral'): Sentiment {
  switch (sentiment) {
    case 'positive':
      return Sentiment.POS;
    case 'negative':
      return Sentiment.NEG;
    case 'neutral':
    default:
      return Sentiment.NEU;
  }
}

/**
 * Maps Prisma Sentiment enum to string
 */
function mapPrismaSentimentToString(sentiment: Sentiment): 'positive' | 'negative' | 'neutral' {
  switch (sentiment) {
    case Sentiment.POS:
      return 'positive';
    case Sentiment.NEG:
      return 'negative';
    case Sentiment.NEU:
    default:
      return 'neutral';
  }
}

/**
 * Analyzes and updates sentiment for a single post
 * Uses FastAPI for high accuracy, falls back to lexicon-based analysis
 */
export async function analyzeSinglePost(postId: string, useHighAccuracy: boolean = false) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      throw new Error(`Post with id ${postId} not found`);
    }

    let sentimentResult: { sentiment: 'positive' | 'negative' | 'neutral'; score: number; confidence: number };
    let method: 'fastapi' | 'lexicon' = 'lexicon';

    // Try FastAPI first if high accuracy is requested and service is available
    if (useHighAccuracy) {
      try {
        const isAvailable = await fastApiClient.isAvailable();
        if (isAvailable) {
          const fastApiResult = await fastApiClient.analyzeSentiment(post.content);
          sentimentResult = {
            sentiment: fastApiResult.sentiment,
            score: fastApiResult.score,
            confidence: fastApiResult.confidence
          };
          method = 'fastapi';
        } else {
          throw new Error('FastAPI service not available');
        }
      } catch (error) {
        console.warn('FastAPI analysis failed, falling back to lexicon:', error);
        sentimentResult = analyzeSentiment(post.content);
      }
    } else {
      sentimentResult = analyzeSentiment(post.content);
    }
    
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        sentiment: mapSentimentToPrisma(sentimentResult.sentiment),
        sentimentScore: sentimentResult.score,
        sentimentConfidence: sentimentResult.confidence
      }
    });

    return {
      postId,
      sentiment: sentimentResult.sentiment,
      score: sentimentResult.score,
      confidence: sentimentResult.confidence,
      method,
      updatedPost
    };
  } catch (error) {
    console.error('Error analyzing single post:', error);
    throw error;
  }
}

/**
 * Batch analyzes sentiment for multiple posts
 * Uses FastAPI for high accuracy, falls back to lexicon-based analysis
 */
export async function batchAnalyzePosts(postIds?: string[], limit: number = 100, useHighAccuracy: boolean = false) {
  try {
    const whereClause = postIds ? { id: { in: postIds } } : {};
    
    const posts = await prisma.post.findMany({
      where: whereClause,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const contents = posts.map(post => post.content);
    let analyses: Array<{ sentiment: 'positive' | 'negative' | 'neutral'; score: number; confidence: number }>;
    let method: 'fastapi' | 'lexicon' = 'lexicon';

    // Try FastAPI first if high accuracy is requested and service is available
    if (useHighAccuracy) {
      try {
        const isAvailable = await fastApiClient.isAvailable();
        if (isAvailable) {
          const fastApiResult = await fastApiClient.analyzeBatchSentiment(contents);
          analyses = fastApiResult.results.map(result => ({
            sentiment: result.sentiment,
            score: result.score,
            confidence: result.confidence
          }));
          method = 'fastapi';
        } else {
          throw new Error('FastAPI service not available');
        }
      } catch (error) {
        console.warn('FastAPI batch analysis failed, falling back to lexicon:', error);
        analyses = batchAnalyzeSentiment(contents);
      }
    } else {
      analyses = batchAnalyzeSentiment(contents);
    }

    const results = [];
    const updates = [];

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const sentimentResult = analyses[i];
      
      updates.push(
        prisma.post.update({
          where: { id: post.id },
          data: {
            sentiment: mapSentimentToPrisma(sentimentResult.sentiment),
            sentimentScore: sentimentResult.score,
            sentimentConfidence: sentimentResult.confidence
          }
        })
      );

      results.push({
        postId: post.id,
        sentiment: sentimentResult.sentiment,
        score: sentimentResult.score,
        confidence: sentimentResult.confidence,
        method
      });
    }

    await Promise.all(updates);

    return results;
  } catch (error) {
    console.error('Error in batch sentiment analysis:', error);
    throw error;
  }
}

/**
 * Analyzes sentiment for posts that haven't been analyzed yet
 */
export async function analyzeUnprocessedPosts(limit: number = 100) {
  try {
    // Find posts where sentiment analysis hasn't been done (sentimentScore is null)
    const unprocessedPosts = await prisma.post.findMany({
      where: {
        OR: [
          { sentimentScore: null },
          { sentimentConfidence: null }
        ]
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${unprocessedPosts.length} unprocessed posts`);

    const results = [];

    for (const post of unprocessedPosts) {
      const sentimentResult = analyzeSentiment(post.content);
      
      await prisma.post.update({
        where: { id: post.id },
        data: {
          sentiment: mapSentimentToPrisma(sentimentResult.sentiment),
          sentimentScore: sentimentResult.score,
          sentimentConfidence: sentimentResult.confidence
        }
      });

      results.push({
        postId: post.id,
        content: post.content.substring(0, 100) + '...',
        sentiment: sentimentResult.sentiment,
        score: sentimentResult.score,
        confidence: sentimentResult.confidence
      });
    }

    return {
      processed: results.length,
      results
    };
  } catch (error) {
    console.error('Error analyzing unprocessed posts:', error);
    throw error;
  }
}

/**
 * Aggregates daily sentiment statistics
 */
export async function aggregateDailySentiment(date?: Date) {
  try {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get posts for the target date
    const posts = await prisma.post.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        },
        sentimentScore: {
          not: null
        }
      },
      select: {
        sentiment: true,
        sentimentScore: true
      }
    });

    // Group by sentiment and calculate stats
    const sentimentGroups = {
      [Sentiment.POS]: posts.filter(p => p.sentiment === Sentiment.POS),
      [Sentiment.NEG]: posts.filter(p => p.sentiment === Sentiment.NEG),
      [Sentiment.NEU]: posts.filter(p => p.sentiment === Sentiment.NEU)
    };

    const results = [];

    for (const [sentiment, sentimentPosts] of Object.entries(sentimentGroups)) {
      const count = sentimentPosts.length;
      const avgScore = count > 0 
        ? sentimentPosts.reduce((sum, post) => sum + (post.sentimentScore || 0), 0) / count 
        : 0;

      // Upsert daily sentiment record
      const dailyRecord = await prisma.sentimentDaily.upsert({
        where: {
          date_sentiment: {
            date: startOfDay,
            sentiment: sentiment as Sentiment
          }
        },
        update: {
          count,
          avgScore
        },
        create: {
          date: startOfDay,
          sentiment: sentiment as Sentiment,
          count,
          avgScore
        }
      });

      results.push({
        date: startOfDay,
        sentiment: mapPrismaSentimentToString(sentiment as Sentiment),
        count,
        avgScore,
        record: dailyRecord
      });
    }

    return {
      date: startOfDay,
      totalPosts: posts.length,
      sentimentBreakdown: results
    };
  } catch (error) {
    console.error('Error aggregating daily sentiment:', error);
    throw error;
  }
}

/**
 * Gets sentiment statistics for a date range
 */
export async function getSentimentStatsByDateRange(
  startDate: Date,
  endDate: Date
) {
  try {
    const dailyStats = await prisma.sentimentDaily.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Group by date
    const statsByDate = dailyStats.reduce((acc, stat) => {
      const dateKey = stat.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: stat.date,
          positive: { count: 0, avgScore: 0 },
          negative: { count: 0, avgScore: 0 },
          neutral: { count: 0, avgScore: 0 },
          total: 0
        };
      }

      const sentimentKey = mapPrismaSentimentToString(stat.sentiment);
      acc[dateKey][sentimentKey] = {
        count: stat.count,
        avgScore: stat.avgScore
      };
      acc[dateKey].total += stat.count;

      return acc;
    }, {} as Record<string, { date: Date; positive: { count: number; avgScore: number }; negative: { count: number; avgScore: number }; neutral: { count: number; avgScore: number }; total: number }>);

    return Object.values(statsByDate);
  } catch (error) {
    console.error('Error getting sentiment stats by date range:', error);
    throw error;
  }
}

/**
 * Processes new posts for sentiment analysis (can be called via webhook or cron)
 */
export async function processNewPosts() {
  try {
    console.log('Starting sentiment analysis for new posts...');
    
    // Analyze unprocessed posts
    const analysisResult = await analyzeUnprocessedPosts(50);
    
    // Aggregate today's sentiment
    const today = new Date();
    const aggregationResult = await aggregateDailySentiment(today);
    
    return {
      analysis: analysisResult,
      aggregation: aggregationResult,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error processing new posts:', error);
    throw error;
  }
}

export { mapSentimentToPrisma, mapPrismaSentimentToString };