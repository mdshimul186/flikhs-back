const express = require('express')
const route = express.Router()
const { usersignin } = require('../middleware/auth.middleware')
const Post = require('../model/post.model')
const Group = require('../model/group.model')
const User = require('../model/auth.model')
const Comment = require('../model/comment.model')
const cloudinary = require('cloudinary').v2;
const multer = require('multer')
const { v4: uuidv4 } = require('uuid');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
var validate = require('url-validator')
const ogs = require('open-graph-scraper');
var ObjectId = require('mongoose').Types.ObjectId
const slugify= require('slugify')
const shortId = require('shortid')

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        //folder: 'fbpost',
        //format: async (req, file) => 'png', // supports promises as well
        //public_id: (req, file) =>uuidv4()+"-"+file.originalname,
    },
});

var upload = multer({ storage: storage })


//---------------------------------------------------------------------------------------------------------------
route.get('/mypost', usersignin, (req, res) => {
    Post.find({ user: req.user._id, "group.status": false })
        .sort("-date")
        .populate('user', 'first last _id profileimg username')
        .populate('sharedPost', '_id slug')
        .populate('group.name', 'name slug')
        .populate({
            path: "comment",
            populate: {
                path: "commentedby",
                model: "User",
                select: "_id first last email"
            }
        })
        .then(post => {
            res.status(200).json({ post, id: req.user._id })
        })
})

