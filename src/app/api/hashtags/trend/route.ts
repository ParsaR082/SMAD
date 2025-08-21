import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Sentiment } from '@prisma/client';
import mockData from '@/data/mockData.json';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hashtag = searchParams.get('hashtag') || '#AI'; // Default to #AI
    const timeRange = searchParams.get('timeRange') || '7d'; // 24h, 7d, 30d, all
    const sentiment = searchParams.get('sentiment'); // positive, negative, neutral
    
    // Calculate date filter and take limit based on time range
    // Using 2024 as base year since mock data is from 2024
    let dateFilter: Date | undefined;
    let takeLimit = 30;
    const mockDataBaseDate = new Date('2024-02-10'); // Use end of 2024 to work with mock data
    switch (timeRange) {
      case '24h':
        dateFilter = new Date(mockDataBaseDate.getTime() - 24 * 60 * 60 * 1000);
        takeLimit = 24; // Hourly data for 24h
        break;
      case '7d':
        dateFilter = new Date(mockDataBaseDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        takeLimit = 7;
        break;
      case '30d':
        dateFilter = new Date(mockDataBaseDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        takeLimit = 30;
        break;
      case 'all':
      default:
        dateFilter = undefined;
        takeLimit = 365; // Up to 1 year
        break;
    }
    
    // Try to get data from database first
    try {
      // Map sentiment filter to database format
      const sentimentMap: { [key: string]: Sentiment } = {
        'positive': Sentiment.POS,
        'neutral': Sentiment.NEU, 
        'negative': Sentiment.NEG
      };
      const mappedSentiment = sentiment && sentiment !== 'all' ? sentimentMap[sentiment] : undefined;
      
      // Build where clause for posts
      const whereClause: { hashtags: { has: string }; createdAt?: { gte: Date }; sentimentScore?: { gte?: number; lte?: number }; sentiment?: Sentiment } = {
        hashtags: {
          has: hashtag
        }
      };
      
      if (dateFilter) {
        whereClause.createdAt = {
          gte: dateFilter
        };
      }
      
      if (mappedSentiment) {
        whereClause.sentiment = mappedSentiment;
      }

      // Query posts and aggregate by date
      const posts = await prisma.post.findMany({
        where: whereClause,
        select: {
          createdAt: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      if (posts.length > 0) {
        // Aggregate posts by date
        const hashtagCountsByDate: { [key: string]: number } = {};
        posts.forEach(post => {
          const dateKey = post.createdAt.toDateString();
          hashtagCountsByDate[dateKey] = (hashtagCountsByDate[dateKey] || 0) + 1;
        });
        
        // Convert to trend data format
        const trendData = Object.entries(hashtagCountsByDate)
          .map(([dateStr, count]) => {
            const date = new Date(dateStr);
            return {
              date: date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              }),
              value: count,
              fullDate: date.toISOString()
            };
          })
          .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

        return NextResponse.json({
          success: true,
          data: trendData,
          hashtag,
          source: 'database'
        });
      }
    } catch (dbError) {
      console.log('Database not available, falling back to mock data:', dbError);
    }
    
    // Fallback to mock data if database is not available
    // Map sentiment filter to mock data format
    const sentimentMap: { [key: string]: string } = {
      'positive': 'POS',
      'neutral': 'NEU', 
      'negative': 'NEG'
    };
    const mappedSentiment = sentiment && sentiment !== 'all' ? sentimentMap[sentiment] : null;
    
    // Calculate hashtag counts by date with sentiment filtering
    const hashtagCountsByDate: { [key: string]: number } = {};
    
    mockData.posts.forEach(post => {
      // Apply time filter
      if (dateFilter && new Date(post.createdAt) < dateFilter) {
        return;
      }
      
      // Apply sentiment filter
      if (mappedSentiment && post.sentiment !== mappedSentiment) {
        return;
      }
      
      // Check if post contains the target hashtag
      if (post.hashtags.includes(hashtag)) {
        const dateKey = new Date(post.createdAt).toDateString();
        hashtagCountsByDate[dateKey] = (hashtagCountsByDate[dateKey] || 0) + 1;
      }
    });
    
    // Convert to trend data format
    const filteredMockData = Object.entries(hashtagCountsByDate)
      .map(([dateStr, count]) => ({
        hashtag,
        date: dateStr,
        count
      }));
    
    const trendData = filteredMockData
      .map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        value: item.count,
        fullDate: new Date(item.date).toISOString()
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
      .slice(0, takeLimit); // Apply take limit to mock data as well

    return NextResponse.json({
      success: true,
      data: trendData,
      hashtag,
      source: 'mock_data'
    });
  } catch (error) {
    console.error('Error fetching hashtag trend:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hashtag trend' },
      { status: 500 }
    );
  }
}