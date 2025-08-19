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

const TopHashtagsChart = () => {
  const [data, setData] = useState<HashtagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/hashtags/top');
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
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
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
      className="bg-card rounded-lg p-6 border border-border hover:border-neon-cyan transition-colors duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
    >
      <h3 className="text-xl font-bold text-card-foreground mb-4 flex items-center">
        <span className="w-2 h-2 bg-neon-cyan rounded-full mr-3 animate-pulse"></span>
        Top Hashtags
      </h3>
      
      <div className="h-80">
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
              fill="url(#barGradient)"
              radius={[4, 4, 0, 0]}
              stroke="#00ffff"
              strokeWidth={1}
            />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00ffff" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#00ffff" stopOpacity={0.3} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-sm text-muted-foreground">
        Showing top {data.length} most popular hashtags
      </div>
    </motion.div>
  );
};

export default TopHashtagsChart;