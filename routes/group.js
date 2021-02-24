const express = require('express')
const route = express.Router()
const { usersignin } = require('../middleware/auth.middleware')
const slugify = require('slugify')

const cloudinary = require('cloudinary').v2;
const multer = require('multer')
const { v4: uuidv4 } = require('uuid');
const shortid = require('shortid')

const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Group = require('../model/group.model');
const Post = require('../model/post.model');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    //folder: 'groups',
    //format: async (req, file) => 'png', // supports promises as well
    //public_id: (req, file) =>uuidv4()+"-"+file.originalname,
  },
});

var upload = multer({ storage: storage })


//---------------------------------------------------------------------------------------------------------------
route.get("/trendinggroup", (req, res) => {

  Group.aggregate([
    {
      "$project": {
        "name": 1,
        "slug": 1,
        "groupimg": 1,
        "members": 1,
        "length": { "$size": "$members" }
      }
    },
    { "$sort": { "length": -1 } },
    { "$limit": 3 }
  ],
    function (err, result) {
      res.status(200).json({ groups: result })
    }
  )

  // Group.find({})
  // .sort({'members.$size':1})
  // .limit(5)
  // .then(groups=>{
  //   res.status(200).json({groups})
  // })
})


//---------------------------------------------------------------------------------------------------------------
route.post('/create', usersignin, (req, res) => {
  const { name, description, privacy } = req.body
  let newGroup = new Group({
    name,
    description,
    privacy,
    slug: slugify(name + "-" + shortid.generate()),
    creator: req.user._id,
    members: [req.user._id]
  })
  newGroup.save()
    .then(group => {
      res.status(200).json({ success: true, group })
    })
    .catch(err => {
      res.status(400).json({ error: "something went wrong" })
    })
})

//---------------------------------------------------------------------------------------------------------------
route.get('/getall', (req, res) => {

  Group.find()
    .then(group => {
      res.status(200).json({ group })
    })
    .catch(err => {
      res.status(400).json({ error: "something went wrong" })
    })
})

//---------------------------------------------------------------------------------------------------------------
route.get('/joined', usersignin, (req, res) => {

  Group.find({ members: req.user._id })
    .then(group => {
      res.status(200).json({ group })
    })
    .catch(err => {
      res.status(400).json({ error: "something went wrong" })
    })
})

//---------------------------------------------------------------------------------------------------------------
route.get('/:groupslug', (req, res) => {
  Group.findOne({ slug: req.params.groupslug })
    .then(group => {
      if (!group) {
        return res.status(404).json({ error: "some thing went wrong" })
      }
      res.status(200).json({ group })
    })
    .catch(err => {
      res.status(400).json({ error: "something went wrong" })
    })
})

//---------------------------------------------------------------------------------------------------------------
route.put('/groupimg/:slug', usersignin, upload.single('groupimg'), (req, res) => {
  const file = req.file
  Group.findOneAndUpdate({ creator: req.user._id, slug: req.params.slug }, { $set: { groupimg: file.path } }, { new: true })
    .then(group => {
      // let newpost = new Post({
      //     post:'',user: user._id, image:user.profileimg,activity:'Updated profile photo'
      // })
      // newpost.save()
      // Post.populate(newpost,{path:"user",select:"_id first last email"})
      // .then(post=>{
      //     res.status(200).json({post,user:user})
      // })
      res.status(200).json({ group })
    })
    .catch(err => {
      res.status(400).json({ error: "something went wrong" })
    })
})


//---------------------------------------------------------------------------------------------------------------
route.put('/groupcover/:slug', usersignin, upload.single('groupcover'), (req, res) => {
  const file = req.file
  Group.findOneAndUpdate({ creator: req.user._id, slug: req.params.slug }, { $set: { groupcover: file.path } }, { new: true })
    .then(group => {
      // let newpost = new Post({
      //     post:'',user: user._id, image:user.coverimg,activity:'Updated cover photo'
      // })
      // newpost.save()
      // Post.populate(newpost,{path:"user",select:"_id first last email"})
      // .then(post=>{
      //     res.status(200).json({post,user:user})
      // })
      res.status(200).json({ group })
    })
    .catch(err => {
      res.status(400).json({ error: "something went wrong" })
    })
})

