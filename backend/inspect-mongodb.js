import mongoose from 'mongoose';

// MongoDB connection URI
const uri = "mongodb+srv://zubin1:zubin1@zubin-foundation.x6uad3h.mongodb.net/?retryWrites=true&w=majority&appName=zubin-foundation";

async function inspectDatabase() {
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
        
        console.log('\n📊 All Databases:');
        databases.databases.forEach(dbInfo => {
            console.log(`  - ${dbInfo.name} (${(dbInfo.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
        });
        
        // For each database, list collections and document counts
        for (const dbInfo of databases.databases) {
            if (dbInfo.name !== 'admin' && dbInfo.name !== 'local') {
                console.log(`\n📁 Database: ${dbInfo.name}`);
                
                try {
                    const currentDb = mongoose.connection.client.db(dbInfo.name);
                    const collections = await currentDb.listCollections().toArray();
                    
                    if (collections.length === 0) {
                        console.log('  (No collections found)');
                    } else {
                        for (const collection of collections) {
                            const count = await currentDb.collection(collection.name).countDocuments();
                            console.log(`  - ${collection.name}: ${count} documents`);
                            
                            // Show first few documents if any exist
                            if (count > 0) {
                                const sampleDocs = await currentDb.collection(collection.name).find({}).limit(3).toArray();
                                console.log(`    Sample documents:`);
                                sampleDocs.forEach((doc, index) => {
                                    console.log(`      ${index + 1}. ${JSON.stringify(doc, null, 2)}`);
                                });
                                if (count > 3) {
                                    console.log(`      ... and ${count - 3} more documents`);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.log(`  Error accessing ${dbInfo.name}: ${error.message}`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Failed to inspect MongoDB:');
        console.error('Error:', error.message);
    } finally {
        // Close the connection
        await mongoose.disconnect();
        console.log('\n🔌 Connection closed.');
    }
}

// Run the inspection
inspectDatabase(); 