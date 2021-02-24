const express = require('express')
const route = express.Router()
const { usersignin, admin } = require('../middleware/auth.middleware')
const slugify = require('slugify')

const { v4: uuidv4 } = require('uuid');

const blogCategory = require('../model/blogCategory.model');




const createCatList = (categories, parentId = null) => {
    const categoryList = []
    let category
    if (parentId == null) {
        category = categories.filter(cat => cat.parentId == undefined)
    } else {
        category = categories.filter(cat => cat.parentId == parentId)
    }
    for (let cate of category) {
        categoryList.push({
            _id: cate._id,
            name: cate.name,
            slug: cate.slug,
            creator: cate.creator,
            isApproved: cate.isApproved,
            children: createCatList(categories, cate._id)
        })
    }
    return categoryList
}

//---------------------------------------------------------------------------------------------------------------
route.post("/create", usersignin, admin, (req, res) => {
    const { name, parentId } = req.body
    if (!name) {
        return res.status(400).json({ error: "Category name is required" })
    }
    let obj = {
        name,
        slug: slugify(name),
        creator: req.user._id
    }
    if (parentId) {
        obj.parentId = parentId
    }
    let _category = new blogCategory(obj)

    _category.save()
        .then(category => {
            res.status(201).json({
                success: true,
                blogCategory: category
            })
        })
        .catch(err => {
            res.status(400).json({ error: "Something went wrong" })
        })
})




//---------------------------------------------------------------------------------------------------------------
route.post("/edit/:categoryid", usersignin, admin, (req, res) => {
    const { name } = req.body
    let categoryId = req.params.categoryid
    if (!name || !categoryId) {
        res.status(400).json({ error: "id and name is required" })
    }

    blogCategory.findByIdAndUpdate(categoryId, { $set: { name: name } }, { new: true })
        .then(category => {
            res.status(200).json({
                success: true,
                blogCategory: category
            })
        })
        .catch(err => {
            res.status(400).json({ error: "Something went wrong" })
        })
})

//---------------------------------------------------------------------------------------------------------------
route.delete('/delete/:categoryid', usersignin, admin, (req, res) => {
    let categoryId = req.params.categoryid
    if (!categoryId) {
        res.status(400).json({ error: "id is required" })
    }

    blogCategory.findByIdAndDelete(categoryId)
        .then(category => {
            res.status(200).json({
                success: true,
            })
        })
        .catch(err => {
            res.status(400).json({ error: "Something went wrong" })
        })
})

//---------------------------------------------------------------------------------------------------------------
route.get('/getcategory', (req, res) => {
    blogCategory.find()
        .sort("name")
        .then(category => {
            const categoryList = createCatList(category)
            res.status(200).json({
                success: true,
                blogCategory: categoryList
            })
        })
        .catch(err => {
            res.status(400).json({ error: "Something went wrong" })
        })
})

module.exports = route