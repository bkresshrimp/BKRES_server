var express = require('express')
var sensor_router = express.Router()
var Sensor= require('../model/sensor_schema')
var Device = require('../model/device_schema')
var jwt = require('jsonwebtoken')
var midleware = require('../midleWare')
var {makeid} = require('../generate_apiKey')


sensor_router.post('/create',midleware.authenToken,async (req,res)=>{
        /* 	#swagger.tags = ['Sensor']
    #swagger.description = 'Endpoint to create sensor' */
    console.log(req)
    const Token = req.header('authorization')
    jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET,async(err,data1)=>{
        console.log(req.body)
        Device.findOne({ device_id: req.body.device_id }, async (err, device) => {
            if (err) {
                // Xử lý lỗi ở đây
                console.error(err);
                return res.json({ status: 'err', mess: 'Error finding the device' });
            }
        
            if (!device) {
                return res.json({ status: 'err', mess: 'Device not found' });
            }
        
            // Tiếp tục tìm kiếm sensor
            var findNameSensor = await device.sensor.find(sensor => sensor.sensor_name === req.body.sensor_name);
            if(findNameSensor) return res.json({status:'err', mess:"Name is match"})
            var Api = device.API + makeid(8)
            var sensor = new Sensor({
                sensor_name: req.body.sensor_name,
                device_id: req.body.device_id,
                provider: req.body.provider,
                unit: req.body.unit,
                describe : req.body.describe, 
                API :Api ,
        
            })
            
            sensor.save((err)=>{
                if(err) res.json({
                    status:'err',
                    mess:"error is "+ err
                })
                
                })
            var push = await device.sensor.push(sensor)
            if(push) device.save((err)=>{
                if(err) res.json({
                    status:'err'
                })
                else res.json({
                    status:"success",
                    mess: Api 
                })
            })
            })
       

    })
})


sensor_router.delete('/deletesensor/:API', midleware.authenToken,(req,res)=>{
/* 	#swagger.tags = ['Sensor']
    #swagger.description = 'Endpoint to delete sensor' */
    const Token = req.header('authorization')
    jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET,async (err,data)=>{
        try {
            const API = req.params.API; 
        
            // Kiểm tra xem sensor có tồn tại không
            const sensor = await Sensor.findOne({ API });
        
            if (!sensor) {
              res.status(404).json({ error: 'Sensor không tồn tại.' });
              return;
            }
        
            // Xóa sensor khỏi cơ sở dữ liệu
            await Sensor.findOneAndRemove({ API });                
            Device.updateOne({},{$pull:{sensor:{API:API}}},{multi:true},(err)=>{
                if(!err) res.json({success:"success"})
            })

          } catch (error) {
            res.status(500).json({ error: 'Lỗi khi xóa sensor.' });
          }
    })
})


sensor_router.put('/updateSensor/:API', midleware.authenToken,(req,res)=>{
    /* 	#swagger.tags = ['Sensor']
    #swagger.description = 'Endpoint to update sensor' */
    const Token = req.header('authorization')
    jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET,async (err,data)=>{
    try {
      const API = req.params.API; 
      const { sensor_name, device_id, provider, unit, describe } = req.body;

      const sensor = await Sensor.findOne({ API });
        if (!sensor) {
            return res.status(404).json({ error: 'cam bien không tồn tại.' });
        }

        if (sensor_name) {
            sensor.sensor_name = sensor_name;
        }

        if (device_id) {
            sensor.device_id = device_id;
        }

        if (provider) {
            sensor.provider = provider;
        }

        if (unit) {
            sensor.unit = unit;
        }

        if (describe) {
            sensor.describe = describe;
        }

        await sensor.save();
  
      res.status(200).json({ message: 'Dữ liệu cam bien đã được cập nhật thành công.' });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi khi cập nhật dữ liệu cam bien.' });
    }
    })
})


sensor_router.post('/getSensor/:API', midleware.authenToken, async (req, res) => {
    /* 	#swagger.tags = ['Sensor']
        #swagger.description = 'Endpoint to get sensor' */
        const Token = req.header('authorization')
        jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET,async (err,data)=>{
        try {
            const API = req.params.API;
            var sensor = await Sensor.findOne({API})
            console.log(sensor)
            res.json(sensor)
        } catch (error) {
            res.status(500).json({ error: 'Lỗi khi lay dữ liệu cam bien.' });
        }
        })   
})


sensor_router.post('/getallSensor/:API', midleware.authenToken, async (req, res) => {
    /* 	#swagger.tags = ['Sensor']
        #swagger.description = 'Endpoint to get all sensor' */
})


module.exports = sensor_router