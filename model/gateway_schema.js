var mongoose = require('mongoose')
var gateway_schema = new mongoose.Schema({
    gateway_name:{
        type: String,
        required: true
    },
    gateway_API:{
        type:String,
        required: true
    },
    User_key:{
        type:String,       
    },
    location:[{
        lat: Number,
        lon: Number,   
    }],
    is_public:{
        type: Boolean,
        require: false,
        default: false
    },
    device:[{
        device_name: String,
        device_API:String,
        created:{
            type:Date,
            default: Date.now(),
        },
        location:[{
            lat: Number,
            lon: Number,   
        }],
    }]
})
module.exports = mongoose.model('gateways',gateway_schema)