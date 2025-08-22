'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  followers: number;
  degree: number;
}

interface Link {
  source: string | Node;
  target: string | Node;
  weight: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    avgDegree: number;
    maxDegree: number;
  };
}

interface ApiResponse {
  success: boolean;
  data: GraphData;
}

interface NetworkGraphProps {
  filters?: {
    timeRange?: string;
    sentiment?: string;
    hashtag?: string;
    user?: string;
  };
}

const NetworkGraph = ({ filters }: NetworkGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [currentZoom, setCurrentZoom] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters?.timeRange) params.append('timeRange', filters.timeRange);
        if (filters?.sentiment) params.append('sentiment', filters.sentiment);
        if (filters?.user) params.append('user', filters.user);
        
        const url = `/api/graph${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);
        const result: ApiResponse = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError('Failed to fetch graph data');
        }
      } catch (err) {
        setError('Error loading data');
        console.error('Error fetching graph data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = dimensions.width;
    const height = dimensions.height;

    // Initialize nodes with random positions to avoid clustering at origin
    data.nodes.forEach(node => {
      if (!node.x) node.x = Math.random() * width;
      if (!node.y) node.y = Math.random() * height;
    });

    // Create a set of valid node IDs for validation
    const nodeIds = new Set(data.nodes.map(node => node.id));
    
    // Filter out links that reference non-existent nodes
    const validLinks = data.links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });

    // Create optimized simulation with maximum spacing
    const simulation = d3.forceSimulation<Node>(data.nodes)
      .force('link', d3.forceLink<Node, Link>(validLinks)
        .id(d => d.id)
        .distance(d => 120 + (d.weight * 40)) // Much larger base distance
        .strength(0.15) // Further reduced strength for maximum spacing
      )
      .force('charge', d3.forceManyBody().strength(-1200)) // Even stronger repulsion
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => 25 + Math.sqrt((d as Node).followers / 600))) // Even larger collision radius
      .alphaDecay(0.01) // Even slower decay for better settling
      .velocityDecay(0.6) // Lower velocity decay for more movement
      .alpha(1) // Start with full energy
      .restart(); // Ensure simulation starts

    // Create container group
    const container = svg.append('g');

    // Add zoom behavior with nodes getting smaller when zooming in
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        const { transform } = event;
        container.attr('transform', transform);
        setCurrentZoom(transform.k || 1);
        
        // Scale nodes smaller when zooming in for better detail view
        const nodeScale = Math.max(0.3, Math.min(1.2, 1 / Math.sqrt(transform.k)));
        const labelScale = Math.max(0.6, Math.min(1.5, 1 / Math.pow(transform.k, 0.2)));
        
        // Update node sizes
        nodes
          .attr('r', d => (8 + Math.sqrt(d.followers / 1000)) * nodeScale)
          .attr('stroke-width', 2 * nodeScale);
        
        // Update label sizes
        labels
          .attr('font-size', `${12 * labelScale}px`)
          .style('opacity', transform.k > 0.3 ? 1 : Math.max(0.2, transform.k * 3));
      });

    svg.call(zoom);

    // Create links
    const links = container.append('g')
      .selectAll('line')
      .data(validLinks)
      .enter().append('line')
      .attr('stroke', '#333')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.weight) * 2);

    // Create nodes
    const nodes = container.append('g')
      .selectAll('circle')
      .data(data.nodes)
      .enter().append('circle')
      .attr('r', d => 8 + Math.sqrt(d.followers / 1000))
      .attr('fill', d => {
        const intensity = Math.min(d.degree / data.stats.maxDegree, 1);
        return d3.interpolateViridis(intensity);
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .call(d3.drag<SVGCircleElement, Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Add labels with better positioning
    const labels = container.append('g')
      .selectAll('text')
      .data(data.nodes)
      .enter().append('text')
      .text(d => d.name)
      .attr('font-size', '12px')
      .attr('fill', '#fff')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('pointer-events', 'none')
      .style('user-select', 'none')
      .style('font-weight', '500')
      .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)');

    // Add hover effects
    nodes
      .on('mouseover', (event, d) => {
        setSelectedNode(d);
        
        // Highlight connected nodes and links
        const connectedNodeIds = new Set();
        links
          .style('stroke-opacity', link => {
            const isConnected = (link.source as Node).id === d.id || (link.target as Node).id === d.id;
            if (isConnected) {
              connectedNodeIds.add((link.source as Node).id);
              connectedNodeIds.add((link.target as Node).id);
            }
            return isConnected ? 1 : 0.1;
          })
          .style('stroke-width', link => {
            const isConnected = (link.source as Node).id === d.id || (link.target as Node).id === d.id;
            return isConnected ? Math.sqrt(link.weight) * 3 : Math.sqrt(link.weight) * 2;
          });

        nodes
          .style('opacity', node => connectedNodeIds.has(node.id) ? 1 : 0.3)
          .attr('stroke-width', node => node.id === d.id ? 4 : 2);

        labels
          .style('opacity', node => connectedNodeIds.has(node.id) ? 1 : 0.3);
      })
      .on('mouseout', () => {
        setSelectedNode(null);
        
        // Reset styles
        links
          .style('stroke-opacity', 0.6)
          .style('stroke-width', d => Math.sqrt(d.weight) * 2);
        
        nodes
          .style('opacity', 1)
          .attr('stroke-width', 2);
        
        labels
          .style('opacity', 1);
      });

    // Update positions on simulation tick with throttling
    let tickCount = 0;
    simulation.on('tick', () => {
      tickCount++;
      
      links
        .attr('x1', d => (d.source as Node).x!)
        .attr('y1', d => (d.source as Node).y!)
        .attr('x2', d => (d.target as Node).x!)
        .attr('y2', d => (d.target as Node).y!);

      nodes
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);

      // Update labels less frequently for better performance
      if (tickCount % 2 === 0) {
        labels
          .attr('x', d => d.x!)
          .attr('y', d => {
            const nodeRadius = 5 + Math.sqrt(d.followers / 1000);
            return d.y! + nodeRadius + 15;
          });
      }
    });

    return () => {
      simulation.stop();
    };
  }, [data, dimensions]);

  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const rect = svgRef.current.parentElement?.getBoundingClientRect();
        if (rect) {
          setDimensions({ width: rect.width, height: 400 });
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <motion.div 
        className="bg-card rounded-lg p-6 border border-border"
        data-chart="network"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h3 className="text-xl font-bold text-card-foreground mb-4">User Interaction Network</h3>
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green"></div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="bg-card rounded-lg p-6 border border-border"
        data-chart="network"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h3 className="text-xl font-bold text-card-foreground mb-4">User Interaction Network</h3>
        <div className="h-96 flex items-center justify-center">
          <p className="text-red-400">{error}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      data-chart="network"
      className="bg-card rounded-lg p-6 border border-border hover:border-neon-green transition-colors duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-card-foreground flex items-center">
          <span className="w-2 h-2 bg-neon-green rounded-full mr-3 animate-pulse"></span>
          User Interaction Network
        </h3>
        
        {data && (
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Nodes: <span className="text-neon-green font-medium">{data.stats.totalNodes}</span></span>
            <span>Edges: <span className="text-neon-green font-medium">{data.stats.totalEdges}</span></span>
            <span>Avg Degree: <span className="text-neon-green font-medium">{(data.stats.avgDegree || 0).toFixed(1)}</span></span>
          </div>
        )}
      </div>
      
      <div className="relative">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="border border-border/30 rounded bg-background/50"
        />
        
        {/* Zoom Controls */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <button
            onClick={() => {
              const svg = d3.select(svgRef.current!);
              const zoom = d3.zoom<SVGSVGElement, unknown>();
              svg.transition().duration(300).call(
                zoom.scaleBy, 1.5
              );
            }}
            className="w-8 h-8 bg-card border border-border rounded flex items-center justify-center text-neon-green hover:bg-neon-green hover:text-background transition-colors"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => {
              const svg = d3.select(svgRef.current!);
              const zoom = d3.zoom<SVGSVGElement, unknown>();
              svg.transition().duration(300).call(
                zoom.scaleBy, 0.67
              );
            }}
            className="w-8 h-8 bg-card border border-border rounded flex items-center justify-center text-neon-green hover:bg-neon-green hover:text-background transition-colors"
            title="Zoom Out"
          >
            −
          </button>
          <button
            onClick={() => {
              const svg = d3.select(svgRef.current!);
              const zoom = d3.zoom<SVGSVGElement, unknown>();
              svg.transition().duration(500).call(
                zoom.transform,
                d3.zoomIdentity
              );
            }}
            className="w-8 h-8 bg-card border border-border rounded flex items-center justify-center text-neon-cyan hover:bg-neon-cyan hover:text-background transition-colors text-xs"
            title="Reset Zoom"
          >
            ⌂
          </button>
        </div>
        
        {/* Zoom Level Indicator */}
        <div className="absolute bottom-4 left-4 bg-card border border-border rounded px-2 py-1 text-xs text-muted-foreground">
          Zoom: {((currentZoom || 1) * 100).toFixed(0)}%
        </div>
        
        {selectedNode && (
          <motion.div 
            className="absolute top-4 right-4 bg-card border border-border rounded-lg p-3 shadow-lg min-w-48"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <h4 className="font-bold text-card-foreground mb-2">{selectedNode.name}</h4>
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">
                Followers: <span className="text-neon-green font-medium">{selectedNode.followers?.toLocaleString() || '0'}</span>
              </p>
              <p className="text-muted-foreground">
                Connections: <span className="text-neon-green font-medium">{selectedNode.degree}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Drag to move • Click to select
              </p>
            </div>
          </motion.div>
        )}
      </div>
      
      <div className="mt-4 text-xs text-muted-foreground">
        <p>• Node size represents follower count • Color intensity shows connection degree</p>
        <p>• Hover over nodes to highlight connections • Drag nodes to rearrange</p>
        <p>• Use zoom controls or mouse wheel to zoom • Click reset to return to original view</p>
      </div>
    </motion.div>
  );
};

export default NetworkGraph;