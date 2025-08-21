// Type definitions for Social Media Analytics Dashboard

export interface User {
  id: string;
  handle: string;
  name: string;
  followers: number;
  createdAt: Date;
}

export interface Post {
  id: string;
  userId: string;
  text: string;
  createdAt: Date;
  likes: number;
  retweets: number;
  hashtags: string[];
  mentions: string[];
  sentiment: 'POS' | 'NEG' | 'NEU';
  score: number;
}

export interface Edge {
  id: string;
  srcUserId: string;
  dstUserId: string;
  type: 'mention' | 'retweet';
  weight: number;
  timestamp: Date;
}

export interface HashtagDaily {
  id: string;
  hashtag: string;
  date: Date;
  count: number;
}

export interface SentimentDaily {
  id: string;
  scope: 'global' | 'hashtag' | 'user';
  key: string;
  date: Date;
  pos: number;
  neg: number;
  neu: number;
}

// Chart data types
export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number | boolean | undefined;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  [key: string]: string | number | boolean | undefined;
}

// Filter types
export interface DateRange {
  start: Date;
  end: Date;
}

export interface DashboardFilters {
  dateRange: DateRange;
  hashtags: string[];
  users: string[];
  sentiment?: 'POS' | 'NEG' | 'NEU';
}