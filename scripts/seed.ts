import { PrismaClient, Sentiment, EdgeType } from '@prisma/client'
import mockData from '../src/data/mockData.json'

const prisma = new PrismaClient()

interface MockUser {
  id: string
  handle: string
  name: string
  followers: number
  createdAt: string
}

interface MockPost {
  id: string
  userId: string
  text: string
  createdAt: string
  likes: number
  retweets: number
  hashtags: string[]
  mentions: string[]
  sentiment: string
  score: number
}

interface MockEdge {
  id: string
  srcUserId: string
  dstUserId: string
  type: string
  weight: number
  timestamp: string
}

interface MockHashtagDaily {
  id: string
  hashtag: string
  date: string
  count: number
}

interface MockSentimentDaily {
  id: string
  scope: string
  key: string
  date: string
  pos: number
  neg: number
  neu: number
}

async function main() {
  console.log('🌱 Starting database seeding...')

  try {
    console.log('🌱 Starting database seeding (skipping data clearing to avoid transactions)...')

    // Seed Users
    console.log('👥 Seeding users...')
    const users = mockData.users as MockUser[]
    for (const user of users) {
      try {
        await prisma.user.upsert({
          where: { username: user.handle },
          update: {},
          create: {
            username: user.handle,
            displayName: user.name,
            followers: user.followers,
            following: Math.floor(user.followers * 0.3), // Estimate following count
            verified: user.followers > 20000, // Verify users with high follower count
            createdAt: new Date(user.createdAt),
          },
        })
      } catch (error) {
        console.log(`⚠️  Skipping duplicate user: ${user.handle}`)
      }
    }
    console.log(`✅ Created ${users.length} users`)

    // Seed Posts
    console.log('📝 Seeding posts...')
    const posts = mockData.posts as MockPost[]
    for (const post of posts) {
      // Find the user by their handle
      const user = await prisma.user.findUnique({
        where: { username: users.find(u => u.id === post.userId)?.handle },
      })

      if (user) {
        await prisma.post.create({
          data: {
            content: post.text,
            hashtags: post.hashtags,
            mentions: post.mentions,
            sentiment: post.sentiment as Sentiment,
            likes: post.likes,
            retweets: post.retweets,
            replies: Math.floor(post.likes * 0.1), // Estimate replies
            userId: user.id,
            createdAt: new Date(post.createdAt),
          },
        })
      }
    }
    console.log(`✅ Created ${posts.length} posts`)

    // Seed Edges
    console.log('🔗 Seeding edges...')
    const edges = mockData.edges as MockEdge[]
    for (const edge of edges) {
      // Find source and destination users
      const srcUser = await prisma.user.findUnique({
        where: { username: users.find(u => u.id === edge.srcUserId)?.handle },
      })
      const dstUser = await prisma.user.findUnique({
        where: { username: users.find(u => u.id === edge.dstUserId)?.handle },
      })

      if (srcUser && dstUser) {
        try {
          await prisma.edge.create({
            data: {
              type: edge.type as EdgeType,
              srcUserId: srcUser.id,
              dstUserId: dstUser.id,
              createdAt: new Date(edge.timestamp),
            },
          })
        } catch (error) {
          // Skip duplicate edges (unique constraint)
          console.log(`⚠️  Skipping duplicate edge: ${edge.id}`)
        }
      }
    }
    console.log(`✅ Created edges`)

    // Seed Hashtag Daily
    console.log('📊 Seeding hashtag daily data...')
    const hashtagDaily = mockData.hashtagDaily as MockHashtagDaily[]
    for (const item of hashtagDaily) {
      try {
        await prisma.hashtagDaily.create({
          data: {
            hashtag: item.hashtag,
            date: new Date(item.date),
            count: item.count,
            reach: Math.floor(item.count * 150), // Estimate reach
            engagement: Math.floor(item.count * 25), // Estimate engagement
          },
        })
      } catch (error) {
        // Skip duplicates
        console.log(`⚠️  Skipping duplicate hashtag daily: ${item.hashtag} - ${item.date}`)
      }
    }
    console.log(`✅ Created ${hashtagDaily.length} hashtag daily records`)

    // Seed Sentiment Daily
    console.log('😊 Seeding sentiment daily data...')
    const sentimentDaily = mockData.sentimentDaily as MockSentimentDaily[]
    for (const item of sentimentDaily) {
      const date = new Date(item.date)
      
      // Create separate records for each sentiment type
      const sentiments = [
        { sentiment: 'POS' as Sentiment, count: item.pos, avgScore: 0.7 },
        { sentiment: 'NEG' as Sentiment, count: item.neg, avgScore: -0.5 },
        { sentiment: 'NEU' as Sentiment, count: item.neu, avgScore: 0.0 },
      ]

      for (const sentimentData of sentiments) {
        if (sentimentData.count > 0) {
          try {
            await prisma.sentimentDaily.create({
              data: {
                date: date,
                sentiment: sentimentData.sentiment,
                count: sentimentData.count,
                avgScore: sentimentData.avgScore,
              },
            })
          } catch (error) {
            // Skip duplicates
            console.log(`⚠️  Skipping duplicate sentiment daily: ${sentimentData.sentiment} - ${item.date}`)
          }
        }
      }
    }
    console.log(`✅ Created sentiment daily records`)

    console.log('🎉 Database seeding completed successfully!')

    // Print summary statistics
    const userCount = await prisma.user.count()
    const postCount = await prisma.post.count()
    const edgeCount = await prisma.edge.count()
    const hashtagDailyCount = await prisma.hashtagDaily.count()
    const sentimentDailyCount = await prisma.sentimentDaily.count()

    console.log('\n📈 Database Summary:')
    console.log(`👥 Users: ${userCount}`)
    console.log(`📝 Posts: ${postCount}`)
    console.log(`🔗 Edges: ${edgeCount}`)
    console.log(`📊 Hashtag Daily Records: ${hashtagDailyCount}`)
    console.log(`😊 Sentiment Daily Records: ${sentimentDailyCount}`)

  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })