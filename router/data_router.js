var express = require('express')
var data_router = express.Router()

var Sensor = require('../model/sensor_schema')
var Data = require('../model/data_schema')
var jwt = require('jsonwebtoken')
var midleware = require('../midleWare')
var {makeid} = require('../generate_apiKey')

data_router.get('/sendData', async (req, res) => {
  /* 	#swagger.tags = ['Data']
    #swagger.description = 'Endpoint to save data from device' */
    try {
      const API = req.query.API;
      const data = req.query.data;
      const time = req.query.time;
  
      // Kiểm tra xem cảm biến có tồn tại không
      const sensor = await Sensor.findOne({ API });
  
      if (!sensor) {
        res.status(404).json({ error: 'cảm biến không tồn tại.' });
        return;
      }
      console.log(data)
      // Lưu dữ liệu từ cảm biến
      const sensorData = new Data({
        API,
        data:[
          {
            data:data,
            time:time
          }],
        last_time,
        isProcess: false
      });
  
      // Lưu dữ liệu từ cảm biến vào cơ sở dữ liệu
      await sensorData.save();
  
      res.status(201).json({ message: 'Dữ liệu từ cảm biến đã được lưu.' });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi khi lưu dữ liệu từ cảm biến.' });
    }
  });




  module.exports = data_router