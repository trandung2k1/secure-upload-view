const { MongoClient, ServerApiVersion } = require('mongodb');

let databaseInstance = null;
const client = new MongoClient(process.env.MONGODB_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

const connectDB = async () => {
    await client.connect();
    databaseInstance = client.db('secure-upload');
};
const getDatabaseInstance = () => {
    if (!databaseInstance) throw new Error('Must connect to database firts!');
    return databaseInstance;
};
const closeDB = async () => {
    console.log('Close MongoDB');
    await client.close();
    databaseInstance = null;
};

module.exports = { getDatabaseInstance, connectDB, closeDB };
