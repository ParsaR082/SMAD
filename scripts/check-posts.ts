/**
 * Script to check posts and their sentiment status
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking posts sentiment status...');
  
  try {
    // Check total posts
    const totalPosts = await prisma.post.count();
    console.log(`📊 Total posts: ${totalPosts}`);
    
    // Check posts with sentiment values
    const postsWithSentiment = await prisma.post.count({
      where: {
        sentiment: {
          not: undefined
        }
      }
    });
    console.log(`✅ Posts with sentiment: ${postsWithSentiment}`);
    
    // Check posts with sentiment scores
    const postsWithScores = await prisma.post.count({
      where: {
        sentimentScore: {
          not: null
        }
      }
    });
    console.log(`📈 Posts with sentiment scores: ${postsWithScores}`);
    
    // Show sample posts
    const samplePosts = await prisma.post.findMany({
      take: 5,
      select: {
        id: true,
        content: true,
        sentiment: true,
        sentimentScore: true,
        sentimentConfidence: true
      }
    });
    
    console.log('\n📝 Sample posts:');
    samplePosts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.sentiment || 'NO_SENTIMENT'} (${post.sentimentScore || 'N/A'}) - ${post.content.substring(0, 50)}...`);
    });
    
    // Check posts that need processing (have sentiment but no score)
    const needsProcessing = await prisma.post.count({
      where: {
        AND: [
          {
            sentiment: {
              not: undefined
            }
          },
          {
            sentimentScore: null
          }
        ]
      }
    });
    console.log(`\n🔄 Posts needing score processing: ${needsProcessing}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();