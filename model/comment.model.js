const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
    body:{type:String},
    date:{
            type: Date,
            default: Date.now
        },
    commentimage:{type:String},
    commentedby:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

})


const Comment = mongoose.model('Comment', commentSchema)
module.exports = Comment