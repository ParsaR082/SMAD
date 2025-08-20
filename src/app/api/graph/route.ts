import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import mockData from '@/data/mockData.json';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d'; // 24h, 7d, 30d, all
    const sentiment = searchParams.get('sentiment'); // positive, negative, neutral
    
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

    // Try to get data from database first
    try {
      const edgeWhereClause: any = {};
      if (dateFilter) {
        edgeWhereClause.createdAt = {
          gte: dateFilter
        };
      }

      const edges = await prisma.edge.findMany({
        where: edgeWhereClause,
        take: 500 // Limit for performance
      });

      if (edges.length > 0) {
        // Fetch users referenced in these edges to ensure full connectivity
        const userIds = Array.from(
          new Set(edges.flatMap(edge => [edge.srcUserId, edge.dstUserId]))
        );

        const users = await prisma.user.findMany({
          where: {
            id: { in: userIds }
          }
        });

        if (users.length > 0) {
        // Transform users into nodes for D3 force graph
        const nodes = users.map(user => ({
          id: user.id,
          name: user.displayName || user.username,
          handle: user.username,
          followers: user.followers,
          group: Math.floor(user.followers / 5000) + 1, // Group by follower count for coloring
          radius: Math.max(8, Math.min(20, user.followers / 1000)) // Size based on followers
        }));

        // Transform edges into links for D3 force graph
        const links = edges.map(edge => ({
          source: edge.srcUserId,
          target: edge.dstUserId,
          type: edge.type,
          weight: 1, // Default weight since Edge model doesn't have weight field
          value: 1 // D3 uses 'value' for link strength
        }));

        // Calculate node degrees (number of connections)
        const nodeDegrees: { [key: string]: number } = {};
        links.forEach(link => {
          nodeDegrees[link.source] = (nodeDegrees[link.source] || 0) + 1;
          nodeDegrees[link.target] = (nodeDegrees[link.target] || 0) + 1;
        });

        // Add degree information to nodes
        const enhancedNodes = nodes.map(node => ({
          ...node,
          degree: nodeDegrees[node.id] || 0
        }));

        return NextResponse.json({
          success: true,
          data: {
            nodes: enhancedNodes,
            links: links,
            stats: {
              totalNodes: nodes.length,
              totalEdges: links.length,
              avgDegree: Object.values(nodeDegrees).reduce((a, b) => a + b, 0) / nodes.length,
              maxDegree: Math.max(...Object.values(nodeDegrees), 0)
            }
          },
          source: 'database'
        });
      }
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
    
    // Filter posts based on time and sentiment to get relevant users
    const filteredPosts = mockData.posts.filter(post => {
      // Apply time filter
      if (dateFilter && new Date(post.createdAt) < dateFilter) {
        return false;
      }
      
      // Apply sentiment filter
      if (mappedSentiment && post.sentiment !== mappedSentiment) {
        return false;
      }
      
      return true;
    });
    
    // Get unique user IDs from filtered posts
    const activeUserIds = new Set(filteredPosts.map(post => post.userId));
    
    // Transform users into nodes for D3 force graph (only include active users)
    const nodes = mockData.users
      .filter(user => activeUserIds.has(user.id))
      .map(user => ({
        id: user.id,
        name: user.name,
        handle: user.handle,
        followers: user.followers,
        group: Math.floor(user.followers / 5000) + 1, // Group by follower count for coloring
        radius: Math.max(8, Math.min(20, user.followers / 1000)) // Size based on followers
      }));

    // Transform edges into links for D3 force graph (only include edges between active users)
    const links = mockData.edges
      .filter(edge => activeUserIds.has(edge.srcUserId) && activeUserIds.has(edge.dstUserId))
      .map(edge => ({
        source: edge.srcUserId,
        target: edge.dstUserId,
        type: edge.type,
        weight: edge.weight,
        value: edge.weight // D3 uses 'value' for link strength
      }));

    // Calculate node degrees (number of connections)
    const nodeDegrees: { [key: string]: number } = {};
    links.forEach(link => {
      nodeDegrees[link.source] = (nodeDegrees[link.source] || 0) + 1;
      nodeDegrees[link.target] = (nodeDegrees[link.target] || 0) + 1;
    });

    // Add degree information to nodes
    const enhancedNodes = nodes.map(node => ({
      ...node,
      degree: nodeDegrees[node.id] || 0
    }));

    return NextResponse.json({
      success: true,
      data: {
        nodes: enhancedNodes,
        links: links,
        stats: {
          totalNodes: nodes.length,
          totalEdges: links.length,
          avgDegree: Object.values(nodeDegrees).reduce((a, b) => a + b, 0) / nodes.length,
          maxDegree: Math.max(...Object.values(nodeDegrees), 0)
        }
      },
      source: 'mock_data'
    });
  } catch (error) {
    console.error('Error fetching graph data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch graph data' },
      { status: 500 }
    );
  }
}