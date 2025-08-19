import { NextResponse } from 'next/server';
import mockData from '@/data/mockData.json';

export async function GET() {
  try {
    // Aggregate hashtag counts from posts
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
      data: topHashtags
    });
  } catch (error) {
    console.error('Error fetching top hashtags:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch top hashtags' },
      { status: 500 }
    );
  }
}