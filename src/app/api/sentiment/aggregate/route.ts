import { NextRequest, NextResponse } from 'next/server';
import { 
  aggregateDailySentiment,
  getSentimentStatsByDateRange
} from '../../../../lib/sentimentService';

/**
 * POST /api/sentiment/aggregate
 * Aggregates daily sentiment statistics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, startDate, endDate, type } = body;

    let result;

    switch (type) {
      case 'daily':
        const targetDate = date ? new Date(date) : new Date();
        result = await aggregateDailySentiment(targetDate);
        break;

      case 'range':
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'startDate and endDate are required for range aggregation' },
            { status: 400 }
          );
        }
        result = await getSentimentStatsByDateRange(
          new Date(startDate),
          new Date(endDate)
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid aggregation type. Use: daily or range' },
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
    console.error('Sentiment aggregation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to aggregate sentiment data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sentiment/aggregate
 * Gets aggregated sentiment statistics with query parameters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'daily';
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const days = searchParams.get('days');

    let result;

    switch (type) {
      case 'daily':
        const targetDate = date ? new Date(date) : new Date();
        result = await aggregateDailySentiment(targetDate);
        break;

      case 'range':
        let start: Date;
        let end: Date;

        if (startDate && endDate) {
          start = new Date(startDate);
          end = new Date(endDate);
        } else if (days) {
          // Get last N days
          end = new Date();
          start = new Date();
          start.setDate(start.getDate() - parseInt(days));
        } else {
          // Default to last 7 days
          end = new Date();
          start = new Date();
          start.setDate(start.getDate() - 7);
        }

        result = await getSentimentStatsByDateRange(start, end);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid aggregation type. Use: daily or range' },
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
    console.error('Sentiment aggregation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get sentiment aggregation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}