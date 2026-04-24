const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function exportDatabase() {
  const DB_URI = 'mongodb://localhost:27017/fixmateDB';
  const EXPORT_PATH = path.join(__dirname, '..', 'db_data', 'database_export.json');

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(DB_URI);
    console.log(`Connected to ${DB_URI}`);

    const collections = await mongoose.connection.db.listCollections().toArray();
    const result = {};

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`Exporting collection: ${collectionName}...`);
      
      const data = await mongoose.connection.db.collection(collectionName).find({}).toArray();
      result[collectionName] = data;
    }

    const exportDir = path.dirname(EXPORT_PATH);
    if (!fs.existsSync(exportDir)) {
      console.log(`Creating directory: ${exportDir}`);
      fs.mkdirSync(exportDir, { recursive: true });
    }

    fs.writeFileSync(EXPORT_PATH, JSON.stringify(result, null, 2));
    console.log(`Successfully exported data to ${EXPORT_PATH}`);
    
  } catch (error) {
    console.error('Error during export:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

exportDatabase();
