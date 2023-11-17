const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
    gateway_API: {
        type: String,
        required: true,
    },
    device_API: {
        type: String,
        required: true,
    },
    sensor_API: {
        type: String,
        required: true,
    },
    data: {
        data: {
            type: Number,
            required: true,
        },
        time: {
            type: String,
            required: true,
        },
    },
    isProcess: {
        type: Boolean,
        required: true,
    },
});

module.exports = mongoose.model('Data', dataSchema);
