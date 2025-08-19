import { NextResponse } from 'next/server';
import mockData from '@/data/mockData.json';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hashtag = searchParams.get('hashtag') || '#AI'; // Default to #AI
    
    // Filter hashtag daily data for the specified hashtag
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
      hashtag
    });
  } catch (error) {
    console.error('Error fetching hashtag trend:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hashtag trend' },
      { status: 500 }
    );
  }
}