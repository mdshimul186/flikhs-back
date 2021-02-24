const express = require('express')
const route = express.Router()
const { usersignin } = require('../middleware/auth.middleware')
const Blog = require('../model/blog.model')
const Article = require('../model/article.model')
const cloudinary = require('cloudinary').v2;
const multer = require('multer')
const { v4: uuidv4 } = require('uuid');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const shortid = require('shortid')
const slugify = require('slugify')
var ObjectId = require('mongoose').Types.ObjectId;
const blogCategory = require('../model/blogCategory.model');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {},
});

var upload = multer({ storage: storage })

//---------------------------------------------------------------------------------------------------------------
route.post("/create", usersignin, upload.single('thumbnail'), (req, res) => {
    const { title, category,subCategory, description, body, article1, article2, article3, blog, tags } = req.body

    const file = req.file

    if (!file) {
        return res.status(400).json({ error: "Thumbnail is required " })
    }

    if (!title) {
        return res.status(400).json({ error: "Title should be more then 10 words " })
    }
    if (!description) {
        return res.status(400).json({ error: "Description should be more then 32 words " })
    }
    if (!category) {
        return res.status(400).json({ error: "Category is required" })
    }
    if (!body) {
        return res.status(400).json({ error: "Article body is required" })
    }

    let obj ={
        creator: req.user._id,
        title,
        description,
        slug: slugify(title + "-" + shortid.generate(), {
            locale: "bn"
        }),
        relatedArticle: {
            article1: article1 || "",
            article2: article2 || "",
            article3: article3 || ""
        },
        body,
        thumbnail: file.path,
        category,
        blog: ObjectId.isValid(blog) ? blog : undefined,
        tags: tags ? tags.split(',') : []
    }

    if(subCategory){
        obj.subCategory = subCategory
    }

    let _article = new Article(obj)

    if (blog) {
        Blog.findById(blog.trim())
            .then(foundBlog => {
                if (foundBlog && foundBlog.creator != req.user._id) {
                    return res.status(400).json({ error: "You are not authorized" })
                }
                _article.save()
                Article.populate(_article, { path: "blog" })
                    .then(blog => {
                        res.status(201).json({ sucess: true, blog })
                    })
                    .catch(err => {
                        //console.log(err);
                        res.status(400).json({ error: "something went wrong" })
                    })
            })
            .catch(err => {
               // console.log(err);
                res.status(400).json({ error: "something went wrong" })
            })
    } else {
        _article.save()
            .then(blog => {
                res.status(201).json({ sucess: true, blog })
            })
            .catch(err => {
                //console.log(err);
                res.status(400).json({ error: "something went wrong" })
            })
    }
})

//---------------------------------------------------------------------------------------------------------------
route.get('/recentarticle', (req, res) => {
    let category = req.query.category
    let subCategory = req.query.subcategory

    const fetch = (cat) => {
        Article.find(cat)
            .populate("category", "name slug _id")
            .populate("subCategory", "name slug _id")
            .populate("creator", "first last _id email username profileimg")
            .sort("-createdAt")
            .limit(14)
            .then(article => {
                Article.find(cat)
                    .populate("category", "name slug _id")
                    .populate("subCategory", "name slug _id")
                    .populate("creator", "first last _id email username profileimg")
                    .sort("-views")
                    .limit(22)
                    .then(popular => {
                        res.status(200).json({ sucess: true, article, popular })
                    })

            })
            .catch(err => {
                res.status(400).json({ error: "something went wrong" })
            })
    }

    if (category) {
        blogCategory.findOne({ slug: category })
            .then(cat => {
                fetch({ category: cat._id, isApproved: true })
            })
    } else if(subCategory){
        blogCategory.findOne({ slug: subCategory })
        .then(cat => {
            fetch({ subCategory: cat._id, isApproved: true })
        })
    }
    else {
        fetch({ isApproved: true })
    }
})

//---------------------------------------------------------------------------------------------------------------
route.get('/single/:slug', (req, res) => {
    Article.findOne({ slug: req.params.slug, isApproved: true })
        .populate("category", "name slug _id")
        .populate("subCategory", "name slug _id")
        .populate("creator", "first last _id email username profileimg")
        .then(article => {
            if (!article) {
                return res.status(400).json({ error: "article not found" })
            }
            res.status(200).json({ sucess: true, article })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

// route.get('/allblogs', (req, res) => {
//     Blog.find()
//         .then(blog => {
//             res.status(200).json({ sucess: true, blog })
//         })
//         .catch(err => {
//             res.status(400).json({ error: "something went wrong" })
//         })
// })

//---------------------------------------------------------------------------------------------------------------
route.post("/articleimages", upload.single("articleimages"), (req, res) => {
    const file = req.file
    return res.status(200).json({ imgUrl: file.path })
})

route.patch('/updateview/:slug', (req, res) => {
    Article.findOneAndUpdate({ slug: req.params.slug }, { $inc: { views: 1 } }, { new: true })
        .populate("category", "name slug _id")
        .populate("subCategory", "name slug _id")
        .populate("creator", "first last _id email username profileimg")
        .populate("blog")
        .then(article => {
            if (!article) {
                return res.status(400).json({ error: "article not found" })
            }
            res.status(200).json({ sucess: true, article })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

//---------------------------------------------------------------------------------------------------------------
route.post('/relatedarticles', (req, res) => {
    const { tags, _id } = req.body
    Article.find(
        { "tags": { $in: tags[0] !== '' ? tags : [] }, "_id": { $ne: ObjectId.isValid(_id) ? _id : undefined }, isApproved: true })
        .limit(3)
        .populate("category", "name slug _id")
        .populate("subCategory", "name slug _id")
        .populate("creator", "first last _id email username profileimg")
        .then((article) => {

            res.status(200).json({ sucess: true, article })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

//---------------------------------------------------------------------------------------------------------------
route.get("/search", (req, res) => {
    let query = {}
    let text = req.query.search || ''

    if (text.length) {
        query["$text"] = { $search: text }
    }

    Article.find(query)
        .populate("category", "name slug _id")
        .populate("subCategory", "name slug _id")
        .populate("creator", "first last _id email username profileimg")
        .populate("blog")
        .then(article => {
            res.status(200).json({ sucess: true, article })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

module.exports = route