import mongoose from 'mongoose';

// MongoDB connection URI
const uri = "mongodb+srv://zubin1:zubin1@zubin-foundation.x6uad3h.mongodb.net/?retryWrites=true&w=majority&appName=zubin-foundation";

async function cleanDatabase() {
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
        
        console.log('\n📊 Current Databases:');
        databases.databases.forEach(dbInfo => {
            console.log(`  - ${dbInfo.name} (${(dbInfo.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
        });
        
        // Clean application-specific databases (skip admin and local)
        const databasesToClean = databases.databases.filter(dbInfo => 
            dbInfo.name !== 'admin' && 
            dbInfo.name !== 'local' &&
            dbInfo.name !== 'test'
        );
        
        if (databasesToClean.length === 0) {
            console.log('\n✅ No application databases to clean!');
            console.log('Your MongoDB is already clean for fresh testing.');
        } else {
            console.log('\n🧹 Cleaning application databases:');
            
            for (const dbInfo of databasesToClean) {
                console.log(`\n🗑️  Cleaning database: ${dbInfo.name}`);
                
                try {
                    const currentDb = mongoose.connection.client.db(dbInfo.name);
                    const collections = await currentDb.listCollections().toArray();
                    
                    if (collections.length === 0) {
                        console.log(`  - No collections found in ${dbInfo.name}`);
                    } else {
                        for (const collection of collections) {
                            const count = await currentDb.collection(collection.name).countDocuments();
                            console.log(`  - Dropping collection: ${collection.name} (${count} documents)`);
                            await currentDb.collection(collection.name).drop();
                        }
                    }
                    
                    // Drop the database itself
                    await currentDb.dropDatabase();
                    console.log(`  ✅ Dropped database: ${dbInfo.name}`);
                    
                } catch (error) {
                    console.log(`  ❌ Error cleaning ${dbInfo.name}: ${error.message}`);
                }
            }
        }
        
        // Also clean the 'test' database if it exists
        try {
            const testDb = mongoose.connection.client.db('test');
            const testCollections = await testDb.listCollections().toArray();
            
            if (testCollections.length > 0) {
                console.log('\n🧹 Cleaning test database:');
                for (const collection of testCollections) {
                    const count = await testDb.collection(collection.name).countDocuments();
                    console.log(`  - Dropping collection: ${collection.name} (${count} documents)`);
                    await testDb.collection(collection.name).drop();
                }
                console.log('  ✅ Test database cleaned');
            }
        } catch (error) {
            console.log(`  ❌ Error cleaning test database: ${error.message}`);
        }
        
        console.log('\n🎉 Database cleaning completed!');
        console.log('Your MongoDB is now ready for fresh testing.');
        
    } catch (error) {
        console.error('❌ Failed to clean MongoDB:');
        console.error('Error:', error.message);
    } finally {
        // Close the connection
        await mongoose.disconnect();
        console.log('\n🔌 Connection closed.');
    }
}

// Run the cleaning
cleanDatabase(); 