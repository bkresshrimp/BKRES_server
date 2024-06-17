var express = require('express')
var gateway_router = express.Router()
var User = require('../model/user_schema')
var Gateway = require('../model/gateway_schema')
var jwt = require('jsonwebtoken')
var midleware = require('../midleWare')
var {makeid} = require('../generate_apiKey')


gateway_router.post('/create',midleware.authenToken,async (req,res)=>{
/* 	#swagger.tags = ['Gateway']
    #swagger.description = 'Endpoint to create gateway' 
    #swagger.security = [{
            "apiKeyAuth": []
    }]*/
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
                User_key: user.User_key,
                location:[{
                    lat: lat,
                    lon: lon,    
                }],
                is_public : req.body.is_public || false,
                gateway_API :Api ,       
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


gateway_router.delete('/deletegateway/:gateway_API', midleware.authenToken,(req,res)=>{
/* 	#swagger.tags = ['Gateway']
    #swagger.description = 'Endpoint to delete gateway' 
    #swagger.security = [{
            "apiKeyAuth": []
    }]*/
    const Token = req.header('authorization')
    jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET,async (err,data)=>{
        try {
            const gateway_API = req.params.gateway_API; 
        
            // Kiểm tra xem gateway có tồn tại không
            const gateway = await Gateway.findOne({ gateway_API });
        
            if (!gateway) {
              res.status(404).json({ error: 'Gateway không tồn tại.' });
              return;
            }
        
            // Xóa gateway khỏi cơ sở dữ liệu
            await Gateway.findOneAndRemove({ gateway_API });                
            User.updateOne({email:data.email},{$pull:{gateway:{gateway_API:gateway_API}}},{multi:true},(err)=>{
                if(!err) res.json({success:"success"})
            })

          } catch (error) {
            res.status(500).json({ error: 'Lỗi khi xóa gateway.' });
          }
    })
})


gateway_router.put('/updateGateway/:gateway_API', midleware.authenToken, async (req, res) => {
/* 	#swagger.tags = ['Gateway']
    #swagger.description = 'Endpoint to update gateway' 
    #swagger.security = [{
            "apiKeyAuth": []
    }]*/
    const Token = req.header('authorization')
    jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET,async(err,data)=>{
    try {
        const gateway_API = req.params.gateway_API;
        const { gateway_name, lat, lon } = req.body;

        const gateway = await Gateway.findOne({ gateway_API });

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


gateway_router.get('/getGateway/:gateway_API', midleware.authenToken, async (req, res) => {
    /* 	#swagger.tags = ['Gateway']
        #swagger.description = 'Endpoint to get gateway' 
        #swagger.security = [{
            "apiKeyAuth": []
    }]*/
    const Token = req.header('authorization')
    jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET,async (err,data)=>{
    try {
        const gateway_API = req.params.gateway_API;
        var gateway = await Gateway.findOne({gateway_API})
        console.log(gateway)
        res.json(gateway)
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lay dữ liệu gateway.' });
    }
    })

})


gateway_router.get('/getallGateway', midleware.authenToken, async (req, res) => {
    /* #swagger.tags = ['Gateway']
       #swagger.description = 'Endpoint to get all gateway' 
       #swagger.security = [{
            "apiKeyAuth": []
    }]*/
    const Token = req.header('authorization');

    // Xác thực token
    jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET, async (err, data) => {
        if (err) {
            return res.status(401).json({ success: false, message: "Token không hợp lệ" });
        }

        const userRole = data.role;

        try {
            // Khai báo các tham số cho phân trang, filter và sort
            const { page = 1, limit = 10 } = req.query;
            const { sortBy = 'createdAt', sortOrder = 'desc', filterKey, filterValue } = req.body;

            let filterCriteria = {};

            // Thêm điều kiện lọc nếu được cung cấp
            if (filterKey && filterValue) {
                filterCriteria[filterKey] = filterValue;
            }

            const sortQuery = {};
            sortQuery[sortBy] = sortOrder === 'asc' ? 1 : -1;

            let allGateways;
            let totalCount;

            if (userRole === 'admin') {
                // Nếu là admin, lấy toàn bộ các gateway
                allGateways = await Gateway.find(filterCriteria)
                    .sort(sortQuery)
                    .skip((page - 1) * limit)
                    .limit(limit);
                totalCount = await Gateway.countDocuments(filterCriteria);
            } else {
                // Nếu không phải admin, lấy các gateway của người dùng và các gateway có is_public: true
                const userGateways = await Gateway.find({ 'User_key': data.User_key });
                const publicGateways = await Gateway.find({ 'is_public': true });

                allGateways = userGateways.concat(publicGateways);

                // Filter và sort các gateway như yêu cầu
                allGateways = allGateways
                    .filter(gateway => {
                        // Lọc các gateway theo các điều kiện nếu được cung cấp
                        if (filterKey && filterValue) {
                            return gateway[filterKey] === filterValue;
                        }
                        return true;
                    })
                    .sort((a, b) => {
                        if (sortOrder === 'asc') {
                            return a[sortBy] > b[sortBy] ? 1 : -1;
                        } else {
                            return a[sortBy] < b[sortBy] ? 1 : -1;
                        }
                    })
                    .slice((page - 1) * limit, page * limit);

                totalCount = allGateways.length;
            }

            return res.status(200).json({
                success: true,
                data: {
                    total: totalCount,
                    gateways: allGateways,
                },
            });

        } catch (err) {
            console.log(err);
            return res.status(500).json({ success: false, message: "Lỗi Server. Vui lòng thử lại sau" });
        }
    });
});


gateway_router.get('/:gateway_API/location', async (req, res) => {
    const { gateway_API } = req.params;
    const { lat, lon } = req.query;

    try {
        const gateway = await Gateway.findOneAndUpdate(
            { gateway_API },
            { $set: { 'location': [{ lat, lon }] } },
            { new: true, runValidators: true }
        );

        if (!gateway) {
            return res.status(404).send('Gateway not found');
        }

        res.send(gateway);
    } catch (error) {
        res.status(400).send(error.message);
    }
});
module.exports = gateway_router