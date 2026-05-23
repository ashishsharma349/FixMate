const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

exports.connect = async () => {
  // If already connected, do nothing
  if (mongoose.connection.readyState !== 0) {
    return;
  }

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri);
};

exports.close = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

exports.clear = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};
