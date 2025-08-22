import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import mockData from '@/data/mockData.json';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    const sentiment = searchParams.get('sentiment');
    const userFilter = searchParams.get('user');
    
    let dateFilter: Date | undefined;
    const mockDataBaseDate = new Date('2024-02-10');
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

    try {
      const edgeWhereClause: { createdAt?: { gte: Date } } = {};
      if (dateFilter) {
        edgeWhereClause.createdAt = {
          gte: dateFilter
        };
      }

      const userWhereClause: Prisma.UserWhereInput = {};
      if (userFilter) {
        userWhereClause.OR = [
          { username: { contains: userFilter, mode: Prisma.QueryMode.insensitive } },
          { displayName: { contains: userFilter, mode: Prisma.QueryMode.insensitive } }
        ];
      }

      const [users, edges] = await Promise.all([
        prisma.user.findMany({
          where: userWhereClause,
          take: 100
        }),
        prisma.edge.findMany({
          where: edgeWhereClause,
          take: 500
        })
      ]);

      if (users.length > 0 && edges.length > 0) {
        const nodes = users.map(user => ({
          id: user.id,
          name: user.displayName || user.username,
          handle: user.username,
          followers: user.followers,
          group: Math.floor(user.followers / 5000) + 1,
          radius: Math.max(8, Math.min(20, user.followers / 1000))
        }));

        const links = edges.map(edge => ({
          source: edge.srcUserId,
          target: edge.dstUserId,
          type: edge.type,
          weight: 1,
          value: 1
        }));

        const nodeDegrees: { [key: string]: number } = {};
        links.forEach(link => {
          nodeDegrees[link.source] = (nodeDegrees[link.source] || 0) + 1;
          nodeDegrees[link.target] = (nodeDegrees[link.target] || 0) + 1;
        });

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
    } catch (dbError) {
      console.log('Database not available, falling back to mock data:', dbError);
    }

    // Fallback to mock data
    const sentimentMap: { [key: string]: string } = {
      'positive': 'POS',
      'neutral': 'NEU', 
      'negative': 'NEG'
    };
    const mappedSentiment = sentiment && sentiment !== 'all' ? sentimentMap[sentiment] : null;
    
    let filteredUsers = mockData.users;
    if (userFilter) {
      const searchTerm = userFilter.toLowerCase();
      filteredUsers = mockData.users.filter(user => 
        user.handle.toLowerCase().includes(searchTerm) ||
        user.name.toLowerCase().includes(searchTerm)
      );
    }
    
    const filteredUserIds = new Set(filteredUsers.map(user => user.id));
    
    const filteredPosts = mockData.posts.filter(post => {
      if (userFilter && !filteredUserIds.has(post.userId)) {
        return false;
      }
      
      if (dateFilter && new Date(post.createdAt) < dateFilter) {
        return false;
      }
      
      if (mappedSentiment && post.sentiment !== mappedSentiment) {
        return false;
      }
      
      return true;
    });
    
    const filteredEdges = mockData.edges.filter(edge => {
      if (userFilter && !filteredUserIds.has(edge.srcUserId) && !filteredUserIds.has(edge.dstUserId)) {
        return false;
      }
      
      if (dateFilter && new Date(edge.timestamp) < dateFilter) {
        return false;
      }
      return true;
    });
    
    const activeUserIds = new Set([
      ...filteredPosts.map(post => post.userId),
      ...filteredEdges.flatMap(edge => [edge.srcUserId, edge.dstUserId])
    ]);
    
    const nodes = mockData.users
      .filter(user => activeUserIds.has(user.id))
      .map(user => ({
        id: user.id,
        name: user.name,
        handle: user.handle,
        followers: user.followers,
        group: Math.floor(user.followers / 5000) + 1,
        radius: Math.max(8, Math.min(20, user.followers / 1000))
      }));

    const links = filteredEdges
      .filter(edge => activeUserIds.has(edge.srcUserId) && activeUserIds.has(edge.dstUserId))
      .map(edge => ({
        source: edge.srcUserId,
        target: edge.dstUserId,
        type: edge.type,
        weight: edge.weight,
        value: edge.weight
      }));

    const nodeDegrees: { [key: string]: number } = {};
    links.forEach(link => {
      nodeDegrees[link.source] = (nodeDegrees[link.source] || 0) + 1;
      nodeDegrees[link.target] = (nodeDegrees[link.target] || 0) + 1;
    });

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
          totalLinks: links.length,
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