//---------------------------------------------------------------------------------------------------------------
route.put('/edit/:slug', usersignin, (req, res) => {
  let { name, slug, description, privacy, postpermission, memberapproval, postapproval, posttype, showcategory } = req.body
  let option = { name, slug, description, privacy, postpermission, memberapproval, postapproval, posttype, showcategory }

  Group.findOneAndUpdate({ creator: req.user._id, slug: req.params.slug }, { $set: option }, { new: true })
    .then(group => {
      if (!group) {
        return res.status(404).json({ error: "something went wrong" })
      }
      res.status(200).json({ group })


    })
    .catch(err => {
      res.status(400).json({ error: "something went wrong" })
    })
})

//---------------------------------------------------------------------------------------------------------------
route.put('/addrule/:slug', usersignin, (req, res) => {
  let { title, description } = req.body
  Group.findOneAndUpdate({ creator: req.user._id, slug: req.params.slug }, { $push: { rules: { title: title, description: description } } }, { new: true })
    .then(group => {
      if (!group) {
        return res.status(404).json({ error: "something went wrong" })
      }
      res.status(200).json({ rules: group.rules })
    })
    .catch(err => {
      res.status(400).json({ error: "something went wrong" })
    })
})

//---------------------------------------------------------------------------------------------------------------
route.patch('/deleterule/:slug', usersignin, (req, res) => {
  let { ruleid } = req.body
  Group.findOneAndUpdate({ creator: req.user._id, slug: req.params.slug }, { $pull: { rules: { _id: ruleid } } }, { new: true })
    .then(group => {
      if (!group) {
        return res.status(404).json({ error: "something went wrong" })
      }
      res.status(200).json({ rules: group.rules })
    })
    .catch(err => {
      res.status(400).json({ error: "something went wrong" })
    })

})

//---------------------------------------------------------------------------------------------------------------
route.patch('/editrule/:slug', usersignin, (req, res) => {
  let { title, description, ruleid } = req.body
  Group.findOneAndUpdate({ creator: req.user._id, slug: req.params.slug, "rules._id": ruleid }, { $set: { 'rules.$': { title, description } } }, { new: true })
    .then(group => {
      if (!group) {
        return res.status(404).json({ error: "something went wrong" })
      }
      res.status(200).json({ rules: group.rules })

    })
    .catch(err => {
      res.status(400).json({ error: "something went wrong" })
    })

})

//---------------------------------------------------------------------------------------------------------------
route.put('/addcategory/:slug', usersignin, (req, res) => {
  let { name } = req.body
  Group.findOneAndUpdate({ creator: req.user._id, slug: req.params.slug }, { $push: { category: name } }, { new: true })
    .then(group => {
      if (!group) {
        return res.status(404).json({ error: "something went wrong" })
      }
      res.status(200).json({ category: group.category })
    })
    .catch(err => {
      res.status(400).json({ error: "something went wrong" })
    })

})

//---------------------------------------------------------------------------------------------------------------
route.put('/deletecategory/:slug', usersignin, (req, res) => {
  let { name } = req.body
  Group.findOneAndUpdate({ creator: req.user._id, slug: req.params.slug }, { $pull: { category: name } }, { new: true })
    .then(group => {
      if (!group) {
        return res.status(404).json({ error: "something went wrong" })
      }
      res.status(200).json({ category: group.category })
    })
    .catch(err => {
      res.status(400).json({ error: "something went wrong" })
    })

})


//---------------------------------------------------------------------------------------------------------------
route.put('/addapprovedlink/:slug', usersignin, (req, res) => {
  let { name } = req.body
  Group.findOneAndUpdate({ creator: req.user._id, slug: req.params.slug }, { $push: { approvedlink: name } }, { new: true })
    .then(group => {
      if (!group) {
        return res.status(404).json({ error: "something went wrong" })
      }
      res.status(200).json({ approvedlink: group.approvedlink })
    })
    .catch(err => {
      res.status(400).json({ error: "something went wrong" })
    })

})

