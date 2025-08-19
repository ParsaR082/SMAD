'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'chart' | 'card' | 'text' | 'circle';
  animate?: boolean;
}

const Skeleton = ({ 
  className = '', 
  variant = 'default', 
  animate = true 
}: SkeletonProps) => {
  const baseClasses = 'bg-gradient-to-r from-muted via-muted-foreground/20 to-muted rounded';
  
  const variantClasses = {
    default: 'h-4 w-full',
    chart: 'h-80 w-full',
    card: 'h-32 w-full',
    text: 'h-4 w-3/4',
    circle: 'h-12 w-12 rounded-full'
  };

  const skeletonClasses = cn(
    baseClasses,
    variantClasses[variant],
    className
  );

  if (!animate) {
    return <div className={skeletonClasses} />;
  }

  return (
    <motion.div
      className={skeletonClasses}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
  );
};

// Chart Skeleton Component
export const ChartSkeleton = ({ className = '' }: { className?: string }) => {
  return (
    <motion.div 
      className={`bg-gradient-to-br from-card to-secondary rounded-lg p-6 border border-border ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Skeleton variant="circle" className="w-3 h-3" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
      
      {/* Chart Area */}
      <Skeleton variant="chart" />
      
      {/* Footer */}
      <div className="mt-4 flex justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </motion.div>
  );
};

// Stats Card Skeleton
export const StatsCardSkeleton = ({ className = '' }: { className?: string }) => {
  return (
    <motion.div 
      className={`bg-gradient-to-br from-card to-secondary rounded-lg p-4 border border-border ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-4 w-20" />
    </motion.div>
  );
};

// Insight Card Skeleton
export const InsightCardSkeleton = ({ className = '' }: { className?: string }) => {
  return (
    <motion.div 
      className={`bg-gradient-to-br from-card to-secondary rounded-lg p-6 border border-border ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center mb-3">
        <Skeleton variant="circle" className="w-2 h-2 mr-3" />
        <Skeleton className="h-5 w-28" />
      </div>
      
      {/* Content */}
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between items-center">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Dashboard Skeleton
export const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <Skeleton variant="circle" className="w-3 h-3 mr-4" />
              <Skeleton className="h-10 w-96" />
            </div>
            <Skeleton className="h-6 w-80" />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton variant="circle" className="w-3 h-3" />
          </div>
        </div>
        
        {/* Stats Bar Skeleton */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-card to-secondary rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Skeleton variant="circle" className="w-2 h-2" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <ChartSkeleton key={i} />
        ))}
      </div>

      {/* Insights Section Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <InsightCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};

export default Skeleton;