import mongoose from 'mongoose';

// MongoDB connection URI
const uri = "mongodb+srv://zubin1:zubin1@zubin-foundation.x6uad3h.mongodb.net/?retryWrites=true&w=majority&appName=zubin-foundation";

async function checkMongoDBStatus() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        
        // Connect to MongoDB using mongoose
        await mongoose.connect(uri);
        
        console.log('✅ Successfully connected to MongoDB!');
        
        // Get the database instance
        const db = mongoose.connection.db;
        
        // List all databases
        const adminDb = mongoose.connection.db.admin();
        const databases = await adminDb.listDatabases();
        
        console.log('\n📊 MongoDB Status Report:');
        console.log('========================');
        
        console.log('\n🗄️  All Databases:');
        databases.databases.forEach(dbInfo => {
            const sizeMB = (dbInfo.sizeOnDisk / 1024 / 1024).toFixed(2);
            console.log(`  - ${dbInfo.name} (${sizeMB} MB)`);
        });
        
        // Check for application databases
        const appDatabases = databases.databases.filter(dbInfo => 
            dbInfo.name !== 'admin' && 
            dbInfo.name !== 'local'
        );
        
        console.log('\n📋 Application Databases:');
        if (appDatabases.length === 0) {
            console.log('  ✅ No application databases found - ready for fresh start!');
        } else {
            appDatabases.forEach(dbInfo => {
                console.log(`  - ${dbInfo.name} (${(dbInfo.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
            });
        }
        
        // Test database operations
        console.log('\n🔧 Database Operations Test:');
        try {
            // Test creating a collection
            const testCollection = db.collection('test_connection');
            await testCollection.insertOne({ test: true, timestamp: new Date() });
            console.log('  ✅ Write operation: SUCCESS');
            
            // Test reading
            const result = await testCollection.findOne({ test: true });
            console.log('  ✅ Read operation: SUCCESS');
            
            // Clean up test data
            await testCollection.drop();
            console.log('  ✅ Cleanup operation: SUCCESS');
            
        } catch (error) {
            console.log(`  ❌ Database operations test failed: ${error.message}`);
        }
        
        // Connection info
        console.log('\n🔗 Connection Information:');
        console.log(`  - Host: zubin-foundation.x6uad3h.mongodb.net`);
        console.log(`  - Username: zubin1`);
        console.log(`  - Authentication: ✅ Working`);
        console.log(`  - Connection State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
        
        // Recommendations
        console.log('\n💡 Recommendations:');
        console.log('  ✅ Your MongoDB is clean and ready for testing!');
        console.log('  ✅ Connection is working properly');
        console.log('  ✅ Authentication is successful');
        console.log('  📝 Update your .env file with this connection string:');
        console.log(`     MONGODB_URI="${uri}"`);
        
        if (appDatabases.length > 0) {
            console.log('  ⚠️  You have existing application databases');
            console.log('  🧹 Run clean-mongodb.js if you want to start fresh');
        }
        
    } catch (error) {
        console.error('❌ Failed to check MongoDB status:');
        console.error('Error:', error.message);
    } finally {
        // Close the connection
        await mongoose.disconnect();
        console.log('\n🔌 Connection closed.');
    }
}

// Run the status check
checkMongoDBStatus(); 