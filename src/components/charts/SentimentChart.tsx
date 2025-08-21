'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

interface SentimentData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    distribution: SentimentData[];
    total: number;
    trends: Array<{ date: string; positive: number; negative: number; neutral: number }>;
  };
}

interface SentimentChartProps {
  filters?: {
    timeRange?: string;
    sentiment?: string;
    hashtag?: string;
    user?: string;
  };
}

const SentimentChart = ({ filters }: SentimentChartProps) => {
  const [data, setData] = useState<SentimentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters?.timeRange) params.append('timeRange', filters.timeRange);
        if (filters?.user) params.append('user', filters.user);
        
        const url = `/api/sentiment/summary${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);
        const result: ApiResponse = await response.json();
        
        if (result.success) {
          setData(result.data.distribution);
          setTotal(result.data.total);
        } else {
          setError('Failed to fetch sentiment data');
        }
      } catch (err) {
        setError('Error loading data');
        console.error('Error fetching sentiment data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: SentimentData }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-card-foreground font-medium">{data.name}</p>
          <p className="text-neon-cyan">
            Count: <span className="font-bold">{data.value}</span>
          </p>
          <p className="text-neon-magenta">
            Percentage: <span className="font-bold">{data.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: { cx?: number; cy?: number; midAngle?: number; innerRadius?: number; outerRadius?: number; percent?: number }) => {
    if (!cx || !cy || midAngle === undefined || !innerRadius || !outerRadius || !percent) {
      return null;
    }
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  if (loading) {
    return (
      <motion.div 
        className="bg-card rounded-lg p-6 border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h3 className="text-xl font-bold text-card-foreground mb-4">Sentiment Distribution</h3>
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
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h3 className="text-xl font-bold text-card-foreground mb-4">Sentiment Distribution</h3>
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
      transition={{ duration: 0.5, delay: 0.2 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-card-foreground flex items-center">
          <span className="w-2 h-2 bg-neon-cyan rounded-full mr-3 animate-pulse"></span>
          Sentiment Distribution
        </h3>
        <div className="text-sm text-muted-foreground">
          Total Posts: <span className="text-neon-cyan font-medium">{total?.toLocaleString() || '0'}</span>
        </div>
      </div>
      
      <div className="h-80 flex items-center">
        <div className="w-2/3">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                animationBegin={0}
                animationDuration={800}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke={activeIndex === index ? '#ffffff' : 'none'}
                    strokeWidth={activeIndex === index ? 2 : 0}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="w-1/3 pl-6">
          <div className="space-y-4">
            {data.map((item, index) => (
              <motion.div 
                key={item.name}
                className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                  activeIndex === index ? 'bg-secondary' : 'hover:bg-secondary/50'
                }`}
                whileHover={{ scale: 1.05 }}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-card-foreground font-medium">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-card-foreground font-bold">{item.value}</div>
                  <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-6 p-3 bg-secondary/30 rounded-lg">
            <h4 className="text-sm font-medium text-card-foreground mb-2">Sentiment Insights</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Overall sentiment is {data[0]?.name.toLowerCase() || 'balanced'}</p>
              <p>• {((data.find(d => d.name === 'Positive')?.percentage || 0) + (data.find(d => d.name === 'Neutral')?.percentage || 0)).toFixed(0)}% non-negative posts</p>
              <p>• Engagement trending upward</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SentimentChart;