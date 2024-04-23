const mongose = require("mongoose")
var device_schema = new mongose.Schema({
    device_name:{
        type: String,
        require: true
    },
    device_API:{
        type: String,
        require: true
    },
    device_ip:{
        type: String,
        require: true
    },
    gateway_API:{
        type:String,
        required: true
    },
    location:[{
        lat: Number,
        lon: Number,   
    }],
    count:{
        type: Number,
        require: true,
        default: 0
    },
    mess_in_minute:{
        type: Number,
        require: false,
        default: 0
    },
    is_public:{
        type: Boolean,
        require: false,
        default: false
    },
    time_interval:{
        type: Number,
        require: false
    },
    last_data:{    
        type: String,
        require: true
    },
    sensor:[{
        sensor_name: String,
        sensor_API:String,
    }]
})
module.exports = mongose.model('device',device_schema)