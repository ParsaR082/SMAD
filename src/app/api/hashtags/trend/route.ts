import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import mockData from '@/data/mockData.json';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hashtag = searchParams.get('hashtag') || '#AI'; // Default to #AI
    
    // Try to get data from database first
    try {
      const dbTrendData = await prisma.hashtagDaily.findMany({
        where: {
          hashtag: hashtag
        },
        orderBy: {
          date: 'asc'
        },
        take: 30 // Last 30 days
      });

      if (dbTrendData.length > 0) {
        const trendData = dbTrendData.map(item => ({
          date: new Date(item.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          value: item.count,
          fullDate: item.date.toISOString()
        }));

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
    const trendData = mockData.hashtagDaily
      .filter(item => item.hashtag === hashtag)
      .map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        value: item.count,
        fullDate: item.date
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

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