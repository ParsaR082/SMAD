import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import mockData from '@/data/mockData.json';

export async function GET() {
  try {
    // Try to get data from database first
    try {
      const hashtagDaily = await prisma.hashtagDaily.groupBy({
        by: ['hashtag'],
        _sum: {
          count: true,
        },
        orderBy: {
          _sum: {
            count: 'desc',
          },
        },
        take: 10,
      });

      if (hashtagDaily.length > 0) {
        const topHashtags = hashtagDaily.map(item => ({
          name: item.hashtag,
          value: item._sum.count || 0
        }));

        return NextResponse.json({
          success: true,
          data: topHashtags,
          source: 'database'
        });
      }
    } catch (dbError) {
      console.log('Database not available, falling back to mock data:', dbError);
    }

    // Fallback to mock data if database is not available
    const hashtagCounts: { [key: string]: number } = {};
    
    mockData.posts.forEach(post => {
      post.hashtags.forEach(hashtag => {
        hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
      });
    });

    // Convert to array and sort by count
    const topHashtags = Object.entries(hashtagCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 hashtags

    return NextResponse.json({
      success: true,
      data: topHashtags,
      source: 'mock_data'
    });
  } catch (error) {
    console.error('Error fetching top hashtags:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch top hashtags' },
      { status: 500 }
    );
  }
}