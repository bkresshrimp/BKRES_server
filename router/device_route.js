var express = require('express')
var device_router = express.Router()

var Device = require('../model/device_schema')
var Gateway = require('../model/gateway_schema')
var jwt = require('jsonwebtoken')
var midleware = require('../midleWare')
var {makeid} = require('../generate_apiKey')


device_router.post('/create',midleware.authenToken,async (req,res)=>{
/* 	#swagger.tags = ['Device']
    #swagger.description = 'Endpoint to create device' */
    console.log(req)
    const Token = req.header('authorization')
    jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET,async(err,data1)=>{
        console.log(req.body)
        Gateway.findOne({ gateway_name: req.body.gateway_name }, async (err, gateway) => {
            if (err) {
                // Xử lý lỗi ở đây
                console.error(err);
                return res.json({ status: 'err', mess: 'Error finding the gateway' });
            }
        
            if (!gateway) {
                return res.json({ status: 'err', mess: 'Gateway not found' });
            }
        
            // Tiếp tục tìm kiếm thiết bị
            var findNameDevice = await gateway.device.find(device => device.device_name === req.body.device_name);
            if(findNameDevice) return res.json({status:'err', mess:"Name is match"})
            var Api = gateway.API + makeid(8)
            var device = new Device({
                device_name: req.body.device_name,
                device_id: req.body.device_id,
                device_ip:req.body.device_ip,              
                count : req.body.count || 0,
                mess_in_minute : req.body.mess_in_minute || 0,
                is_block : req.body.is_block || false,
                time_interval : req.body.time_interval || null,
                last_data : new Date(), 
                API :Api ,
        
            })
            
            device.save((err)=>{
                if(err) res.json({
                    status:'err',
                    mess:"error is "+ err
                })
                
                })
            var push = await gateway.device.push(device)
            if(push) gateway.save((err)=>{
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


device_router.delete('/deletedevice/:API', midleware.authenToken,(req,res)=>{
    /* 	#swagger.tags = ['Device']
    #swagger.description = 'Endpoint to delete device' */
    const Token = req.header('authorization')
    jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET,async (err,data)=>{
        try {
            const API = req.params.API; 
        
            // Kiểm tra xem device có tồn tại không
            const device = await Device.findOne({ API });
        
            if (!device) {
              res.status(404).json({ error: 'Device không tồn tại.' });
              return;
            }
        
            // Xóa device khỏi cơ sở dữ liệu
            await Device.findOneAndRemove({ API });                
            Gateway.updateOne({},{$pull:{device:{API:API}}},{multi:true},(err)=>{
                if(!err) res.json({success:"success"})
            })

          } catch (error) {
            res.status(500).json({ error: 'Lỗi khi xóa gateway.' });
          }
    })
})


device_router.put('/updateDevice/:API', midleware.authenToken,(req,res)=>{
    /* 	#swagger.tags = ['Device']
    #swagger.description = 'Endpoint to update device' */
    const Token = req.header('authorization')
    jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET,async (err,data)=>{
    try {
      const API = req.params.API; 
      const { device_name, device_id, device_ip } = req.body;

      const device = await Device.findOne({ API });
        if (!device) {
            return res.status(404).json({ error: 'Thiet bi không tồn tại.' });
        }

        if (device_name) {
            device.device_name = device_name;
        }

        if (device_id) {
            device.device_id = device_id;
        }

        if (device_ip) {
            device.device_ip = device_ip;
        }

        await device.save(); 
  
      res.status(200).json({ message: 'Dữ liệu thiet bi đã được cập nhật thành công.' });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi khi cập nhật dữ liệu thiet bi.' });
    }
    })
})


device_router.post('/getDevice/:API', midleware.authenToken, async (req, res) => {
    /* 	#swagger.tags = ['Device']
        #swagger.description = 'Endpoint to get device' */
        const Token = req.header('authorization')
    jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET,async (err,data)=>{
    try {
        const API = req.params.API;
        var device = await Device.findOne({API})
        console.log(device)
        res.json(device)
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lay dữ liệu device.' });
    }
    })
})


device_router.post('/getallDevice/:API', midleware.authenToken, async (req, res) => {
    /* 	#swagger.tags = ['Device']
        #swagger.description = 'Endpoint to get all device' */
})


module.exports = device_router