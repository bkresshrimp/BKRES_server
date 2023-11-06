const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
    },
    hash_password:{
        type: String,
        require: true
    },
    gateway_count:{
        type: Number,
        default: 0
    },
    User_key:{
        type:String,       
    },
    account:{
        type: String,
        required: true
    },
    role: String,
    gateway:[{
        gateway_name: String,
        API: String,
        created:{
            type:Date,
            default: Date.now(),
        },
    }]
})
module.exports = mongoose.model('Users',userSchema)