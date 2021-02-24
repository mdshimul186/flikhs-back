const mongoose = require('mongoose')

const articleSchema = new mongoose.Schema({
  creator:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"User"
  },
  blog:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Blog"
  },
  category:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"blogCategory"
  },
  subCategory:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"blogCategory"
  },
  title:{
      type:String,
      required:true,
      trim:true
  },
  description:{
      type:String,
      required:true,
  },
  slug:{
      type:String,
      required:true,
      unique:true,
      trim:true,
      lowercase: true
  },
  body:{
      type:String,
      required:true,
  },
  thumbnail:{
      type:String,
      default:""
  },
  tags:[],
  relatedArticle:{
      article1:{type:String,default:""},
      article2:{type:String,default:""},
      article3:{type:String,default:""}
  },
  isApproved:{
    type:Boolean,
    default:false
  },
  views:{
      type:Number,
      default:0
  }

},{timestamps:true})

articleSchema.index({
    title:"text",
    description:"text",
    body:"text"
},{
    weights:{
        title:5,
        description:2,
        body:1
    }
})


const Article = mongoose.model('Article', articleSchema)
module.exports = Article