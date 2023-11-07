var express = require('express')
var gateway_router = express.Router()
var User = require('../model/user_schema')
var Gateway = require('../model/gateway_schema')
var jwt = require('jsonwebtoken')
var midleware = require('../midleWare')
var {makeid} = require('../generate_apiKey')


gateway_router.post('/create',midleware.authenToken,async (req,res)=>{
/* 	#swagger.tags = ['Gateway']
    #swagger.description = 'Endpoint to create gateway' */
    console.log(req)
    const Token = req.header('authorization')
    jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET,async(err,data)=>{
        User.findOne({email:data.email},async (err,user)=>{
            var findNameGateway = await user.gateway.find(gateway => gateway.gateway_name === req.body.gateway_name )
            if(findNameGateway) return res.json({status:'err', mess:"Name is match"})
            var Api = user.User_key + makeid(8)
            const lat = req.body.lat
            const lon = req.body.lon
            console.log(lat,lon)
            var gateway = new Gateway({
                gateway_name: req.body.gateway_name,
                location:[{
                    lat: lat,
                    lon: lon,    
                }],
                is_public : req.body.is_public || false,
                API :Api ,       
            })
            console.log(gateway)
            gateway.save((err)=>{
                if(err) res.json({
                    status:'err',
                    mess:"error is "+ err
                })
                
                })
            var push = await user.gateway.push(gateway)
            if(push) user.save((err)=>{
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



gateway_router.delete('/deletegateway/:API', midleware.authenToken,(req,res)=>{
/* 	#swagger.tags = ['Gateway']
    #swagger.description = 'Endpoint to delete gateway' */
    const Token = req.header('authorization')
    jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET,async (err,data)=>{
        try {
            const API = req.params.API; 
        
            // Kiểm tra xem gateway có tồn tại không
            const gateway = await Gateway.findOne({ API });
        
            if (!gateway) {
              res.status(404).json({ error: 'Gateway không tồn tại.' });
              return;
            }
        
            // Xóa gateway khỏi cơ sở dữ liệu
            await Gateway.findOneAndRemove({ API });                
            User.updateOne({email:data.email},{$pull:{gateway:{API:API}}},{multi:true},(err)=>{
                if(!err) res.json({success:"success"})
            })

          } catch (error) {
            res.status(500).json({ error: 'Lỗi khi xóa gateway.' });
          }
    })
})


gateway_router.put('/updateGateway/:API', midleware.authenToken, async (req, res) => {
/* 	#swagger.tags = ['Gateway']
    #swagger.description = 'Endpoint to update gateway' */
    const Token = req.header('authorization')
    jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET,async(err,data)=>{
    try {
        const API = req.params.API;
        const { gateway_name, lat, lon } = req.body;

        const gateway = await Gateway.findOne({ API });

        if (!gateway) {
            return res.status(404).json({ error: 'Gateway không tồn tại.' });
        }

        if (gateway_name) {
            gateway.gateway_name = gateway_name;
        }

        if (lat && lon) {
            gateway.location = [{ lat, lon }];
        }

        await gateway.save(); 

        res.status(200).json({ message: 'Dữ liệu gateway đã được cập nhật thành công.' });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi cập nhật dữ liệu gateway.' });
    }
    })
})

gateway_router.post('/getGateway/:API', midleware.authenToken, async (req, res) => {
    /* 	#swagger.tags = ['Gateway']
        #swagger.description = 'Endpoint to get gateway' */
    const Token = req.header('authorization')
    jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET,async (err,data)=>{
        try {
        const API = req.params.API;
        var gateway = await Gateway.findOne({API})
        console.log(gateway)
        res.json(gateway)
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lay dữ liệu gateway.' });
    }
    })

})

gateway_router.post('/getallGateway', midleware.authenToken, async (req, res) => {
    /* 	#swagger.tags = ['Gateway']
        #swagger.description = 'Endpoint to get all gateway' */
        const Token = req.header('authorization')
        jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET,async (err,data)=>{
            
        })    
})


module.exports = gateway_router