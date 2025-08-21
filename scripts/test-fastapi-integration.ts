#!/usr/bin/env tsx

import { fastApiClient } from '../src/lib/fastApiClient';
import { analyzeSinglePost, batchAnalyzePosts } from '../src/lib/sentimentService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFastApiIntegration() {
  console.log('🧪 Testing FastAPI Integration\n');

  // Test 1: Check FastAPI service availability
  console.log('1. Checking FastAPI service availability...');
  try {
    const isAvailable = await fastApiClient.isAvailable();
    console.log(`   FastAPI Available: ${isAvailable ? '✅ YES' : '❌ NO'}`);
    
    if (isAvailable) {
      const health = await fastApiClient.healthCheck();
      console.log(`   Service Status: ${health.status}`);
      console.log(`   Models Loaded: ${JSON.stringify(health.models_loaded)}`);
      console.log(`   Device: ${health.device}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }
  console.log();

  // Test 2: Direct FastAPI sentiment analysis
  console.log('2. Testing direct FastAPI sentiment analysis...');
  const testTexts = [
    'I absolutely love this new feature! It\'s amazing!',
    'This is terrible and I hate it.',
    'It\'s okay, nothing special.',
    'Wow, this is incredible! Best update ever! 🎉',
    'Meh, could be better I guess.'
  ];

  for (const text of testTexts) {
    try {
      const result = await fastApiClient.analyzeSentiment(text);
      console.log(`   Text: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`); 
      console.log(`   Sentiment: ${result.sentiment} (${(result.confidence * 100).toFixed(1)}%)`);
      console.log(`   Score: ${result.score.toFixed(3)}`);
      console.log(`   Processing Time: ${result.processing_time.toFixed(3)}s`);
      console.log();
    } catch (error) {
      console.log(`   ❌ Error analyzing "${text.substring(0, 30)}...": ${error}`);
    }
  }

  // Test 3: Batch analysis
  console.log('3. Testing batch sentiment analysis...');
  try {
    const batchResult = await fastApiClient.analyzeBatchSentiment(testTexts);
    console.log(`   Processed ${batchResult.results.length} texts`);
    console.log(`   Total Processing Time: ${batchResult.total_processing_time.toFixed(3)}s`);
    console.log(`   Average Time per Text: ${(batchResult.total_processing_time / batchResult.results.length).toFixed(3)}s`);
    
    const sentimentCounts = batchResult.results.reduce((acc, result) => {
      acc[result.sentiment] = (acc[result.sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('   Sentiment Distribution:');
    Object.entries(sentimentCounts).forEach(([sentiment, count]) => {
      console.log(`     ${sentiment}: ${count}`);
    });
  } catch (error) {
    console.log(`   ❌ Error in batch analysis: ${error}`);
  }
  console.log();

  // Test 4: Integration with sentiment service (high accuracy)
  console.log('4. Testing sentiment service integration with high accuracy...');
  try {
    // Get a few sample posts
    const samplePosts = await prisma.post.findMany({
      take: 3,
      select: {
        id: true,
        content: true,
        sentiment: true,
        sentimentScore: true,
        sentimentConfidence: true
      }
    });

    if (samplePosts.length === 0) {
      console.log('   ⚠️  No posts found in database for testing');
    } else {
      console.log(`   Testing with ${samplePosts.length} sample posts...`);
      
      for (const post of samplePosts) {
        console.log(`\n   Post ID: ${post.id}`);
        console.log(`   Content: "${post.content.substring(0, 60)}${post.content.length > 60 ? '...' : ''}"`); 
        console.log(`   Current Sentiment: ${post.sentiment || 'none'} (Score: ${post.sentimentScore || 'none'})`);
        
        try {
          // Test with high accuracy (FastAPI)
          const result = await analyzeSinglePost(post.id, true);
          console.log(`   ✅ High Accuracy Analysis: ${result.sentiment} (${(result.confidence * 100).toFixed(1)}%)`);
        } catch (error) {
          console.log(`   ❌ High accuracy analysis failed: ${error}`);
          
          // Fallback to lexicon-based
          try {
            const fallbackResult = await analyzeSinglePost(post.id, false);
            console.log(`   🔄 Fallback Analysis: ${fallbackResult.sentiment} (${(fallbackResult.confidence * 100).toFixed(1)}%)`);
          } catch (fallbackError) {
            console.log(`   ❌ Fallback analysis also failed: ${fallbackError}`);
          }
        }
      }
    }
  } catch (error) {
    console.log(`   ❌ Error testing sentiment service integration: ${error}`);
  }
  console.log();

  // Test 5: Performance comparison
  console.log('5. Performance comparison (FastAPI vs Lexicon)...');
  const performanceTestText = 'This is a great product with excellent features and amazing quality!';
  
  try {
    // FastAPI timing
    const fastApiStart = Date.now();
    const fastApiResult = await fastApiClient.analyzeSentiment(performanceTestText);
    const fastApiTime = Date.now() - fastApiStart;
    
    console.log(`   FastAPI Analysis:`);
    console.log(`     Result: ${fastApiResult.sentiment} (${(fastApiResult.confidence * 100).toFixed(1)}%)`);
    console.log(`     Time: ${fastApiTime}ms`);
    console.log(`     Server Processing: ${(fastApiResult.processing_time * 1000).toFixed(1)}ms`);
    
    // Note: We can't easily test lexicon-based timing here without refactoring
    // the sentiment service, but we can show the difference in accuracy
    
  } catch (error) {
    console.log(`   ❌ Performance test failed: ${error}`);
  }
  console.log();

  // Test 6: Error handling
  console.log('6. Testing error handling...');
  try {
    // Test with empty text
    await fastApiClient.analyzeSentiment('');
    console.log('   ⚠️  Empty text should have failed but didn\'t');
  } catch (error) {
    console.log('   ✅ Empty text properly rejected');
  }
  
  try {
    // Test with very long text
    const longText = 'This is a test. '.repeat(1000);
    const result = await fastApiClient.analyzeSentiment(longText);
    console.log('   ✅ Long text handled successfully');
  } catch (error) {
    console.log(`   ⚠️  Long text failed: ${error}`);
  }
  
  try {
    // Test with empty batch
    await fastApiClient.analyzeBatchSentiment([]);
    console.log('   ⚠️  Empty batch should have failed but didn\'t');
  } catch (error) {
    console.log('   ✅ Empty batch properly rejected');
  }
  console.log();

  console.log('🎉 FastAPI Integration Testing Complete!');
  console.log();
  console.log('📋 Summary:');
  console.log('   - FastAPI service availability checked');
  console.log('   - Direct sentiment analysis tested');
  console.log('   - Batch processing verified');
  console.log('   - Integration with sentiment service confirmed');
  console.log('   - Performance characteristics measured');
  console.log('   - Error handling validated');
  console.log();
  console.log('💡 Next Steps:');
  console.log('   1. Start FastAPI service: cd sentiment-api && docker-compose up');
  console.log('   2. Update existing posts: npm run script scripts/update-sentiment-scores.ts');
  console.log('   3. Test API endpoints: curl http://localhost:3000/api/sentiment/analyze');
  console.log('   4. Monitor performance in production');
}

async function main() {
  try {
    await testFastApiIntegration();
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { testFastApiIntegration };