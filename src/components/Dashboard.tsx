'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TopHashtagsChart from './charts/TopHashtagsChart';
import HashtagTrendChart from './charts/HashtagTrendChart';
import SentimentChart from './charts/SentimentChart';
import NetworkGraph from './charts/NetworkGraph';

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState('');
  const [lastSync, setLastSync] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
      setLastSync(new Date().toLocaleString());
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-background p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.header 
        className="mb-8"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center">
              <span className="w-3 h-3 bg-neon-magenta rounded-full mr-4 animate-pulse"></span>
              Social Media Analytics Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Real-time insights into social media trends, sentiment, and user interactions
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Last Updated</div>
              <div className="text-neon-cyan font-medium">
                {currentTime || 'Loading...'}
              </div>
            </div>
            
            <motion.div 
              className="w-3 h-3 bg-neon-green rounded-full"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </div>
        
        {/* Stats Bar */}
        <motion.div 
          className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4"
          variants={itemVariants}
        >
          <div className="bg-card rounded-lg p-4 border border-border hover:border-neon-magenta transition-colors">
            <div className="text-2xl font-bold text-neon-magenta">2.4K</div>
            <div className="text-sm text-muted-foreground">Total Posts</div>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border hover:border-neon-cyan transition-colors">
            <div className="text-2xl font-bold text-neon-cyan">156</div>
            <div className="text-sm text-muted-foreground">Active Users</div>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border hover:border-neon-green transition-colors">
            <div className="text-2xl font-bold text-neon-green">89%</div>
            <div className="text-sm text-muted-foreground">Positive Sentiment</div>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border hover:border-neon-yellow transition-colors">
            <div className="text-2xl font-bold text-neon-yellow">42</div>
            <div className="text-sm text-muted-foreground">Trending Tags</div>
          </div>
        </motion.div>
      </motion.header>

      {/* Main Dashboard Grid */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={containerVariants}
      >
        {/* Top Hashtags Chart */}
        <motion.div variants={itemVariants}>
          <TopHashtagsChart />
        </motion.div>

        {/* Hashtag Trend Chart */}
        <motion.div variants={itemVariants}>
          <HashtagTrendChart />
        </motion.div>

        {/* Sentiment Chart */}
        <motion.div variants={itemVariants}>
          <SentimentChart />
        </motion.div>

        {/* Network Graph */}
        <motion.div variants={itemVariants}>
          <NetworkGraph />
        </motion.div>
      </motion.div>

      {/* Additional Insights Section */}
      <motion.section 
        className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={containerVariants}
      >
        <motion.div 
          className="bg-card rounded-lg p-6 border border-border hover:border-neon-magenta transition-colors"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
        >
          <h3 className="text-lg font-bold text-card-foreground mb-3 flex items-center">
            <span className="w-2 h-2 bg-neon-magenta rounded-full mr-3"></span>
            Trending Topics
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">#AI</span>
              <span className="text-neon-magenta font-medium">+24%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">#WebDev</span>
              <span className="text-neon-magenta font-medium">+18%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">#Blockchain</span>
              <span className="text-neon-magenta font-medium">+12%</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-card rounded-lg p-6 border border-border hover:border-neon-cyan transition-colors"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
        >
          <h3 className="text-lg font-bold text-card-foreground mb-3 flex items-center">
            <span className="w-2 h-2 bg-neon-cyan rounded-full mr-3"></span>
            Top Influencers
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">@techguru</span>
              <span className="text-neon-cyan font-medium">125K</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">@aiexpert</span>
              <span className="text-neon-cyan font-medium">98K</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">@webdev_pro</span>
              <span className="text-neon-cyan font-medium">87K</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-card rounded-lg p-6 border border-border hover:border-neon-green transition-colors"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
        >
          <h3 className="text-lg font-bold text-card-foreground mb-3 flex items-center">
            <span className="w-2 h-2 bg-neon-green rounded-full mr-3"></span>
            Engagement Metrics
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Avg. Likes</span>
              <span className="text-neon-green font-medium">1.2K</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Avg. Shares</span>
              <span className="text-neon-green font-medium">340</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Avg. Comments</span>
              <span className="text-neon-green font-medium">89</span>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <motion.footer 
        className="mt-12 text-center text-muted-foreground text-sm"
        variants={itemVariants}
      >
        <p>Social Media Analytics Dashboard • Built with Next.js, D3.js, and Framer Motion</p>
        <p className="mt-1">Data refreshes every 5 minutes • Last sync: {lastSync || 'Loading...'}</p>
      </motion.footer>
    </motion.div>
  );
};

export default Dashboard;