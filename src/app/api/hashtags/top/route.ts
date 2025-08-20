import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import mockData from '@/data/mockData.json';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d'; // 24h, 7d, 30d, all
    const sentiment = searchParams.get('sentiment'); // positive, negative, neutral
    const userFilter = searchParams.get('user'); // user search filter
    
    // Calculate date filter based on time range
    // Using 2024 as base year since mock data is from 2024
    let dateFilter: Date | undefined;
    const mockDataBaseDate = new Date('2024-02-10'); // Use end of 2024 to work with mock data
    switch (timeRange) {
      case '24h':
        dateFilter = new Date(mockDataBaseDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        dateFilter = new Date(mockDataBaseDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFilter = new Date(mockDataBaseDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        dateFilter = undefined;
        break;
    }

    // Try to get data from database first
    try {
      const whereClause: any = {};
      if (dateFilter) {
        whereClause.date = {
          gte: dateFilter
        };
      }

      const hashtagDaily = await prisma.hashtagDaily.groupBy({
        by: ['hashtag'],
        where: whereClause,
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
    
    // Map sentiment filter to mock data format
    const sentimentMap: { [key: string]: string } = {
      'positive': 'POS',
      'neutral': 'NEU', 
      'negative': 'NEG'
    };
    const mappedSentiment = sentiment && sentiment !== 'all' ? sentimentMap[sentiment] : null;
    
    // Filter users if user search is provided
    let filteredUserIds: Set<string> | null = null;
    if (userFilter) {
      const searchTerm = userFilter.toLowerCase();
      const matchingUsers = mockData.users.filter(user => 
        user.handle.toLowerCase().includes(searchTerm) ||
        user.name.toLowerCase().includes(searchTerm)
      );
      filteredUserIds = new Set(matchingUsers.map(user => user.id));
    }
    
    mockData.posts.forEach(post => {
      // Apply user filter
      if (filteredUserIds && !filteredUserIds.has(post.userId)) {
        return;
      }
      
      // Apply time filter
      if (dateFilter && new Date(post.createdAt) < dateFilter) {
        return;
      }
      
      // Apply sentiment filter
      if (mappedSentiment && post.sentiment !== mappedSentiment) {
        return;
      }
      
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