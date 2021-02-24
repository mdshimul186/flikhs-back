const express = require('express')
const route = express.Router()
const { usersignin } = require('../middleware/auth.middleware')
const Blog = require('../model/blog.model')

const Article = require('../model/article.model')
const blogCategory = require('../model/blogCategory.model')
const cloudinary = require('cloudinary').v2;
const multer = require('multer')
const { v4: uuidv4 } = require('uuid');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const shortid = require('shortid')
const slugify = require('slugify')

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {},
});

var upload = multer({ storage: storage })


//---------------------------------------------------------------------------------------------------------------
route.get("/trendingblog", (req, res) => {

    // Article.aggregate([
    //     {
    //         $group:{
    //             _id:"$blog",
               
    //         }
    //     },
    //     { "$limit": 4 }
    // ],
    //   function (err, result) {
    //     //res.status(200).json({ blogs: result })

    //     let finalblogs =[]
    //     console.log(result);

    //     result.map(blog=>{
    //         if(blog._id === null) return
    //         Blog.findById(blog._id)
    //         .then(data=>{
    //             console.log(data);
    //             finalblogs = [...finalblogs,data]
    //         })
            
    //     })
    //     res.status(200).json({blogs:finalblogs})
        
    //   }
    //)
  
    // Group.find({})
    // .sort({'members.$size':1})
    // .limit(5)
    // .then(groups=>{
    //   res.status(200).json({groups})
    // })




    Blog.aggregate(
        [ 
            { $sample: { size: 3 } } ,
            {$project:{_id:1,name:1,slug:1,blogImage:1}}
        ],
        function (err, result){
            res.status(200).json({blog:result})
        }
     )
  })

//---------------------------------------------------------------------------------------------------------------
route.post("/create", usersignin, (req, res) => {
    const { name, description } = req.body

    if (!name) {
        return res.status(400).json({ error: "Blog name is required" })
    }

    let _blog = new Blog({
        creator: req.user._id,
        name,
        description: description || '',
        slug: slugify(name + "-" + shortid.generate()),

    })

    _blog.save()
        .then(blog => {
            res.status(201).json({ sucess: true, blog })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

//---------------------------------------------------------------------------------------------------------------
route.get('/myblog', usersignin, (req, res) => {

    Blog.find({ creator: req.user._id })
        .then(blog => {
            res.status(200).json({ sucess: true, blog })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

//---------------------------------------------------------------------------------------------------------------
route.get('/single/:slug', (req, res) => {

    let category = req.query.category
    let subCategory = req.query.subcategory
    // console.log(category)
    // console.log(req.params.slug)

    const fetch = (cat) => {
        Blog.findOne({ slug: req.params.slug })
            .then(blog => {
                Article.find({ $and: [{ blog: blog._id, isApproved: true }, cat] })
                    .populate("category", "name slug _id")
                    .sort("-createdAt")
                    .limit(8)
                    .then(article => {
                        Article.find({ $and: [{ blog: blog._id, isApproved: true }, cat] })
                            .populate("category", "name slug _id")
                            .populate("creator", "first last _id email username profileimg")
                            .sort("-views")
                            .limit(8)
                            .then(popular => {
                                res.status(200).json({ sucess: true, blog, article, popular })
                            })
                    })
            })
            .catch(err => {
                res.status(400).json({ error: "something went wrong" })
            })
    }

    if (category) {
        blogCategory.findOne({ slug: category })
            .then(cat => {
                // console.log(cat)
                fetch({ category: cat._id })
            })

    } else if(subCategory){
        blogCategory.findOne({ slug: subCategory })
            .then(cat => {
                // console.log(cat)
                fetch({ subCategory: cat._id })
            })
    }
    else {
        fetch({})
    }
})

//---------------------------------------------------------------------------------------------------------------
route.get('/allblogs', (req, res) => {
    Blog.find()
        .populate('creator', 'first last')
        .then(blog => {
            res.status(200).json({ sucess: true, blog })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

//---------------------------------------------------------------------------------------------------------------
route.put('/blogimg/:slug', usersignin, upload.single('blogimg'), (req, res) => {
    const file = req.file
    Blog.findOneAndUpdate({ creator: req.user._id, slug: req.params.slug }, { $set: { blogImage: file.path } }, { new: true })
        .then(blog => {

            res.status(200).json({ blog })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

//---------------------------------------------------------------------------------------------------------------
route.put('/edit/:slug', usersignin, (req, res) => {
    let { name, slug, description,showCategory } = req.body
    let option = { name, slug, description,showCategory}


    Blog.findOneAndUpdate({ creator: req.user._id, slug: req.params.slug }, { $set: option }, { new: true })
        .then(blog => {
            if (!blog) {
                return res.status(404).json({ error: "something went wrong or slug already taken" })
            }
            res.status(200).json({ blog })

        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

module.exports = route