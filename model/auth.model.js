const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    first: {
        type: String,
        trim: true,
        required:true
    },
    last:{
        type: String,
        trim: true,
        required:true
    },
    email:{
        type:String,
        trim: true,
        unique: true,
        lowercase: true,
        required:true       
    },
    username:{
        type:String,
        trim: true,
        unique: true,
        lowercase: true,
        default:""
    },
    password:{
        type: String,
        required:true
    },
    gender:{
        type: String,
        default:""
    },
    address:{
        type: String,
        default:""
    },
    bio:{
        type: String,
        default:""
    },
    city:{
        type: String,
        default:""
    },
    state:{
        type: String,
        default:""
    },
    zipcode:{
        type: String,
        default:""
    },
    country:{
        type: String,
        default:""
    },
    dateofbirth:{
        dateandmonth:{date:{type:String,default:"1"},month:{type:String,default:"january"},privacy:{type:String,default:"public"}},
        birthyear:{year:{type:String,default:"1999"},privacy:{type:String,default:"public"}}
    },
    date:{
        type: Date,
        default: Date.now
    },
    profileimg:{
        type:String,
        default:''
    },
    coverimg:{
        type:String,
        default:""
    },
    friends:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    requests:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    pinnedgroups:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Group"
    }],
    pinnedblogs:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Blog"
    }],
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
      },
    isSuspended:{
        type:Boolean,
        default:false
    }

})


const User = mongoose.model('User', userSchema)
module.exports = User