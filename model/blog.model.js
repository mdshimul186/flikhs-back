const mongoose = require('mongoose')

const blogSchema = new mongoose.Schema({
  creator:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"User"
  },
  name:{
      type:String,
      required:true,
      trim:true
  },
  description:{
      type:String,
      default:""
  },
  slug:{
      type:String,
      required:true,
      unique:true,
      trim:true,
      lowercase: true
  },
  isActive:{
    type:Boolean,
    default:true
  },
  blogImage:{
      type:String,
      default:""
  },
  showCategory:{
      type:Boolean,
      default:true
  }

},{timestamps:true})


const Blog = mongoose.model('Blog', blogSchema)
module.exports = Blog