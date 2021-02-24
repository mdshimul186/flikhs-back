const express = require('express')
const route = express.Router()
const { usersignin } = require('../middleware/auth.middleware')
const Post = require('../model/post.model')
const Comment = require('../model/comment.model')
const cloudinary = require('cloudinary').v2;
const multer = require('multer')
const { v4: uuidv4 } = require('uuid');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

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
route.post('/create/:postid', upload.single('commentimg'), usersignin, (req, res) => {
  const { comment } = req.body
  const file = req.file
  let paths = ''
  if (req.file) {
    paths = file.path
  }
  let newcomment = new Comment({
    commentedby: req.user._id,
    body: comment,
    commentimage: paths
  })

  newcomment.save()
    .then(comment => {
      Post.findByIdAndUpdate(req.params.postid, { $push: { comment: comment._id } }, { new: true })
        .populate({
          path: "comment",
          populate: {
            path: "commentedby",
            model: "User",
            select: "_id first last email profileimg"
          }
        })
        .then(post => {
          res.status(200).json({ comment: post.comment })
        })
    })
})

//---------------------------------------------------------------------------------------------------------------
route.delete('/delete/:postid/:comentid', usersignin, (req, res) => {
  Comment.findById(req.params.comentid)
    .populate('commentedby', '_id')
    .then(com => {
      if (com.commentedby._id == req.user._id) {
        Comment.findByIdAndDelete(req.params.comentid)
          .then(comment => {
            Post.findByIdAndUpdate(req.params.postid, { $pull: { comment: req.params.comentid } }, { new: true })
              .populate({
                path: "comment",
                populate: {
                  path: "commentedby",
                  model: "User",
                  select: "_id first last email profileimg"
                }
              })
              .then(post => {
                res.status(200).json({ comment: post.comment })
              })
          })
      } else {
        res.status(400).json({ error: "not authorized" })
      }
    })

})



module.exports = route