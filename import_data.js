require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { MongoClient } = require('mongodb');
const { EJSON } = require('bson');

const dataDir = path.join(__dirname, 'DATA');
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/fixmateDB';

async function importFile(db, filePath, collectionName) {
    console.log(`Importing to collection: ${collectionName} from ${path.basename(filePath)}`);
    const collection = db.collection(collectionName);
    
    const content = fs.readFileSync(filePath, 'utf8').trim();
    if (!content) {
        console.log(`No documents found in ${collectionName}`);
        return;
    }

    let docs = [];
    try {
        if (content.startsWith('[')) {
            docs = EJSON.parse(content);
        } else {
            const arrayString = '[' + content.replace(/}\s*\{/g, '},{') + ']';
            docs = EJSON.parse(arrayString);
        }
    } catch (e) {
        console.error(`Error parsing file ${collectionName}:`, e);
        return;
    }
    
    if (docs.length > 0) {
        // Drop existing data to avoid primary key collisions
        await collection.deleteMany({});
        await collection.insertMany(docs);
        console.log(`Successfully imported ${docs.length} documents into ${collectionName}`);
    } else {
        console.log(`No documents found in ${collectionName}`);
    }
}

async function main() {
    console.log(`Connecting to ${uri}...`);
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();
        
        const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
        
        for (const file of files) {
            const ext = path.extname(file);
            const baseName = path.basename(file, ext);
            await importFile(db, path.join(dataDir, file), baseName);
        }
        
        console.log('All data imported successfully!');
    } catch (e) {
        console.error('Error during import:', e);
    } finally {
        await client.close();
    }
}

main();
