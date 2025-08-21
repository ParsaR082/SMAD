import { NextResponse } from 'next/server';
import { getSentimentStatsByDateRange } from '@/lib/sentimentService';
import mockData from '@/data/mockData.json';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d'; // 24h, 7d, 30d, all
    const userFilter = searchParams.get('user'); // user search filter
    
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
      
      if (sentimentStats && sentimentStats.length > 0) {
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
    }
    
    mockData.posts.forEach(post => {
      // Apply user filter
      if (filteredUserIds && !filteredUserIds.has(post.userId)) {
        return;
      }
      
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