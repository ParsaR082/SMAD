'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface HashtagData {
  name: string;
  value: number;
}

interface ApiResponse {
  success: boolean;
  data: HashtagData[];
}

interface TopHashtagsChartProps {
  filters?: {
    timeRange?: string;
    sentiment?: string;
    hashtag?: string;
    user?: string;
  };
}

const TopHashtagsChart = ({ filters }: TopHashtagsChartProps) => {
  const [data, setData] = useState<HashtagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        if (filters?.timeRange) params.append('timeRange', filters.timeRange);
        if (filters?.sentiment) params.append('sentiment', filters.sentiment);
        if (filters?.user) params.append('user', filters.user);
        
        const url = `/api/hashtags/top${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);
        const result: ApiResponse = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError('Failed to fetch hashtag data');
        }
      } catch (err) {
        setError('Error loading data');
        console.error('Error fetching top hashtags:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-card-foreground font-medium">{label}</p>
          <p className="text-neon-cyan">
            Posts: <span className="font-bold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <motion.div 
        className="bg-card rounded-lg p-6 border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-xl font-bold text-card-foreground mb-4">Top Hashtags</h3>
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan"></div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="bg-card rounded-lg p-6 border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-xl font-bold text-card-foreground mb-4">Top Hashtags</h3>
        <div className="h-80 flex items-center justify-center">
          <p className="text-red-400">{error}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      data-chart="top-hashtags"
      className="bg-gradient-to-br from-card to-secondary rounded-lg p-4 md:p-6 border border-border shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      whileHover={{ 
        scale: 1.02,
        y: -4,
        transition: { duration: 0.2 }
      }}
    >
      <motion.h3 
        className="text-lg md:text-xl font-bold text-card-foreground mb-3 md:mb-4 flex items-center"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <motion.span 
          className="w-2 h-2 bg-neon-cyan rounded-full mr-3"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        Top Hashtags
      </motion.h3>
      
      <motion.div 
        className="h-64 md:h-80"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >

            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#333333" 
              opacity={0.3}
            />
            <XAxis 
              dataKey="name" 
              stroke="#a3a3a3"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis 
              stroke="#a3a3a3"
              fontSize={12}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(0, 255, 255, 0.1)' }}
            />
            <Bar 
              dataKey="value" 
              fill="#00ffff"
              radius={[4, 4, 0, 0]}
              stroke="#00ffff"
              strokeWidth={1}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
      
      <motion.div 
        className="mt-3 md:mt-4 text-xs md:text-sm text-muted-foreground"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        Showing top {data.length} most popular hashtags
      </motion.div>
    </motion.div>
  );
};

export default TopHashtagsChart;