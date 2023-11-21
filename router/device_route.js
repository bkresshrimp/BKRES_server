var express = require('express')
var device_router = express.Router()
var Device = require('../model/device_schema')
var Gateway = require('../model/gateway_schema')
var jwt = require('jsonwebtoken')
var midleware = require('../midleWare')
var {makeid} = require('../generate_apiKey')


device_router.post('/create',midleware.authenToken,async (req,res)=>{
/* 	#swagger.tags = ['Device']
    #swagger.description = 'Endpoint to create device'
    #swagger.security = [{
            "apiKeyAuth": []
    }] */
    console.log(req)
    const Token = req.header('authorization')
    jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET,async(err,data1)=>{
        console.log(req.body)
        Gateway.findOne({ gateway_API: req.body.gateway_API }, async (err, gateway) => {
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
            var Api = gateway.gateway_API + makeid(8)
            var device = new Device({
                device_name: req.body.device_name,
                device_API: Api,
                device_ip:req.body.device_ip,              
                count : req.body.count || 0,
                mess_in_minute : req.body.mess_in_minute || 0,
                is_public : req.body.is_public || false,
                time_interval : req.body.time_interval || null,
                last_data : new Date(), 
                gateway_API:req.body.gateway_API
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


device_router.delete('/deletedevice/:device_API', midleware.authenToken,(req,res)=>{
    /* 	#swagger.tags = ['Device']
    #swagger.description = 'Endpoint to delete device' 
    #swagger.security = [{
            "apiKeyAuth": []
    }]*/
    const Token = req.header('authorization')
    jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET,async (err,data)=>{
        try {
            const device_API = req.params.device_API; 
        
            // Kiểm tra xem device có tồn tại không
            const device = await Device.findOne({ device_API });
        
            if (!device) {
              res.status(404).json({ error: 'Device không tồn tại.' });
              return;
            }
        
            // Xóa device khỏi cơ sở dữ liệu
            await Device.findOneAndRemove({ device_API });                
            Gateway.updateOne({},{$pull:{device:{device_API:device_API}}},{multi:true},(err)=>{
                if(!err) res.json({success:"success"})
            })

          } catch (error) {
            res.status(500).json({ error: 'Lỗi khi xóa gateway.' });
          }
    })
})


device_router.put('/updateDevice/:device_API', midleware.authenToken,(req,res)=>{
    /* 	#swagger.tags = ['Device']
    #swagger.description = 'Endpoint to update device'
    #swagger.security = [{
            "apiKeyAuth": []
    }] */
    const Token = req.header('authorization')
    jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET,async (err,data)=>{
    try {
      const device_API = req.params.device_API; 
      const { device_name, device_ip, is_public } = req.body;

      const device = await Device.findOne({ device_API });
        if (!device) {
            return res.status(404).json({ error: 'Thiet bi không tồn tại.' });
        }

        if (device_name) {
            device.device_name = device_name;
        }

        if (device_ip) {
            device.device_ip = device_ip;
        }

        if (is_public) {
            device.is_public = is_public;
        }

        await device.save(); 
  
      res.status(200).json({ message: 'Dữ liệu thiet bi đã được cập nhật thành công.' });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi khi cập nhật dữ liệu thiet bi.' });
    }
    })
})


device_router.post('/getDevice/:device_API', midleware.authenToken, async (req, res) => {
    /* 	#swagger.tags = ['Device']
        #swagger.description = 'Endpoint to get device'
        #swagger.security = [{
            "apiKeyAuth": []
    }] */
        const Token = req.header('authorization')
    jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET,async (err,data)=>{
    try {
        const device_API = req.params.device_API;
        var device = await Device.findOne({device_API})
        console.log(device)
        res.json(device)
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lay dữ liệu device.' });
    }
    })
})


device_router.post('/getallDevice', midleware.authenToken, async (req, res) => {
    /* 	#swagger.tags = ['Device']
        #swagger.description = 'Endpoint to get all device'
        #swagger.security = [{
            "apiKeyAuth": []
    }] */
        const Token = req.header('authorization');

        // Xác thực token
        jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET, async (err, data) => {
            if (err) {
                return res.status(401).json({ success: false, message: "Token không hợp lệ" });
            }
    
            try {
                const { gateway_API } = req.query.gateway_API; 
                // Khai báo các tham số cho phân trang, filter và sort
                const { page = 1, limit = 10 } = req.query;
                const { sortBy , sortOrder, filterKey, filterValue } = req.body;
    
                let filterCriteria = { gateway_API };
    
                if (filterKey && filterValue) {
                    filterCriteria[filterKey] = filterValue;
                }
    
                const sortQuery = {};
                sortQuery[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
                const skip = (page - 1) * limit;
    
                const devices = await Device.find(filterCriteria)
                    .sort(sortQuery)
                    .skip(skip)
                    .limit(limit);
    
                const totalCount = await Device.countDocuments(filterCriteria);
    
                return res.status(200).json({
                    success: true,
                    data: {
                        total: totalCount,
                        devices: devices,
                    },
                });
            } catch (err) {
                console.log(err);
                return res.status(500).json({ success: false, message: "Lỗi Server. Vui lòng thử lại sau" });
            }
        });
})


module.exports = device_router