// MongoDB replica set initialization script
print('Starting replica set initialization...');

// Wait for MongoDB to be ready
sleep(1000);

try {
  // Check if replica set is already initialized
  var status = rs.status();
  print('Replica set already initialized:', status.ok);
} catch (e) {
  print('Initializing replica set...');
  
  // Initialize replica set
  var config = {
    _id: 'rs0',
    members: [
      {
        _id: 0,
        host: 'localhost:27017'
      }
    ]
  };
  
  var result = rs.initiate(config);
  print('Replica set initialization result:', result);
  
  // Wait for replica set to be ready
  sleep(2000);
  
  print('Replica set initialization completed');
}