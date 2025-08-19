import { NextResponse } from 'next/server';
import mockData from '@/data/mockData.json';

export async function GET() {
  try {
    // Aggregate sentiment from posts
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
      }
    });
  } catch (error) {
    console.error('Error fetching sentiment data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sentiment data' },
      { status: 500 }
    );
  }
}