//---------------------------------------------------------------------------------------------------------------
route.put('/deleteapprovedlink/:slug', usersignin, (req, res) => {
  let { name } = req.body
  Group.findOneAndUpdate({ creator: req.user._id, slug: req.params.slug }, { $pull: { approvedlink: name } }, { new: true })
    .then(group => {
      if (!group) {
        return res.status(404).json({ error: "something went wrong" })
      }
      res.status(200).json({ approvedlink: group.approvedlink })
    })
    .catch(err => {
      res.status(400).json({ error: "something went wrong" })
    })

})


//---------------------------------------------------------------------------------------------------------------
route.put('/addblockedlink/:slug', usersignin, (req, res) => {
  let { name } = req.body
  Group.findOneAndUpdate({ creator: req.user._id, slug: req.params.slug }, { $push: { blockedlink: name } }, { new: true })
    .then(group => {
      if (!group) {
        return res.status(404).json({ error: "something went wrong" })
      }
      res.status(200).json({ blockedlink: group.blockedlink })
    })
    .catch(err => {
      res.status(400).json({ error: "something went wrong" })
    })

})

//---------------------------------------------------------------------------------------------------------------
route.put('/deleteblockedlink/:slug', usersignin, (req, res) => {
  let { name } = req.body
  Group.findOneAndUpdate({ creator: req.user._id, slug: req.params.slug }, { $pull: { blockedlink: name } }, { new: true })
    .then(group => {
      if (!group) {
        return res.status(404).json({ error: "something went wrong" })
      }
      res.status(200).json({ blockedlink: group.blockedlink })
    })
    .catch(err => {
      res.status(400).json({ error: "something went wrong" })
    })

})


//---------------------------------------------------------------------------------------------------------------
route.put('/join/:groupid', usersignin, (req, res) => {
  Group.findById(req.params.groupid)
    .then(g => {
      let members = g.members
      if (members.includes(req.user._id)) {
        return res.status(404).json({ error: "You already joined" })
      } else if (g.privacy === 'private') {
        return res.status(404).json({ error: "This is a private group" })
      } else {
        Group.findOneAndUpdate({ _id: g._id }, { $push: { members: req.user._id } }, { new: true })
          .then(group => {
            res.status(200).json({ group })
          })
      }
    })
    .catch(err => {
      res.status(400).json({ error: "something went wrong" })
    })
})

//---------------------------------------------------------------------------------------------------------------
route.put('/leave/:groupid', usersignin, (req, res) => {
  Group.findById(req.params.groupid)
    .then(g => {
      let members = g.members
      if (g.creator == req.user._id) {
        return res.status(404).json({ error: "Group creator can't leave" })
      } else if (members.includes(req.user._id)) {
        Group.findOneAndUpdate({ _id: g._id }, { $pull: { members: req.user._id } }, { new: true })
          .then(group => {
            res.status(200).json({ group })
          })

      } else {
        return res.status(404).json({ error: "You already joined" })

      }
    })
    .catch(err => {
      res.status(400).json({ error: "something went wrong" })
    })
})


//---------------------------------------------------------------------------------------------------------------
route.patch('/delete/:groupid', usersignin, (req, res) => {
  Group.findOne({ _id: req.params.groupid, creator: req.user._id })
    .then(group => {
      if (!group) {
        return res.status(404).json({ error: "Something went wrong" })
      }
      Post.find({ "group.status": true, "group.name": group._id })
        .then(post => {
          let allimagesid = []
          let postids = []
          post.map(p => {
            postids.push(p._id)
            p.image.map(img => {
              let id = img.split('/').pop()
              allimagesid.push((id.split('.')[0]));
            })

          })

          if (group.groupimg) {
            let id = group.groupimg.split('/').pop()
            allimagesid.push((id.split('.')[0]));

          }

          if (group.groupcover) {
            let id = group.groupcover.split('/').pop()
            allimagesid.push((id.split('.')[0]));

          }

          group.deleteOne()
            .then(gdelete => {
              Post.deleteMany({ _id: { $in: postids } })
                .then(pdelete => {
                  cloudinary.api.delete_resources(allimagesid, function (error, result) {

                    res.status(200).json({ success: true })
                  });
                })
            })

        })
    })
    .catch(err => {
      res.status(400).json({ error: "something went wrong" })
    })
})




module.exports = route