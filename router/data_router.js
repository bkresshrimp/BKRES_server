var express = require('express')
var data_router = express.Router()
var Gateway= require('../model/gateway_schema')
var Device= require('../model/device_schema')
var Sensor = require('../model/sensor_schema')
var Data = require('../model/data_schema')
var jwt = require('jsonwebtoken')
var midleware = require('../midleWare')


data_router.get('/sendData1', async (req, res) => {
  /* 	#swagger.tags = ['Data']
    #swagger.description = 'Endpoint to save data from device' */
    try {
      const { gateway_API, device_API, time, ...sensorData } = req.query;
      console.log(req.query)

      const gateway = await Gateway.findOne({ API: gateway_API });
      const device = await Device.findOne({ device_API });
      const sensors = await Sensor.find({ sensor_API: { $in: Object.keys(sensorData) } });

      if (!gateway) {
        res.status(404).json({ error: 'Gateway không tồn tại.' });
        return;
      }

      if (!device) {
        res.status(404).json({ error: 'Thiết bị không tồn tại.' });
        return;
      }

      if (sensors.length !== Object.keys(sensorData).length) {
        res.status(404).json({ error: 'Một hoặc nhiều cảm biến không tồn tại.' });
        return;
      }

      // Lưu dữ liệu từ mỗi cảm biến thành một document riêng
      const promises = Object.entries(sensorData).map(async ([sensor_API, data]) => {
        const newData = new Data({
          gateway_API: gateway_API,
          device_API,
          sensor_API,
          data: { data, time },
          isProcess: false
        });

        // Lưu document và bắt lỗi nếu có
        try {
          await newData.save();
        } catch (error) {
          console.error(`Lỗi khi lưu dữ liệu từ cảm biến: ${error.message}`);
        }
      });

      // Đợi tất cả các promise được giải quyết
      await Promise.all(promises);

      res.status(201).json({ message: 'Dữ liệu từ cảm biến đã được lưu.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Lỗi khi lưu dữ liệu từ cảm biến.' });
    }
});


data_router.post('/sendData2', async (req, res) => {
  /* 	#swagger.tags = ['Data']
    #swagger.description = 'Endpoint to save data from multiple devices of a gateway' */
    try {
      const { gateway_API, time, devices } = req.body;
      console.log(req.body)

      // Kiểm tra xem các trường cần thiết đã được gửi hay không
      if (!gateway_API  || !devices || !Array.isArray(devices)) {
          res.status(400).json({ error: 'Dữ liệu yêu cầu không hợp lệ.' });
          return;
      }

      const gateway = await Gateway.findOne({ API: gateway_API });

      if (!gateway) {
          res.status(404).json({ error: 'Gateway không tồn tại.' });
          return;
      }

      // Lưu dữ liệu từ mỗi thiết bị của gateway thành các document riêng
      const promises = devices.map(async (deviceData) => {
          const { device_API, sensorData } = deviceData;

          const device = await Device.findOne({ device_API });
          const sensors = await Sensor.find({ sensor_API: { $in: Object.keys(sensorData) } });

          if (!device) {
              res.status(404).json({ error: `Thiết bị ${device_API} không tồn tại.` });
              return;
          }

          // if (sensors.length !== Object.keys(sensorData).length) {
          //     res.status(404).json({ error: 'Một hoặc nhiều cảm biến không tồn tại.' });
          //     return;
          // }

          // Lưu dữ liệu từ mỗi cảm biến thành một document riêng
          const sensorPromises = Object.entries(sensorData).map(async ([sensor_API, data]) => {
              const newData = new Data({
                  gateway_API: gateway_API,
                  device_API,
                  sensor_API,
                  data: { data, time },
                  isProcess: false
              });

              // Lưu document và bắt lỗi nếu có
              try {
                  await newData.save();
              } catch (error) {
                  console.error(`Lỗi khi lưu dữ liệu từ cảm biến: ${error.message}`);
              }
          });

          // Đợi tất cả các promise từ cảm biến được giải quyết
          await Promise.all(sensorPromises);
      });

      // Đợi tất cả các promise từ thiết bị được giải quyết
      await Promise.all(promises);

      res.status(201).json({ message: 'Dữ liệu từ cảm biến đã được lưu.' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Lỗi khi lưu dữ liệu từ cảm biến.' });
  }
});



data_router.get('/getdata/:sensor_API', midleware.authenToken, async (req, res) => {
  /* 	#swagger.tags = ['Data']
      #swagger.description = 'Endpoint to get data by API device' 
      #swagger.security = [{
            "apiKeyAuth": []
    }]*/
      const Token = req.header('authorization')
    jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET,async (err,data)=>{
    try {
        const sensor_API = req.params.sensor_API;
        var data = await Data.find({sensor_API})
        console.log(data)
        res.json(data)
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lay data.' });
    }
    })
})


module.exports = data_router