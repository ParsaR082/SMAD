/**
 * Script to update existing posts with sentiment scores
 */

import { PrismaClient } from '@prisma/client';
import { analyzeSentiment } from '../src/utils/sentiment';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Updating posts with sentiment scores...');
  
  try {
    // Get posts that have sentiment but no sentimentScore
    const posts = await prisma.post.findMany({
      where: {
        AND: [
          {
            sentiment: {
              not: undefined
            }
          },
          {
            OR: [
              { sentimentScore: null },
              { sentimentScore: 0 }
            ]
          }
        ]
      },
      take: 100 // Process in batches
    });
    
    console.log(`📊 Found ${posts.length} posts to update`);
    
    if (posts.length === 0) {
      console.log('✅ All posts already have sentiment scores!');
      return;
    }
    
    let updated = 0;
    
    for (const post of posts) {
      try {
        // Analyze sentiment using our lexicon-based approach
        const analysis = analyzeSentiment(post.content);
        
        // Update the post with sentiment score and confidence
        await prisma.post.update({
          where: { id: post.id },
          data: {
            sentimentScore: analysis.score,
            sentimentConfidence: analysis.confidence
          }
        });
        
        updated++;
        
        if (updated % 10 === 0) {
          console.log(`📈 Updated ${updated}/${posts.length} posts...`);
        }
        
      } catch (error) {
        console.error(`❌ Error updating post ${post.id}:`, error);
      }
    }
    
    console.log(`✅ Successfully updated ${updated} posts with sentiment scores`);
    
    // Show some statistics
    const stats = await prisma.post.groupBy({
      by: ['sentiment'],
      where: {
        sentimentScore: {
          not: null
        }
      },
      _count: {
        sentiment: true
      },
      _avg: {
        sentimentScore: true
      }
    });
    
    console.log('\n📊 Sentiment Statistics:');
    stats.forEach(stat => {
      const sentimentName = stat.sentiment === 'POS' ? 'Positive' : 
                           stat.sentiment === 'NEG' ? 'Negative' : 'Neutral';
      console.log(`   ${sentimentName}: ${stat._count.sentiment} posts (avg score: ${stat._avg.sentimentScore?.toFixed(2) || 'N/A'})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();