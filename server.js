const express = require('express')
const mongoose = require('mongoose')
const dotenv = require("dotenv");
dotenv.config();
const app = express()
const cors = require('cors')
app.use(cors())
const server = require('http').createServer(app)



const path = require('path')
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

app.use(express.json())

app.use(express.urlencoded({ extended: false }))

app.use('/user', require('./routes/auth'))
app.use('/post', require('./routes/post'))
app.use('/comment', require('./routes/comment'))
app.use('/group', require('./routes/group'))
app.use('/blogcategory', require('./routes/blogCategory'))
app.use('/blog', require('./routes/blog'))
app.use('/article', require('./routes/article'))
app.use('/admin', require('./routes/admin'))

app.get('/', (req, res) => {
    res.json({ message: "server is running..." })
})
mongoose.connect(process.env.DB_URL, { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true }, () => {
    console.log('DB connected');
})

// io.on('connection',(socket)=>{
//     console.log('user connected');

//     socket.on('disconnect',()=>{
//         console.log('user disconnected');
//     })
// })

server.listen(process.env.PORT || 5000, (req, res) => {
    console.log('server started');
})