//---------------------------------------------------------------------------------------------------------------   
route.post('/general/create', usersignin, (req, res) => {
    const { post, title } = req.body
    if (!title) {
        return res.status(400).json({ error: "Title is required" })
    }

    let newpost = new Post({
        title,
        slug:slugify(title)+"-"+shortId.generate(),
        post: post || '',
        user: req.user._id,
    })

    newpost.save()
    Post.populate(newpost, { path: "user", select: "first last _id profileimg" })
        .then(post => {
            res.status(200).json({ post })
            
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})
//---------------------------------------------------------------------------------------------------------------   
route.post('/image/create', usersignin, upload.array('postimg'), (req, res) => {
    const { title } = req.body
    if (!title) {
        return res.status(400).json({ error: "Title is required" })
    }

    let imagearray = []
    req.files.map(file => {
        imagearray.push(file.path)
    })
    let newpost = new Post({
        title,
        slug:slugify(title)+"-"+shortId.generate(),
        user: req.user._id,
        image: imagearray,
        posttype: 'picture'
    })

    newpost.save()
    Post.populate(newpost, { path: "user", select: "first last _id profileimg" })
        .then(post => {
            res.status(200).json({ post })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})
//---------------------------------------------------------------------------------------------------------------   
route.post('/link/create', usersignin, (req, res) => {
    const { title, url } = req.body
    if (!url) {
        return res.status(400).json({ error: "Url is required" })
    }

    var urlValid = validate(url)

    if (urlValid) {

        let newpost = new Post({
            title:title||'',
            slug:slugify(title)+"-"+shortId.generate(),
            user: req.user._id,
            link: { status: true, name: url },
            posttype: 'link'
        })
        newpost.save()
        Post.populate(newpost, { path: "user", select: "first last _id profileimg" })
            .then(post => {
                res.status(200).json({ post })
            })
            .catch(err => {
                res.status(400).json({ error: "something went wrong" })
            })

    } else {
        return res.status(400).json({ error: 'Invalid url, try http://www.example.com' })
    }



})

//---------------------------------------------------------------------------------------------------------------
route.post('/:groupid/general/create', usersignin, (req, res) => {
    const { post, category,title } = req.body
    let imagearray = []
    // req.files.map(file=>{
    //     imagearray.push(file.path)
    // })
    let newpost = new Post({
        title,
        slug:slugify(title)+"-"+shortId.generate(),
        post,
        user: req.user._id,
        image: imagearray,
        group: { status: true, name: req.params.groupid, category: category }
    })


    Group.findOne({ _id: req.params.groupid })
        .then(group => {
            if (!group) {
                return res.status(404).json({ error: "Something went wrong" })
            }
            if (group.members.includes(req.user._id)) {
                newpost.save()
                Post.populate(newpost, { path: "user", select: "first last _id profileimg" })
                    .then(post => {
                        res.status(200).json({ post })
                    })
                    .catch(err => {
                        res.status(400).json({ error: "something went wrong" })
                    })
            } else {
                return res.status(404).json({ error: "Not allowed" })
            }
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

//---------------------------------------------------------------------------------------------------------------
route.post('/:groupid/link/create', usersignin, (req, res) => {
    const { title, link } = req.body

    var url = validate(link)

    if (url) {

        Group.findOne({ _id: req.params.groupid })
            .then(group => {

                if (!group) {
                    return res.status(404).json({ error: "Something went wrong" })
                }
                if (!group.members.includes(req.user._id)) {
                    return res.status(404).json({ error: "Not allowed" })
                }


                let approvedlink = group.approvedlink
                let blockedlink = group.blockedlink

                let match = (str, expr) => {
                    let fullExp = new RegExp(expr
                        .map(x => x.replace("www.", ""))
                        .join("|")

                    )
                    return str.match(fullExp)
                }


                if (approvedlink.length > 0) {
                    if (match(url, approvedlink)) {
                        let newpost = new Post({
                            title,
                            slug:slugify(title)+"-"+shortId.generate(),
                            user: req.user._id,
                            link: { status: true, name: link },
                            group: { status: true, name: req.params.groupid, category: '' },
                            posttype: 'link'
                        })

                        newpost.save()
                        Post.populate(newpost, { path: "user", select: "first last _id profileimg" })
                            .then(post => {
                                res.status(200).json({ post })
                            })
                            .catch(err => {
                                res.status(400).json({ error: "something went wrong" })
                            })
                    } else {
                        return res.status(400).json({ error: 'Url blocked, try another' })

                    }
                } else {
                    if (match(url, blockedlink) === null || (match(url, blockedlink)[0] === '')) {
                        let newpost = new Post({
                            title,
                            user: req.user._id,
                            link: { status: true, name: link },
                            group: { status: true, name: req.params.groupid, category: '' },
                            posttype: 'link'
                        })

                        newpost.save()
                        Post.populate(newpost, { path: "user", select: "first last _id profileimg" })
                            .then(post => {
                                res.status(200).json({ post })
                            })
                            .catch(err => {
                                res.status(400).json({ error: "something went wrong" })
                            })
                    } else {
                        return res.status(400).json({ error: 'Url blocked, try another' })

                    }
                }


            })
            .catch(err => {
                res.status(400).json({ error: "something went wrong" })
            })

    } else {
        return res.status(400).json({ error: 'Invalid url, try http://www.example.com' })
    }

})


//---------------------------------------------------------------------------------------------------------------
route.post('/:groupid/picture/create', usersignin, upload.array('postimg'), (req, res) => {
    const { title } = req.body
    let imagearray = []
    req.files.map(file => {
        imagearray.push(file.path)
    })
    let newpost = new Post({
        title,
        slug:slugify(title)+"-"+shortId.generate(),
        user: req.user._id,
        image: imagearray,
        group: { status: true, name: req.params.groupid, category: '' },
        posttype: 'picture'
    })


    Group.findOne({ _id: req.params.groupid })
        .then(group => {

            if (!group) {
                return res.status(404).json({ error: "Something went wrong" })
            }
            if (group.members.includes(req.user._id)) {
                newpost.save()
                Post.populate(newpost, { path: "user", select: "first last _id profileimg username" })
                    .then(post => {
                        res.status(200).json({ post })
                    })
                    .catch(err => {
                        res.status(400).json({ error: "something went wrong" })
                    })
            } else {

                return res.status(404).json({ error: "Not allowed" })
            }
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })

})




//---------------------------------------------------------------------------------------------------------------
route.get('/get', (req, res) => {
    let options =[]
    if (req.query.query != 'undefined') {
        var regex = new RegExp(req.query.query, "i")
        options =[{'title': regex},{'post':regex}]
        
    }
    const pageOptions = {
        page: parseInt(req.query.page, 10) || 0,
        limit: parseInt(req.query.limit, 10) || 15
    }

    Post.find(options.length >0 ? {$or:options}:{})
        .sort("-date")
        .populate('user', 'first last _id profileimg username isSuspended')
        .populate('sharedPost', '_id slug')
        .populate('group.name')
        .skip(pageOptions.page * pageOptions.limit)
        .limit(pageOptions.limit)
        .populate({
            path: "comment",
            populate: {
                path: "commentedby",
                model: "User",
                select: "_id first last email profileimg"
            }
        })
        .then(post => {
            res.status(200).json({ post })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

//---------------------------------------------------------------------------------------------------------------
route.get('/singlepost/:postslug', (req, res) => {

    // if (ObjectId.isValid(req.params.postid) === false) {
    //     return res.status(404).json({ error: true })
    // }
    //console.log(req.params.postidorslug);
    Post.findOne({slug:req.params.postslug})
        .sort("-date")
        .populate('user', 'first last _id profileimg username isSuspended')
        .populate('group.name')
        .populate('sharedPost', '_id slug')
        .populate({
            path: "comment",
            populate: {
                path: "commentedby",
                model: "User",
                select: "_id first last email profileimg"
            }
        })
        .then(post => {
            if (!post) {
                return res.status(404).json({ error: true })
            }
            res.status(200).json({ post })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})


//---------------------------------------------------------------------------------------------------------------
route.get('/grouppost/:groupid', (req, res) => {

    let query = {
        "group.status": true,
        "group.name": req.params.groupid
    }
    if (req.query.category == 'All') {
        query = { ...query }
    } else if (req.query.category) {
        query["group.category"] = req.query.category
    }

    Post.find(query)
        .sort("-date")
        .populate('user', 'first last _id profileimg username')
        .populate('group.name', 'name slug')
        .populate({
            path: "comment",
            populate: {
                path: "commentedby",
                model: "User",
                select: "_id first last email profileimg"
            }
        })
        .then(post => {
            res.status(200).json({ post })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

// route.get('/mypost',usersignin,(req, res)=>{
//     Post.find({_id:req.user._id})
//     .then(post=>{
//         res.status(200).json({post})
//     })
// })

//---------------------------------------------------------------------------------------------------------------
route.put('/:react/:id', usersignin, (req, res) => {
    if (req.params.react === 'like') {
        Post.findById(req.params.id)
            .then(post => {
                let array = post.like
                let confirm = array.includes(req.user._id)
                if (confirm) {
                    return res.status(400).json({ error: "user already liked" })
                } else {
                    Post.findOneAndUpdate({ _id: req.params.id }, { $push: { like: req.user._id } }, { new: true })
                        .populate('group.name', "name slug")
                        .populate('user', '_id first last username profileimg')
                        .then(post => {
                            res.status(200).json({ post })
                        })
                }
            })
    } else if (req.params.react === 'unlike') {
        Post.findById(req.params.id)
            .then(post => {
                let array = post.like
                let confirm = array.includes(req.user._id)
                if (confirm) {
                    Post.findOneAndUpdate({ _id: req.params.id }, { $pull: { like: req.user._id } }, { new: true })
                        .populate('group.name', "name slug")
                        .populate('user', '_id first last username profileimg')
                        .then(post => {
                            res.status(200).json({ post })
                        })

                } else {
                    return res.status(400).json({ error: "You did't liked it" })
                }
            })
    }
})

//---------------------------------------------------------------------------------------------------------------
route.patch('/delete/:postid', usersignin, (req, res) => {
    Post.findById(req.params.postid)
        .populate('user', "_id")
        .then(post => {
            if (post.user._id == req.user._id) {
                let commentarray = post.comment
                Comment.deleteMany({ _id: { $in: commentarray } })
                    .then(data => {
                        Post.findByIdAndDelete(req.params.postid)
                            .then(postdelete => {
                                if (post.image.length > 0) {
                                    let ids = []
                                    post.image.map(img => {
                                        let id = img.split('/').pop()
                                        ids.push((id.split('.')[0]));
                                    })
                                    cloudinary.api.delete_resources(ids, function (error, result) {
                                        res.status(200).json({ success: true })
                                    });
                                } else if (post.image.length == 0) {
                                    res.status(200).json({ success: true })
                                }


                            })
                    })
            } else {
                res.status(400).json({ error: "not authorized" })
            }

        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

//---------------------------------------------------------------------------------------------------------------
route.get('/userprofile/:usernameorid', (req, res) => {
    //console.log(new ObjectId(req.params.usernameorid));
    User.findOne({ username: req.params.usernameorid })
        .select('-password')
        .then(u => {
            if (!u) {
                return res.status(404).json({ error: "Profile not found" })
            }
            Post.find({ user: u._id, "group.status": false })
                .sort("-date")
                .populate('user', '-password')
                .populate('group.name', 'name slug')
                .populate({
                    path: "comment",
                    populate: {
                        path: "commentedby",
                        model: "User",
                        select: "_id first last email profileimg"
                    }
                })
                .then(post => {
                    res.status(200).json({ user: u, post })
                })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

//---------------------------------------------------------------------------------------------------------------------------------------

route.post("/getmeta", (req, res) => {

    const options = { url: req.body.url };
    ogs(options)
        .then((data) => {
            const { error, result, response } = data;
            if (error) {
                return res.status(400).json({ error: "something went wrong" })
            }
            res.status(200).json({ result })
        })
})
//---------------------------------------------------------------------------------------------------------------------------------------

route.post("/sharepost",usersignin, (req, res) => {

    const {postId} = req.body
    if (ObjectId.isValid(postId) === false) {
        return res.status(404).json({ error: 'invalid post' })
    }

    let newpost = new Post({
        slug:shortId.generate(),
        activity:"Shared a post",
        posttype:"share",
        sharedPost:postId,
        user:req.user._id
    })
    
    newpost.save()
    Post.populate(newpost, { path: "user", select: "first last _id profileimg" })
        .then(post => {
            res.status(200).json({ post })
        })
        .catch(err => {
            res.status(400).json({ error: "something went wrong" })
        })
})

module.exports = route