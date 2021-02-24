const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
    title:{
        type: String,
        trim: true,
        default:""
    },
    slug:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase: true
    },
    post: {
        type: String,
        trim: true,
        default:""
    },
    activity:{
        type: String,
        trim: true,
    },
    posttype:{
        type:String,
        required:true,
        enum: ["general", "link","picture","share"],
        default:"general"
    },
    sharedPost:{
       type:mongoose.Schema.Types.ObjectId,
       ref:"Post",
    },
    group:{
        status:{type:Boolean,default:false},
        name:{ type:mongoose.Schema.Types.ObjectId,ref:"Group"},
        category:{type:String,default:""}       
    },
    link:{
        status:{type:Boolean,default:false},
        name:{ type:String,default:""}
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    image:[{type:String}] ,
    date:{
        type: Date,
        default: Date.now
    },
    like:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    comment:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Comment"
    }]

})

const Post = mongoose.model('Post', postSchema)
module.exports = Post