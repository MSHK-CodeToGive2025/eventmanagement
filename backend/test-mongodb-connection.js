import mongoose from 'mongoose';

// MongoDB connection URI
const uri = "mongodb+srv://zubin1:zubin1@zubin-foundation.x6uad3h.mongodb.net/?retryWrites=true&w=majority&appName=zubin-foundation";

async function testConnection() {
    try {
        console.log('🔄 Attempting to connect to MongoDB...');
        
        // Connect to MongoDB using mongoose
        await mongoose.connect(uri);
        
        console.log('✅ Successfully connected to MongoDB!');
        
        // Get the database instance
        const db = mongoose.connection.db;
        
        // List all collections in the database
        const collections = await db.listCollections().toArray();
        
        console.log('\n📁 Collections in database:');
        if (collections.length === 0) {
            console.log('  (No collections found)');
        } else {
            collections.forEach(collection => {
                console.log(`  - ${collection.name}`);
            });
        }
        
        // Test a simple operation - get database stats
        const stats = await db.stats();
        console.log('\n📊 Database stats:');
        console.log(`  - Database name: ${stats.db}`);
        console.log(`  - Collections: ${stats.collections}`);
        console.log(`  - Data size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
        
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:');
        console.error('Error:', error.message);
        
        if (error.message.includes('Authentication failed')) {
            console.error('\n🔐 Authentication Error:');
            console.error('This usually means incorrect username or password.');
            console.error('Please check your credentials in the connection string.');
        } else if (error.message.includes('ENOTFOUND')) {
            console.error('\n🌐 Network Error:');
            console.error('Could not resolve the hostname. Check your internet connection.');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.error('\n🚫 Connection Refused:');
            console.error('The server refused the connection. Check if the cluster is running.');
        } else if (error.message.includes('MongoServerSelectionError')) {
            console.error('\n🔍 Server Selection Error:');
            console.error('Could not connect to any servers in the cluster.');
            console.error('Check if the cluster is running and accessible.');
        }
        
    } finally {
        // Close the connection
        await mongoose.disconnect();
        console.log('\n🔌 Connection closed.');
    }
}

// Run the test
testConnection(); 