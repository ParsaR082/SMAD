import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function for combining Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatting utilities
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Number formatting utilities
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
}

// Color utilities for charts
export const chartColors = {
  primary: '#00ffff',
  secondary: '#ff00ff',
  accent: '#00ff00',
  warning: '#ffff00',
  success: '#00ff00',
  error: '#ff0040',
  muted: '#737373',
};

export function getChartColor(index: number): string {
  const colors = Object.values(chartColors);
  return colors[index % colors.length];
}

// Sentiment analysis utilities
export function getSentimentColor(sentiment: 'POS' | 'NEG' | 'NEU'): string {
  switch (sentiment) {
    case 'POS':
      return chartColors.success;
    case 'NEG':
      return chartColors.error;
    case 'NEU':
      return chartColors.muted;
    default:
      return chartColors.muted;
  }
}

export function getSentimentLabel(sentiment: 'POS' | 'NEG' | 'NEU'): string {
  switch (sentiment) {
    case 'POS':
      return 'Positive';
    case 'NEG':
      return 'Negative';
    case 'NEU':
      return 'Neutral';
    default:
      return 'Unknown';
  }
}

// Data processing utilities
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: never[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}