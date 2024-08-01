const express = require('express');
const fs = require('fs');
const mongodb = require('mongodb');
const app = express();

const DatabaseURL = 'mongodb://localhost:27017'
const PORT = 4000;
const chunkSize = 10 **6;
const videoPath = '/home/xolo/Videos/Sahib_introduction.mp4' 
let videoSize = fs.statSync(videoPath).size;
let db;
let bucket;


app.get('/', (req, res) =>{
    res.sendFile(__dirname + '/Public/index.html');
});

app.get('/get-init',async (req,res)=>{
    try {
        const videoUploadStream = bucket.openUploadStream('myVideo');
        const videoReadStream = fs.createReadStream(videoPath);
        videoReadStream.pipe(videoUploadStream);
        res.status(200).send("Done...");        
    } catch (error) {
        res.send(500).send("internal server error");
    }
});

app.get('/getVideoFromDB',async (req,res)=>{
    try {
        let videoFileSize = db.collection('fs.files').findOne({
            'filename': 'myVideo'
        }).length;
        let range = req.headers.range;

        let startRange = parseInt(range.match(/(?<=bytes=)\d+/));
        let endRange = Math.min(videoSize-1,startRange+chunkSize);

        const headers = {
            'Content-Type': 'video/mp4',
            'Content-Range': `bytes ${startRange}-${endRange}/${videoSize}`,
            'Accept-Ranges': "bytes",
            'Content-Length': endRange - startRange + 1,
        }
        res.writeHead(206, headers);

        const videoDownloadStream = bucket.openDownloadStreamByName('myVideo',{
            start: startRange,
            end: endRange,
        });
        videoDownloadStream.pipe(res);
    } catch (error) {
        res.send(500).send("internal server error");
    }
});

app.get('/getVideoFromFileSystem',(req,res)=>{
    let range = req.headers.range;

    let startRange = parseInt(range.match(/(?<=bytes=)\d+/));
    let endRange = Math.min(videoSize-1,startRange+chunkSize);

    const headers = {
        'Content-Type': 'video/mp4',
        'Content-Range': `bytes ${startRange}-${endRange}/${videoSize}`,
        'Accept-Ranges': "bytes",
        'Content-Length': endRange - startRange + 1,
    }

    res.writeHead(206, headers);

    videoStream = fs.createReadStream(videoPath,{start:startRange,end:endRange});
    videoStream.pipe(res);
});


app.listen(PORT,async ()=>{
    console.log(`Server is running on port ${PORT}`);
    const mongoConnection = await mongodb.MongoClient.connect(DatabaseURL);
    db = mongoConnection.db('videos');
    bucket = new mongodb.GridFSBucket(db); 

});
