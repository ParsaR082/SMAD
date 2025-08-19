'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface FilterOption {
  id: string;
  label: string;
  value: string;
}

interface FilterBarProps {
  onFilterChange?: (filters: Record<string, string>) => void;
  className?: string;
}

const FilterBar = ({ onFilterChange, className = '' }: FilterBarProps) => {
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const timeRangeOptions: FilterOption[] = [
    { id: 'time-1h', label: 'Last Hour', value: '1h' },
    { id: 'time-24h', label: 'Last 24 Hours', value: '24h' },
    { id: 'time-7d', label: 'Last 7 Days', value: '7d' },
    { id: 'time-30d', label: 'Last 30 Days', value: '30d' },
  ];

  const sentimentOptions: FilterOption[] = [
    { id: 'sentiment-all', label: 'All Sentiment', value: 'all' },
    { id: 'sentiment-pos', label: 'Positive', value: 'positive' },
    { id: 'sentiment-neu', label: 'Neutral', value: 'neutral' },
    { id: 'sentiment-neg', label: 'Negative', value: 'negative' },
  ];

  const platformOptions: FilterOption[] = [
    { id: 'platform-all', label: 'All Platforms', value: 'all' },
    { id: 'platform-twitter', label: 'Twitter', value: 'twitter' },
    { id: 'platform-instagram', label: 'Instagram', value: 'instagram' },
    { id: 'platform-linkedin', label: 'LinkedIn', value: 'linkedin' },
  ];

  const handleFilterChange = (category: string, value: string) => {
    const newFilters = { ...activeFilters, [category]: value };
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearFilters = () => {
    setActiveFilters({});
    onFilterChange?.({});
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <motion.div 
      className={`bg-gradient-to-r from-card to-secondary rounded-lg border border-border p-4 hover:border-neon-magenta/50 transition-all duration-300 ${className}`}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6,
        type: "spring",
        stiffness: 120,
        damping: 20
      }}
      whileHover={{
        scale: 1.01,
        boxShadow: "0 8px 32px rgba(255, 0, 255, 0.1)"
      }}
    >
      <motion.div 
        className="flex items-center justify-between mb-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="flex items-center space-x-3">
          <motion.span 
            className="w-2 h-2 bg-neon-cyan rounded-full"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.h3 
            className="text-lg font-semibold text-card-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            Filters
          </motion.h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <motion.button
              onClick={clearFilters}
              className="text-sm text-muted-foreground hover:text-neon-magenta transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear All
            </motion.button>
          )}
          
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-neon-cyan hover:text-neon-magenta transition-colors relative overflow-hidden"
            whileHover={{ 
              scale: 1.1,
              backgroundColor: "rgba(255, 0, 255, 0.1)"
            }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ 
                duration: 0.4,
                type: "spring",
                stiffness: 200
              }}
            >
              {isExpanded ? '−' : '+'}
            </motion.div>
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0, y: isExpanded ? 0 : -10 }}
        transition={{ 
          duration: 0.4,
          type: "spring",
          stiffness: 100
        }}
        className="overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-4">
          {/* Time Range Filter */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Time Range
            </label>
            <div className="space-y-2">
              {timeRangeOptions.map((option) => (
                <motion.button
                  key={option.id}
                  onClick={() => handleFilterChange('timeRange', option.value)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                    activeFilters.timeRange === option.value
                      ? 'bg-neon-cyan text-black font-medium'
                      : 'bg-secondary text-secondary-foreground hover:bg-neon-cyan hover:text-black'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Sentiment Filter */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Sentiment
            </label>
            <div className="space-y-2">
              {sentimentOptions.map((option) => (
                <motion.button
                  key={option.id}
                  onClick={() => handleFilterChange('sentiment', option.value)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                    activeFilters.sentiment === option.value
                      ? 'bg-neon-magenta text-black font-medium'
                      : 'bg-secondary text-secondary-foreground hover:bg-neon-magenta hover:text-black'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Platform Filter */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Platform
            </label>
            <div className="space-y-2">
              {platformOptions.map((option) => (
                <motion.button
                  key={option.id}
                  onClick={() => handleFilterChange('platform', option.value)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                    activeFilters.platform === option.value
                      ? 'bg-neon-green text-black font-medium'
                      : 'bg-secondary text-secondary-foreground hover:bg-neon-green hover:text-black'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <motion.div 
          className="mt-4 pt-4 border-t border-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-wrap gap-2">
            {Object.entries(activeFilters).map(([category, value]) => {
              const getLabel = () => {
                if (category === 'timeRange') {
                  return timeRangeOptions.find(opt => opt.value === value)?.label || value;
                }
                if (category === 'sentiment') {
                  return sentimentOptions.find(opt => opt.value === value)?.label || value;
                }
                if (category === 'platform') {
                  return platformOptions.find(opt => opt.value === value)?.label || value;
                }
                return value;
              };

              return (
                <motion.span
                  key={`${category}-${value}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-neon-cyan text-black"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  {getLabel()}
                  <button
                    onClick={() => {
                      const newFilters = { ...activeFilters };
                      delete newFilters[category];
                      setActiveFilters(newFilters);
                      onFilterChange?.(newFilters);
                    }}
                    className="ml-2 hover:text-red-500 transition-colors"
                  >
                    ×
                  </button>
                </motion.span>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default FilterBar;