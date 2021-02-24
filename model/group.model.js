const mongoose = require('mongoose')

const groupSchema = new mongoose.Schema({
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
  groupimg:{
      type:String,
      default:""
  },
  groupcover:{
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
  privacy:{
      type:String,
      default:'public'
  },
  postpermission:{
      type:Boolean,
      default:true
  },
  memberapproval:{
    type:Boolean,
    default:false
  },
  postapproval:{
    type:Boolean,
    default:false
  },
  posttype:{
      type:String,
      default:'general'
  },
  rules:[{
      title:{type:String},
      description:{type:String}
  }],
  approvedlink:[{
    type:String,
    trim:true
  }],
  blockedlink:[{
    type:String,
    trim:true
  }],
  category:[{
    type:String,
    trim:true
  }],
  showcategory:{
    type:Boolean,
    default:false
  },
  posts:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Post"
  }],
  members:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  }],
  active:{
    type:Boolean,
    default:true
  },

},{timestamps:true})


const Group = mongoose.model('Group', groupSchema)
module.exports = Group