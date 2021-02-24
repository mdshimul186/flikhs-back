const express = require('express')
const route = express.Router()
const User = require('../model/auth.model')
const Article = require('../model/article.model')
const { usersignin, admin } = require('../middleware/auth.middleware')
const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const slugify = require('slugify')
const shortId = require('shortid')
const Blog = require('../model/blog.model')

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {},
});

var upload = multer({ storage: storage })

//---------------------------------------------------------------------------------------------------------------
route.get('/allarticles', usersignin, admin, (req, res) => {

    Article.find()
        .populate("category", "name slug _id")
        .populate("subCategory", "name slug _id")
        .populate("creator", "first last _id email username profileimg")
        .populate("blog")
        .sort("-createdAt")
        .then(articles => {
            res.status(200).json({ success: true, articles })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

//---------------------------------------------------------------------------------------------------------------
route.patch('/editarticle/:articleid', usersignin, admin, upload.single('thumbnailedit'), (req, res) => {
    const { status, title, description, body, category,subCategory, tags } = req.body
    const file = req.file
    let articleId = req.params.articleid

    let options = {}

    if (file) {
        options.thumbnail = file.path
    }
    if (title != 'null') {
        options.title = title
        options.slug = slugify(title + "-" + shortId.generate())
    }
    if (description) {
        options.description = description
    }
    if (body) {
        options.body = body
    }
    if (tags) {
        options.tags = tags ? tags.split(',') : []
    }
    if (category) {
        options.category = category
    }
    if (subCategory) {
        options.subCategory = subCategory
    }
    if (!articleId) {
        return res.status(400).json({ error: "Article id is required" })
    }
    if (status) {
        if (status === 'approve') {
            options.isApproved = true
        } else {
            options.isApproved = false
        }
    }
    if (!title || !description || !category || !status) {
        return res.status(400).json({ error: "Article title,description,category,status is required" })
    }


    Article.findByIdAndUpdate(articleId, { $set: options }, { new: true })
        .populate("category", "name slug _id")
        .populate("subCategory", "name slug _id")
        .populate("creator", "first last _id email username profileimg")
        .populate("blog")
        .then(article => {
            res.status(200).json({ success: true, article })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

//---------------------------------------------------------------------------------------------------------------
route.delete('/deletearticle/:articleid', usersignin, admin, (req, res) => {

    let articleId = req.params.articleid
    Article.findByIdAndDelete(articleId)
        .then(article => {
            res.status(200).json({ success: true })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

//---------------------------------------------------------------------------------------------------------------
route.delete('/deleteblog/:blogid', usersignin, admin, (req, res) => {

    let blogId = req.params.blogid
    Blog.findByIdAndDelete(blogId)
        .then(article => {
            res.status(200).json({ success: true })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

//---------------------------------------------------------------------------------------------------------------
route.get('/users', usersignin, admin, (req, res) => {
    User.find()
        .sort('-date')
        .then(users => {
            res.status(200).json({ success: true, users })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

//---------------------------------------------------------------------------------------------------------------
route.patch('/updateuser/:userid', usersignin, admin, (req, res) => {
    let userId = req.params.userid
    User.findByIdAndUpdate(userId, { $set: { isSuspended: req.body.isSuspended } }, { new: true })
        .then(user => {
            res.status(200).json({ success: true, user })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

module.exports = route