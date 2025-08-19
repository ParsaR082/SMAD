import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import mockData from '@/data/mockData.json';

export async function GET() {
  try {
    // Try to get data from database first
    try {
      const [sentimentCounts, dailyTrends] = await Promise.all([
        // Get sentiment distribution from posts
        prisma.post.groupBy({
          by: ['sentiment'],
          _count: {
            sentiment: true,
          },
        }),
        // Get daily sentiment trends
        prisma.sentimentDaily.findMany({
          orderBy: {
            date: 'asc',
          },
          take: 30, // Last 30 days
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