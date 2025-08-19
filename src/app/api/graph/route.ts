import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import mockData from '@/data/mockData.json';

export async function GET() {
  try {
    // Try to get data from database first
    try {
      const [users, edges] = await Promise.all([
        prisma.user.findMany({
          take: 100 // Limit for performance
        }),
        prisma.edge.findMany({
          take: 500 // Limit for performance
        })
      ]);

      if (users.length > 0 && edges.length > 0) {
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
              totalLinks: links.length,
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

    // Fallback to mock data if database is not available
    // Transform users into nodes for D3 force graph
    const nodes = mockData.users.map(user => ({
      id: user.id,
      name: user.name,
      handle: user.handle,
      followers: user.followers,
      group: Math.floor(user.followers / 5000) + 1, // Group by follower count for coloring
      radius: Math.max(8, Math.min(20, user.followers / 1000)) // Size based on followers
    }));

    // Transform edges into links for D3 force graph
    const links = mockData.edges.map(edge => ({
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