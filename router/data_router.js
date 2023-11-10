var express = require('express')
var data_router = express.Router()
var Sensor = require('../model/sensor_schema')
var Data = require('../model/data_schema')
var jwt = require('jsonwebtoken')
var midleware = require('../midleWare')


data_router.get('/sendData1', async (req, res) => {
  /* 	#swagger.tags = ['Data']
    #swagger.description = 'Endpoint to save data from device' */
    try {
      const { device_API, time, ...sensorData } = req.query;
      const data = Object.entries(sensorData).map(([sensor_API, data]) => ({ sensor_API, data, time }));
  
      // Kiểm tra xem cảm biến có tồn tại không
      const sensor = await Sensor.findOne({ sensor_API });
  
      if (!sensor) {
        res.status(404).json({ error: 'cảm biến không tồn tại.' });
        return;
      }
      console.log(data)
      // Lưu dữ liệu từ thiết bị 
      const newData = new Data({
        device_API,
        sensor_API: Object.keys(sensorData),
        data,
        last_time,
        isProcess: false
      });
  
      // Lưu dữ liệu từ cảm biến vào cơ sở dữ liệu
      await newData.save();
  
      res.status(201).json({ message: 'Dữ liệu từ cảm biến đã được lưu.' });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi khi lưu dữ liệu từ cảm biến.' });
    }
});


data_router.post('/sendData2', midleware.authenToken, async (req, res) => {
  /* 	#swagger.tags = ['Data']
      #swagger.description = 'Endpoint to save data from gateway' */
})


data_router.post('/getdata/:sensor_API', midleware.authenToken, async (req, res) => {
  /* 	#swagger.tags = ['Data']
      #swagger.description = 'Endpoint to get data by API device' */
      const Token = req.header('authorization')
    jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET,async (err,data)=>{
    try {
        const sensor_API = req.params.sensor_API;
        var data = await Data.findOne({sensor_API})
        console.log(data)
        res.json(data)
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lay data.' });
    }
    })
})


module.exports = data_router