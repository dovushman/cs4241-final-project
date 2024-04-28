require("dotenv").config();
const fs = require('fs');
const express = require("express"),
    app = express(),
    path = require('path'),
    mime = require("mime"),
    cookieParser = require('cookie-parser'),
    dir = "public/",
    potrace = require('potrace'),
    multer = require('multer'),
    GridFsStorage = require('multer-gridfs-storage'),
    Grid = require('gridfs-stream'),
    Jimp = require('jimp'),
    http = require('https'),
    FormData = require('form-data'),
    fetch = require('node-fetch'),
    port = 3000;

// Include Firebase Admin SDK and MongoDB
const admin = require('firebase-admin');
const serviceAccount = require('./sharpify-2c8fc-firebase-adminsdk-jkwtn-0a02d3268b.json');
const MongoClient = require('mongodb').MongoClient;

//will this commit now?

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "sharpify-2c8fc.appspot.com"
});

const bucket = admin.storage().bucket();
let client;

const uri = `mongodb+srv://dovushman:${process.env.PASSWORD}@cluster0.vpfjttx.mongodb.net/a3-dovUshman?retryWrites=true&w=majority&appName=Cluster0`;

// MongoClient.connect(uri, function(err, client) {
//   if (err) throw err;
//   console.log("Connected successfully to MongoDB server");
//   client = client;
// });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// const upload = multer({ dest: 'uploads/' });
const upload = multer();


app.use(express.static(path.join(__dirname, 'build')));

// const { MongoClient, ObjectId } = require('mongodb');

let db;
let users;
let images;

async function run() {
    try {
        const client = new MongoClient(uri);
        await client.connect();
        console.log("Connected to MongoDB!");

        db = client.db("finalProjectTempDatabase");
        console.log(`Connected to the database:${db.databaseName}`)

        users = db.collection("users");
        console.log(`Connected to the collection:${users.collectionName}`);

        // images = db.collection("images");

        images = db.collection("images");
        console.log(`Connected to the collection:${images.collectionName}`);

    } catch (error) {
        console.dir(error);
    }
}
run();

let namesArray = []

app.get("/", (request, response) => {
    response.sendFile(__dirname + "/public/logIn.html")
})

app.use(express.static("public"));

app.post('/submit', upload.single('image'), async (request, response) => {
    // Check if file was uploaded
    if (!request.file) {
        return response.status(400).json({ message: 'No file uploaded' });
    }

    // Create a new document with the image's filename and path
    const imageDocument = {
        filename: request.file.filename,
        path: request.file.path,
        uploadDate: new Date()
    };

    try {
        // Insert the document into the 'images' collection
        const result = await db.collection('images').insertOne(imageDocument);

        // Send a response with the inserted document's ID
        response.json({ message: 'File uploaded successfully', id: result.insertedId });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Error uploading file' });
    }
});

app.post("/signin", async (request, response) => {
    console.log("sign in post request received")
    const { email, password } = request.body;
    const user = await users.findOne({ email: email });
    if (user && user.password === password) {
        userId = user._id.toString();
        response.cookie('userId', userId);
        response.json({ status: 'success', user: user });
    }
    else {
        response.json({ status: 'error', message: 'Invalid username or password' });
    }
});

app.post("/register", async (request, response) => {
    console.log("register post request received")
    const { username, password, email } = request.body;
    const newUser = { username: username, password: password, email: email };
    await users.insertOne(newUser);
    const userData = await db.collection('userData').findOne({ userId: newUser._id });
    userId = newUser._id.toString();
    response.cookie('userId', userId);
    if (!userData) {
        response.json({ status: 'success', user: newUser, userData: userData });
    } else {
        response.json({ status: 'error', message: 'Account already exists' });
    }
});

const uuid = require('uuid');
let uploadedImage;

app.post("/upload", upload.single('image'), async (request, response) => {
    if (!request.file) {
        return response.status(400).json({ message: 'No file uploaded' });
    }

    const uniqueId = uuid.v4();
    const filename = `${uniqueId}_uploadedImage.jpg`;

    // Create a promise that resolves when the file is finished uploading
    const uploadPromise = new Promise((resolve, reject) => {
        const file = bucket.file(filename).createWriteStream();

        file.on('error', reject);
        file.on('finish', resolve);

        file.write(request.file.buffer);
        file.end();
    });

    try {
        // Wait for the file to finish uploading
        await uploadPromise;

        console.log(`${filename} uploaded to Firebase Storage.`);

        const url = `https://storage.googleapis.com/${bucket.name}/${filename}`;

        const imageDocument = {
            filename: request.file.originalname,
            path: url,
            url: url, 
            uploadDate: new Date(),
            userId: request.cookies.userId 
        };

        const result = await images.insertOne(imageDocument);
    
        response.json({ message: 'File uploaded successfully', id: result.insertedId });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Error uploading file' });
    }
});


app.post("/enhance", async (request, response) => {
    //FOR A NEW ENHANCE BUTTON
        if(uploadedImage === undefined) {
    } else{
        //
             const form = new FormData();
        form.append("upscale_factor", "x2");
        form.append("image_url","https://picsart.io/wp-content/uploads/2024/02/97ff2ec7-2f17-44a9-86a6-20d19db6ecd8.jpg");
    
        const options = {
          method: 'POST',
          host: 'api.picsart.io',
          path: '/tools/1.0/upscale',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${form._boundary}`,
            'accept': 'application/json',
            'x-picsart-api-key': process.env.API_KEY
          }
        };
    
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            console.log(data);
            response.send(data);
          });
        });   
    }});


    const { ObjectId } = require('mongodb');

app.get('/retrieveImages', async (request, response) => {
    const userId = request.cookies.userId;

    const userImages = await images.find({ userId: userId }).toArray();
    response.set('Access-Control-Allow-Origin', '*');


    response.json(userImages);
});


const {Storage} = require('@google-cloud/storage');
const storage = new Storage();


// app.get('/getImage/:imageId', async (request, response) => {
//     const imageId = request.params.imageId;

//     const bucket = storage.bucket('sharpify-2c8fc.appspot.com');
//     const file = bucket.file(imageId);

//     const readStream = file.createReadStream();

//     readStream.on('error', (err) => {
//         response.status(500).send(err);
//     });

//     response.set('Content-Type', 'image/jpeg');

//     readStream.pipe(response);
// });
app.get('/getImage/:imageId', async (req, res) => {
    const { imageId } = req.params;

    // Fetch the image document from MongoDB using the imageId
    const imageDoc = await images.findOne({ _id: new ObjectId(imageId) });

    if (!imageDoc) {
        res.status(404).send('Image not found');
        return;
    }

    // Send the Firebase URL as the response
    res.json({ url: imageDoc.url });
});



//get reqeust to retrieeve the image

// Delete Image

// app.delete("/delete", async (request, response) => {
//     const {username, password} = request.body;

//     console.log("line 166 " + request.body.id)

//     const userData = await usersData.findOne({$and: [
//         { id: parseInt(request.body.id) },
//         { userId: request.cookies['userId'] }
//       ]});
//     console.log("line 174 " + JSON.stringify(userData, null, 2));
//     let objectId = userData._id

//     usersData.deleteOne({_id: objectId})


//     if (usersData.find({ _id: objectId }) === null) {
//         console.log("deleted")
//     }

//     console.log(namesArray)

//     response.writeHead(200, "OK", { "Content-Type": "application/json" })
//     response.end(JSON.stringify({ status: 'success', message: 'Delete' }))
// })

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// app.listen(process.env.PORT || port)
app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT || 3000}`);
});