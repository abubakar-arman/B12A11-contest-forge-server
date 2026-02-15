const admin = require("firebase-admin");


// const fs = require('fs');
// // Read file as a buffer
// const fileBuffer = fs.readFileSync('config/contest-forge-firebase-adminsdk-pvt-key.json');
// // Convert buffer to base64 string
// const base64String = fileBuffer.toString('base64');
// console.log(base64String);

const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8');
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;