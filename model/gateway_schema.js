var mongoose = require('mongoose')
var gateway_schema = new mongoose.Schema({
    gateway_name:{
        type: String,
        required: true
    },
    API:{
        type:String,
        required: true
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