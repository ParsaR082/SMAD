import { NextResponse } from 'next/server';
import { getSentimentStatsByDateRange } from '@/lib/sentimentService';
import mockData from '@/data/mockData.json';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d'; // 24h, 7d, 30d, all
    const userFilter = searchParams.get('user'); // user search filter
    const hashtagFilter = searchParams.get('hashtag'); // hashtag filter
    
    // Calculate date filter based on time range
    let dateFilter: Date | undefined;
    const now = new Date();
    switch (timeRange) {
      case '24h':
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        dateFilter = undefined;
        break;
    }

    // Try to get data from database first using sentiment service
    try {
      const startDate = dateFilter;
      const endDate = new Date();
      
      const sentimentStats = await getSentimentStatsByDateRange(startDate || new Date(0), endDate);
      
      // Check if we have actual data (not just empty records)
      const hasActualData = sentimentStats && sentimentStats.length > 0 && 
        sentimentStats.some(stat => stat.total > 0);
      
      if (hasActualData) {
        // Transform the data to match expected format
        const totalPosts = sentimentStats.reduce((sum, stat) => sum + stat.total, 0);
        const distribution = [
          {
            name: 'Positive',
            value: sentimentStats.reduce((sum, stat) => sum + (stat.positive?.count || 0), 0),
            percentage: 0,
            color: '#10b981'
          },
          {
            name: 'Negative', 
            value: sentimentStats.reduce((sum, stat) => sum + (stat.negative?.count || 0), 0),
            percentage: 0,
            color: '#ef4444'
          },
          {
            name: 'Neutral',
            value: sentimentStats.reduce((sum, stat) => sum + (stat.neutral?.count || 0), 0),
            percentage: 0,
            color: '#6b7280'
          }
        ];
        
        // Calculate percentages
        distribution.forEach(item => {
          item.percentage = totalPosts > 0 ? (item.value / totalPosts) * 100 : 0;
        });
        
        return NextResponse.json({
          success: true,
          data: {
            distribution,
            total: totalPosts,
            trends: sentimentStats
          },
          source: 'database'
        });
      }
    } catch (dbError) {
      console.log('Database not available, falling back to mock data:', dbError);
    }

    // Fallback to mock data if database is not available
    console.log('Using mock data fallback');
    console.log('Date filter:', dateFilter);
    console.log('Time range:', timeRange);
    console.log('Total posts in mock data:', mockData.posts.length);
    
    const sentimentCounts = {
      positive: 0,
      negative: 0,
      neutral: 0
    };
    
    // Filter users if user search is provided
    let filteredUserIds: Set<string> | null = null;
    if (userFilter) {
      const searchTerm = userFilter.toLowerCase();
      const matchingUsers = mockData.users.filter(user => 
        user.handle.toLowerCase().includes(searchTerm) ||
        user.name.toLowerCase().includes(searchTerm)
      );
      filteredUserIds = new Set(matchingUsers.map(user => user.id));
      console.log('User filter applied, matching users:', matchingUsers.length);
    }
    
    let processedPosts = 0;
    let userFiltered = 0;
    let hashtagFiltered = 0;
    let dateFiltered = 0;
    
    mockData.posts.forEach(post => {
      // Apply user filter
      if (filteredUserIds && !filteredUserIds.has(post.userId)) {
        userFiltered++;
        return;
      }
      
      // Apply hashtag filter
      if (hashtagFilter) {
        const searchTerm = hashtagFilter.toLowerCase().replace('#', '');
        const hasMatchingHashtag = post.hashtags.some(hashtag => 
          hashtag.toLowerCase().includes(searchTerm)
        );
        if (!hasMatchingHashtag) {
          hashtagFiltered++;
          return;
        }
      }
      
      // Apply date filter
      if (dateFilter) {
        const postDate = new Date(post.createdAt);
        if (postDate < dateFilter) {
          dateFiltered++;
          return;
        }
      }
      
      processedPosts++;
      
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

    console.log('Filtering results:');
    console.log('- Processed posts:', processedPosts);
    console.log('- User filtered:', userFiltered);
    console.log('- Hashtag filtered:', hashtagFiltered);
    console.log('- Date filtered:', dateFiltered);
    console.log('Sentiment counts:', sentimentCounts);

    // Calculate total
    const totalPosts = sentimentCounts.positive + sentimentCounts.negative + sentimentCounts.neutral;
    
    // Convert to chart format with proper colors and percentages
    const sentimentData = [
      { 
        name: 'Positive', 
        value: sentimentCounts.positive, 
        percentage: totalPosts > 0 ? Math.round((sentimentCounts.positive / totalPosts) * 100 * 10) / 10 : 0,
        color: '#10b981' 
      },
      { 
        name: 'Negative', 
        value: sentimentCounts.negative, 
        percentage: totalPosts > 0 ? Math.round((sentimentCounts.negative / totalPosts) * 100 * 10) / 10 : 0,
        color: '#ef4444' 
      },
      { 
        name: 'Neutral', 
        value: sentimentCounts.neutral, 
        percentage: totalPosts > 0 ? Math.round((sentimentCounts.neutral / totalPosts) * 100 * 10) / 10 : 0,
        color: '#6b7280' 
      }
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
        total: totalPosts,
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