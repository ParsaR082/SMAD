import { NextRequest, NextResponse } from 'next/server';
import { 
  analyzeSinglePost, 
  batchAnalyzePosts, 
  analyzeUnprocessedPosts,
  processNewPosts
} from '../../../../lib/sentimentService';
import { fastApiClient } from '../../../../lib/fastApiClient';

/**
 * POST /api/sentiment/analyze
 * Analyzes sentiment for posts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, postIds, limit, useHighAccuracy = false } = body;

    let result;

    switch (type) {
      case 'single':
        if (!body.postId) {
          return NextResponse.json(
            { error: 'postId is required for single post analysis' },
            { status: 400 }
          );
        }
        result = await analyzeSinglePost(body.postId, useHighAccuracy);
        break;

      case 'batch':
        result = await batchAnalyzePosts(postIds, limit || 100, useHighAccuracy);
        break;

      case 'unprocessed':
        result = await analyzeUnprocessedPosts(limit || 100);
        break;

      case 'process-new':
        result = await processNewPosts();
        break;

      case 'health':
        // Check FastAPI service health
        const isAvailable = await fastApiClient.isAvailable();
        const healthData = isAvailable ? await fastApiClient.healthCheck() : null;
        result = { 
          fastApiAvailable: isAvailable,
          healthData 
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid analysis type. Use: single, batch, unprocessed, process-new, or health' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze sentiment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sentiment/analyze
 * Gets information about sentiment analysis capabilities
 */
export async function GET() {
  return NextResponse.json({
    message: 'Sentiment Analysis API',
    endpoints: {
      'POST /api/sentiment/analyze': {
        description: 'Analyze sentiment for posts',
        types: {
          single: 'Analyze a single post by ID',
          batch: 'Analyze multiple posts by IDs',
          unprocessed: 'Analyze posts that haven\'t been processed yet',
          'process-new': 'Process all new posts and aggregate daily stats'
        },
        parameters: {
          type: 'Required: single | batch | unprocessed | process-new',
          postId: 'Required for type=single: Post ID to analyze',
          postIds: 'Optional for type=batch: Array of post IDs',
          limit: 'Optional: Maximum number of posts to process (default: 100)'
        }
      }
    },
    examples: {
      singlePost: {
        type: 'single',
        postId: '507f1f77bcf86cd799439011'
      },
      batchPosts: {
        type: 'batch',
        postIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
        limit: 50
      },
      unprocessedPosts: {
        type: 'unprocessed',
        limit: 100
      },
      processNew: {
        type: 'process-new'
      }
    }
  });
}