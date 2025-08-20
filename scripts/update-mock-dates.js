const fs = require('fs');
const path = require('path');

// Read the mock data file
const mockDataPath = path.join(__dirname, '..', 'src', 'data', 'mockData.json');
const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));

// Get current date and calculate date ranges
const now = new Date();
const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

// Update hashtagDaily dates to be within the last 30 days
mockData.hashtagDaily.forEach((item, index) => {
  // Distribute dates across the last 30 days
  const daysBack = Math.floor((index / mockData.hashtagDaily.length) * 30);
  const newDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  item.date = newDate.toISOString();
});

// Write the updated data back to the file
fs.writeFileSync(mockDataPath, JSON.stringify(mockData, null, 2));
console.log('Mock data dates updated successfully!');
console.log(`Updated ${mockData.hashtagDaily.length} hashtag daily entries`);
console.log(`Date range: ${thirtyDaysAgo.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}`);