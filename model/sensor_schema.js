const mongose = require("mongoose");
var sensor_schema = new mongose.Schema({
    device_API:{
        type: String,
        require: true
    },
    sensor_name:{
        type: String,
        require: true
    },
    sensor_API:{
        type: String,
        require: true
    },
    time:{ type: Date, default: Date.now },
    provider:{
        type: String,
        require: true
    },
    unit:{
        type: String,
        require: true
    },
    describe:{
        type:String,
        require: true,
    },
})

module.exports = mongose.model('sensor',sensor_schema)