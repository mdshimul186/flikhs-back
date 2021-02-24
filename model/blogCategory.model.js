const mongoose = require('mongoose')

const blogCategorySchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  parentId: {
    type: String
  },
  isApproved: {
    type: Boolean,
    default: true
  },

}, { timestamps: true })


const blogCategory = mongoose.model('blogCategory', blogCategorySchema)
module.exports = blogCategory