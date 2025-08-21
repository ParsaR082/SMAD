/**
 * Script to process existing posts and apply sentiment analysis
 * Run with: npx tsx scripts/process-sentiment.ts
 */

import { PrismaClient } from '@prisma/client';
import { 
  analyzeUnprocessedPosts,
  aggregateDailySentiment,
  processNewPosts
} from '../src/lib/sentimentService';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting sentiment analysis processing...');
  
  try {
    // Step 1: Analyze all unprocessed posts
    console.log('\n📊 Step 1: Analyzing unprocessed posts...');
    const analysisResult = await analyzeUnprocessedPosts(1000); // Process up to 1000 posts
    console.log(`✅ Processed ${analysisResult.processed} posts`);
    
    if (analysisResult.results.length > 0) {
      console.log('\n📈 Sample results:');
      analysisResult.results.slice(0, 5).forEach((result, index) => {
        console.log(`${index + 1}. ${result.sentiment.toUpperCase()} (${result.score.toFixed(2)}) - ${result.content}`);
      });
    }

    // Step 2: Aggregate daily sentiment for the last 30 days
    console.log('\n📅 Step 2: Aggregating daily sentiment statistics...');
    const today = new Date();
    const aggregationPromises = [];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      aggregationPromises.push(aggregateDailySentiment(date));
    }
    
    const aggregationResults = await Promise.all(aggregationPromises);
    const totalAggregated = aggregationResults.reduce((sum, result) => sum + result.totalPosts, 0);
    console.log(`✅ Aggregated sentiment data for ${aggregationResults.length} days (${totalAggregated} total posts)`);

    // Step 3: Show summary statistics
    console.log('\n📊 Step 3: Summary Statistics');
    const totalPosts = await prisma.post.count();
    const processedPosts = await prisma.post.count({
      where: {
        sentimentScore: {
          not: null
        }
      }
    });
    
    const sentimentBreakdown = await prisma.post.groupBy({
      by: ['sentiment'],
      where: {
        sentimentScore: {
          not: null
        }
      },
      _count: {
        sentiment: true
      }
    });

    console.log(`📈 Total posts: ${totalPosts}`);
    console.log(`✅ Processed posts: ${processedPosts} (${((processedPosts / totalPosts) * 100).toFixed(1)}%)`);
    console.log('\n🎯 Sentiment Distribution:');
    
    sentimentBreakdown.forEach(item => {
      const percentage = ((item._count.sentiment / processedPosts) * 100).toFixed(1);
      const sentimentName = item.sentiment === 'POS' ? 'Positive' : 
                           item.sentiment === 'NEG' ? 'Negative' : 'Neutral';
      console.log(`   ${sentimentName}: ${item._count.sentiment} (${percentage}%)`);
    });

    // Step 4: Show recent daily aggregations
    console.log('\n📅 Recent Daily Sentiment Trends:');
    const recentDailyStats = await prisma.sentimentDaily.findMany({
      where: {
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    const dailyStatsMap = new Map();
    recentDailyStats.forEach(stat => {
      const dateKey = stat.date.toISOString().split('T')[0];
      if (!dailyStatsMap.has(dateKey)) {
        dailyStatsMap.set(dateKey, { date: dateKey, pos: 0, neg: 0, neu: 0 });
      }
      const dayStats = dailyStatsMap.get(dateKey);
      if (stat.sentiment === 'POS') dayStats.pos = stat.count;
      if (stat.sentiment === 'NEG') dayStats.neg = stat.count;
      if (stat.sentiment === 'NEU') dayStats.neu = stat.count;
    });

    Array.from(dailyStatsMap.values())
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7)
      .forEach(day => {
        const total = day.pos + day.neg + day.neu;
        console.log(`   ${day.date}: +${day.pos} -${day.neg} =${day.neu} (${total} total)`);
      });

    console.log('\n🎉 Sentiment analysis processing completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during sentiment processing:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { main };