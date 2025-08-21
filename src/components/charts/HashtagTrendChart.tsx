'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface TrendData {
  date: string;
  value: number;
  fullDate: string;
}

interface ApiResponse {
  success: boolean;
  data: TrendData[];
  hashtag: string;
}

interface HashtagTrendChartProps {
  filters?: {
    timeRange?: string;
    sentiment?: string;
    hashtag?: string;
  };
  onFilterChange?: (filters: Record<string, string>) => void;
}

const HashtagTrendChart = ({ filters, onFilterChange }: HashtagTrendChartProps) => {
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHashtag, setSelectedHashtag] = useState(filters?.hashtag || '#AI');
  
  const availableHashtags = ['#AI', '#WebDev', '#Blockchain', '#MachineLearning'];

  // Sync selectedHashtag with filters prop
  useEffect(() => {
    if (filters?.hashtag && filters.hashtag !== selectedHashtag) {
      setSelectedHashtag(filters.hashtag);
    }
  }, [filters?.hashtag, selectedHashtag]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        const hashtag = filters?.hashtag || selectedHashtag;
        params.append('hashtag', hashtag);
        if (filters?.timeRange) params.append('timeRange', filters.timeRange);
        if (filters?.sentiment) params.append('sentiment', filters.sentiment);
        
        const response = await fetch(`/api/hashtags/trend?${params.toString()}`);
        const result: ApiResponse = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError('Failed to fetch trend data');
        }
      } catch (err) {
        setError('Error loading data');
        console.error('Error fetching hashtag trend:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedHashtag, filters]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-card-foreground font-medium">{label}</p>
          <p className="text-neon-magenta">
            Posts: <span className="font-bold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: { cx?: number; cy?: number }) => {
    const { cx, cy } = props;
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={4} 
        fill="#ff00ff" 
        stroke="#ffffff" 
        strokeWidth={2}
        className="animate-pulse"
      />
    );
  };

  if (loading) {
    return (
      <motion.div 
        className="bg-card rounded-lg p-6 border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h3 className="text-xl font-bold text-card-foreground mb-4">Hashtag Trends</h3>
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-magenta"></div>
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
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h3 className="text-xl font-bold text-card-foreground mb-4">Hashtag Trends</h3>
        <div className="h-80 flex items-center justify-center">
          <p className="text-red-400">{error}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="bg-card rounded-lg p-6 border border-border hover:border-neon-magenta transition-colors duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-card-foreground flex items-center">
          <span className="w-2 h-2 bg-neon-magenta rounded-full mr-3 animate-pulse"></span>
          Hashtag Trends
        </h3>
        
        <div className="flex gap-2">
          {availableHashtags.map((hashtag) => (
            <motion.button
              key={hashtag}
              onClick={() => {
                setSelectedHashtag(hashtag);
                onFilterChange?.({ hashtag });
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedHashtag === hashtag
                  ? 'bg-neon-magenta text-black'
                  : 'bg-secondary text-secondary-foreground hover:bg-neon-magenta hover:text-black'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {hashtag}
            </motion.button>
          ))}
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#333333" 
              opacity={0.3}
            />
            <XAxis 
              dataKey="date" 
              stroke="#a3a3a3"
              fontSize={12}
            />
            <YAxis 
              stroke="#a3a3a3"
              fontSize={12}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: '#ff00ff', strokeWidth: 1, strokeDasharray: '5 5' }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#ff00ff"
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={{ r: 6, fill: '#ff00ff', stroke: '#ffffff', strokeWidth: 2 }}
              strokeDasharray="0"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-sm text-muted-foreground">
        Showing trend for <span className="text-neon-magenta font-medium">{selectedHashtag}</span> over the last week
      </div>
    </motion.div>
  );
};

export default HashtagTrendChart;