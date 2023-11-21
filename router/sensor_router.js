var express = require('express')
var sensor_router = express.Router()
var Sensor= require('../model/sensor_schema')
var Device = require('../model/device_schema')
var jwt = require('jsonwebtoken')
var midleware = require('../midleWare')
var {makeid} = require('../generate_apiKey')


sensor_router.post('/create',midleware.authenToken,async (req,res)=>{
        /* 	#swagger.tags = ['Sensor']
    #swagger.description = 'Endpoint to create sensor' 
    #swagger.security = [{
            "apiKeyAuth": []
    }]*/
    console.log(req)
    const Token = req.header('authorization')
    jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET,async(err,data1)=>{
        console.log(req.body)
        Device.findOne({ device_API: req.body.device_API }, async (err, device) => {
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
            var Api = device.device_API + makeid(8)
            var sensor = new Sensor({
                sensor_name: req.body.sensor_name,
                device_API: req.body.device_API,
                provider: req.body.provider,
                unit: req.body.unit,
                describe : req.body.describe, 
                sensor_API :Api ,
        
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


sensor_router.delete('/deletesensor/:sensor_API', midleware.authenToken,(req,res)=>{
/* 	#swagger.tags = ['Sensor']
    #swagger.description = 'Endpoint to delete sensor'
    #swagger.security = [{
            "apiKeyAuth": []
    }] */
    const Token = req.header('authorization')
    jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET,async (err,data)=>{
        try {
            const sensor_API = req.params.sensor_API; 
        
            // Kiểm tra xem sensor có tồn tại không
            const sensor = await Sensor.findOne({ sensor_API });
        
            if (!sensor) {
              res.status(404).json({ error: 'Sensor không tồn tại.' });
              return;
            }
        
            // Xóa sensor khỏi cơ sở dữ liệu
            await Sensor.findOneAndRemove({ sensor_API });                
            Device.updateOne({},{$pull:{sensor:{sensor_API:sensor_API}}},{multi:true},(err)=>{
                if(!err) res.json({success:"success"})
            })

          } catch (error) {
            res.status(500).json({ error: 'Lỗi khi xóa sensor.' });
          }
    })
})


sensor_router.put('/updateSensor/:sensor_API', midleware.authenToken,(req,res)=>{
    /* 	#swagger.tags = ['Sensor']
    #swagger.description = 'Endpoint to update sensor' 
    #swagger.security = [{
            "apiKeyAuth": []
    }]*/
    const Token = req.header('authorization')
    jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET,async (err,data)=>{
    try {
      const sensor_API = req.params.sensor_API; 
      const { sensor_name, device_API, provider, unit, describe } = req.body;

      const sensor = await Sensor.findOne({ sensor_API });
        if (!sensor) {
            return res.status(404).json({ error: 'cam bien không tồn tại.' });
        }

        if (sensor_name) {
            sensor.sensor_name = sensor_name;
        }

        if (device_API) {
            sensor.device_API = device_API;
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


sensor_router.post('/getSensor/:sensor_API', midleware.authenToken, async (req, res) => {
    /* 	#swagger.tags = ['Sensor']
        #swagger.description = 'Endpoint to get sensor' 
        #swagger.security = [{
            "apiKeyAuth": []
    }]*/
        const Token = req.header('authorization')
        jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET,async (err,data)=>{
        try {
            const sensor_API = req.params.sensor_API;
            var sensor = await Sensor.findOne({sensor_API})
            console.log(sensor)
            res.json(sensor)
        } catch (error) {
            res.status(500).json({ error: 'Lỗi khi lay dữ liệu cam bien.' });
        }
        })   
})


sensor_router.post('/getallSensor', midleware.authenToken, async (req, res) => {
    /* 	#swagger.tags = ['Sensor']
        #swagger.description = 'Endpoint to get all sensor' 
        #swagger.security = [{
            "apiKeyAuth": []
    }]*/
        const Token = req.header('authorization');

        // Xác thực token
        jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET, async (err, data) => {
            if (err) {
                return res.status(401).json({ success: false, message: "Token không hợp lệ" });
            }
    
            try {
                const { device_API } = req.query.device_API; 
                // Khai báo các tham số cho phân trang, filter và sort
                const { page = 1, limit = 10 } = req.query;
                const { sortBy , sortOrder, filterKey, filterValue } = req.body;
    
                let filterCriteria = { device_API };
    
                if (filterKey && filterValue) {
                    filterCriteria[filterKey] = filterValue;
                }
    
                const sortQuery = {};
                sortQuery[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
                const skip = (page - 1) * limit;
    
                const sensors = await Sensor.find(filterCriteria)
                    .sort(sortQuery)
                    .skip(skip)
                    .limit(limit);
    
                const totalCount = await Sensor.countDocuments(filterCriteria);
    
                return res.status(200).json({
                    success: true,
                    data: {
                        total: totalCount,
                        sensors: sensors,
                    },
                });
            } catch (err) {
                console.log(err);
                return res.status(500).json({ success: false, message: "Lỗi Server. Vui lòng thử lại sau" });
            }
        });
})


module.exports = sensor_router