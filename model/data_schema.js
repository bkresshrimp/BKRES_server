const mongose = require("mongoose");
var data_schema = new mongose.Schema({
    device_API:{
        type: String,
        require: true
    },
    sensor_API:{
        type:String,
        required: true
    },
    last_time:{ type: Date, default: Date.now },
    data:[{
        data: String,
        time: String
    }],
    isProcess:{
        type:Boolean,
        require: true,
    },
})

module.exports = mongose.model('data',data_schema)