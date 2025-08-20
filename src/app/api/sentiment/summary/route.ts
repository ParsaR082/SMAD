import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import mockData from '@/data/mockData.json';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d'; // 24h, 7d, 30d, all
    
    // Calculate date filter based on time range
    let dateFilter: Date | undefined;
    let trendDays = 30;
    const now = new Date();
    switch (timeRange) {
      case '24h':
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        trendDays = 1;
        break;
      case '7d':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        trendDays = 7;
        break;
      case '30d':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        trendDays = 30;
        break;
      case 'all':
      default:
        dateFilter = undefined;
        trendDays = 365; // Show up to 1 year for 'all'
        break;
    }

    // Try to get data from database first
    try {
      const whereClause: any = {};
      if (dateFilter) {
        whereClause.createdAt = {
          gte: dateFilter
        };
      }

      const trendWhereClause: any = {};
      if (dateFilter) {
        trendWhereClause.date = {
          gte: dateFilter
        };
      }

      const [sentimentCounts, dailyTrends] = await Promise.all([
        // Get sentiment distribution from posts
        prisma.post.groupBy({
          by: ['sentiment'],
          where: whereClause,
          _count: {
            sentiment: true,
          },
        }),
        // Get daily sentiment trends
        prisma.sentimentDaily.findMany({
          where: trendWhereClause,
          orderBy: {
            date: 'asc',
          },
          take: trendDays,
        })
      ]);

      if (sentimentCounts.length > 0 || dailyTrends.length > 0) {
        // Process sentiment counts
        const counts = { positive: 0, negative: 0, neutral: 0 };
        sentimentCounts.forEach(item => {
          switch (item.sentiment) {
            case 'POS':
              counts.positive = item._count.sentiment;
              break;
            case 'NEG':
              counts.negative = item._count.sentiment;
              break;
            case 'NEU':
              counts.neutral = item._count.sentiment;
              break;
          }
        });

        const sentimentData = [
          { name: 'Positive', value: counts.positive, color: '#00ff00' },
          { name: 'Negative', value: counts.negative, color: '#ff00ff' },
          { name: 'Neutral', value: counts.neutral, color: '#00ffff' }
        ];

        // Process daily trends
        const trendsMap = new Map();
        dailyTrends.forEach(item => {
          const dateKey = item.date.toISOString().split('T')[0];
          if (!trendsMap.has(dateKey)) {
            trendsMap.set(dateKey, { positive: 0, negative: 0, neutral: 0 });
          }
          const trend = trendsMap.get(dateKey);
          switch (item.sentiment) {
            case 'POS':
              trend.positive = item.count;
              break;
            case 'NEG':
              trend.negative = item.count;
              break;
            case 'NEU':
              trend.neutral = item.count;
              break;
          }
        });

        const processedTrends = Array.from(trendsMap.entries())
          .map(([date, values]) => ({
            date: new Date(date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            }),
            positive: values.positive,
            negative: values.negative,
            neutral: values.neutral,
            fullDate: date
          }))
          .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

        return NextResponse.json({
          success: true,
          data: {
            distribution: sentimentData,
            trends: processedTrends,
            totals: counts
          },
          source: 'database'
        });
      }
    } catch (dbError) {
      console.log('Database not available, falling back to mock data:', dbError);
    }

    // Fallback to mock data if database is not available
    const sentimentCounts = {
      positive: 0,
      negative: 0,
      neutral: 0
    };
    
    mockData.posts.forEach(post => {
      switch (post.sentiment) {
        case 'POS':
          sentimentCounts.positive++;
          break;
        case 'NEG':
          sentimentCounts.negative++;
          break;
        case 'NEU':
          sentimentCounts.neutral++;
          break;
      }
    });

    // Convert to chart format
    const sentimentData = [
      { name: 'Positive', value: sentimentCounts.positive, color: '#00ff00' },
      { name: 'Negative', value: sentimentCounts.negative, color: '#ff00ff' },
      { name: 'Neutral', value: sentimentCounts.neutral, color: '#00ffff' }
    ];

    // Also get daily sentiment trends
    const dailyTrends = mockData.sentimentDaily
      .map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        positive: item.pos,
        negative: item.neg,
        neutral: item.neu,
        fullDate: item.date
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

    return NextResponse.json({
      success: true,
      data: {
        distribution: sentimentData,
        trends: dailyTrends,
        totals: sentimentCounts
      },
      source: 'mock_data'
    });
  } catch (error) {
    console.error('Error fetching sentiment data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sentiment data' },
      { status: 500 }
    );
  }
}