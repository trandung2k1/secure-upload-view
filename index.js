require('dotenv').config();
const express = require('express');
const port = process.env.PORT || 4000;
const fs = require('fs');
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;
const expressFormidable = require('express-formidable');
const { getDatabaseInstance, connectDB } = require('./config/db');
const { errorHandlingMiddleware, notFound } = require('./middlewares/errorHandlingMiddleware');

const startServer = () => {
    const app = express();
    app.use(expressFormidable());
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.set('view engine', 'ejs');
    app.get('/', function (req, res) {
        return res.render('index');
    });
    app.get('/list', async function (req, res) {
        const files = await getDatabaseInstance().collection('files').find({}).toArray();
        return res.render('list', {
            files: files,
        });
    });
    app.get('/image/:_id', async function (req, res) {
        const _id = req.params._id;
        const file = await await getDatabaseInstance()
            .collection('files')
            .findOne({
                _id: new ObjectId(_id),
            });

        if (file == null) {
            res.json({
                status: 'error',
                message: 'File not found.',
            });
            return;
        }
        const fileData = await fs.readFileSync(file.path);
        if (!fileData) {
            return res.json({
                data: fileData,
            });
        }
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': fileData.length,
        });
        return res.end(fileData);
    });
    app.post('/upload', async function (req, res) {
        const file = req.files.file;
        const index = file?.name?.lastIndexOf('.');
        const fileExtension = file?.name?.slice(index);

        const fileData = await fs.readFileSync(file.path);
        if (!fileData) {
            console.error(fileData);
            return;
        }

        const filePath = 'uploads/' + Date.now() + fileExtension;
        fs.writeFileSync(filePath, fileData);

        await getDatabaseInstance().collection('files').insertOne({
            path: filePath,
            name: file.name,
            size: file.size,
        });

        return res.send('File has been uploaded.');
    });
    app.use(notFound);
    app.use(errorHandlingMiddleware);
    app.listen(port, () => {
        console.log(`Server listening on http://localhost:${port}`);
    }).on('error', (e) => {
        console.log(e);
        process.exit(1);
    });
    process.on('SIGINT', async () => {
        console.log('You are performing a server shutdown!');
        console.log('Close connection MongoDB shutdown!');
        await client.close();
        process.exit(0);
    });
};
(async () => {
    try {
        console.log('Connected MongoDB successfully');
        await connectDB();
        startServer();
    } catch (error) {
        console.log('Connected MongoDB failed.');
        console.log(error);
        process.exit(1);
    }
})();
