import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Connected to database successfully')
    
    // Try to create a test user
    const testUser = await prisma.user.create({
      data: {
        username: 'test_user_' + Date.now(),
        displayName: 'Test User',
        followers: 100,
        following: 50,
        verified: false,
      }
    })
    console.log('✅ Created test user:', testUser)
    
    // Count users
    const userCount = await prisma.user.count()
    console.log(`📊 Total users in database: ${userCount}`)
    
    // Clean up test user
    await prisma.user.delete({
      where: { id: testUser.id }
    })
    console.log('🧹 Cleaned up test user')
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()