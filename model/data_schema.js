const mongose = require("mongoose");
var data_schema = new mongose.Schema({
    API:{
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