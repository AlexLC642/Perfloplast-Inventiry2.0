const { MongoClient } = require('mongodb');

async function main() {
    const uri = "mongodb+srv://alexestuardo642_db_user:aJAQr5Szf5nuBHMI@cluster0.ewhwqsh.mongodb.net/perflo-plast?retryWrites=true&w=majority&appName=Cluster0";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("Connected to MongoDB");
        const db = client.db('perflo-plast');
        const collections = await db.listCollections().toArray();
        
        console.log("\nCollections found:");
        for (let col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`- ${col.name} (${count} documents)`);
            
            if (count > 0) {
                const sample = await db.collection(col.name).findOne();
                console.log(`  Sample:`, JSON.stringify(sample, null, 2).substring(0, 500) + "...");
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

main();
