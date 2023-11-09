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
        lat: String,
        lon: String,   
    }],
    is_public:{
        type: Boolean,
        require: false,
        default: false
    },
    device:[{
        device_name: String,
        API:String,
        created:{
            type:Date,
            default: Date.now(),
        },
    }]
})
module.exports = mongoose.model('gateways',gateway_schema)