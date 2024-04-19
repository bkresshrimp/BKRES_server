var express = require('express')
var user_router = express.Router()

var User = require('../model/user_schema')
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken')
var dotenv = require('dotenv')
var midleWare = require('../midleWare')
var {makeid} = require('../generate_apiKey')
dotenv.config()


user_router.post('/login',async (req,res)=>{
    /* 	#swagger.tags = ['User']
    #swagger.description = 'Endpoint to login in a specific user' */
    const user = await User.findOne({email:req.body.email})
    if(!user) return res.status(200).json({err:'Email or Password is not correct'})
    const checkPassword = await bcrypt.compare(req.body.password,user.hash_password)
    if(!checkPassword) return res.status(200).json({err:"Email or Password is not correct"})
    const accessToken  = jwt.sign({email:req.body.email,role:user.role},process.env.ACCESS_TOKEN_SECRET,{expiresIn:'10h'})
    
    res.json({
        Token:accessToken
        
    })
})


user_router.post('/register', async (req, res) => {
    /* 	#swagger.tags = ['User']
    #swagger.description = 'Endpoint to create user' */
    console.log(req.body);

    // Kiểm tra xem email đã tồn tại trong cơ sở dữ liệu hay chưa
    const existingUser = await User.findOne({ email: req.body.email });

    if (existingUser) {
        return res.status(200).json({
            error: 'Email already exists'
        });
    }

    // Kiểm tra xem tài khoản đã tồn tại trong cơ sở dữ liệu hay chưa
    const existingAccount = await User.findOne({ account: req.body.account });

    if (existingAccount) {
        return res.status(200).json({
            error: 'Account already exists'
        });
    }

    // Tạo một đối tượng User mới
    const salt = await bcrypt.genSalt(10);
    const hash_password = await bcrypt.hash(req.body.password, salt);

    const user = new User({
        name: req.body.fname + ' ' + req.body.lname,
        account: req.body.account,
        hash_password: hash_password, 
        email: req.body.email,
        role: req.body.role,
        User_key: makeid(10)
    });

    // Lưu người dùng vào cơ sở dữ liệu
    try {
        await user.save();
        res.json({
            result: 'Success'
        });
    } catch (err) {
        res.status(500).json({
            result: 'failed',
            message: 'Error is ' + err
        });
    }
});


user_router.post('/get_user',midleWare.authenToken,(req,res)=>{
    /* 	#swagger.tags = ['User']
    #swagger.description = 'Endpoint to get user' 
    #swagger.security = [{
            "apiKeyAuth": []
    }]*/
    const Token = req.header('authorization')
    jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET,async (err,data)=>{
        var user = await User.findOne({email:data.email})
        res.json(user)
    })    
})


user_router.post('/get_alluser', midleWare.authenToken, async (req, res) => {
    /* 	#swagger.tags = ['User']
    #swagger.description = 'Endpoint to get all user' 
    #swagger.security = [{
            "apiKeyAuth": []
    }]*/
    
    const Token = req.header('authorization');
    
    // Xác thực token
    jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET, async (err, data) => {
        console.log(data)
        if (err) {
            return res.status(401).json({ success: false, message: "Token không hợp lệ" });
        }

        const userRole = data.role; 

        if (userRole === 'admin') {
            try {
                // Khai báo các tham số cho phân trang, filter và sort
                const {page = 1, limit = 10}=req.query;
                const { sortBy = 'createdAt', sortOrder = 'desc', filterKey, filterValue } = req.body;

                let filterCriteria = {};

                // Thêm điều kiện lọc nếu được cung cấp
                if (filterKey && filterValue) {
                    filterCriteria[filterKey] = filterValue;
                }

                const sortQuery = {};
                sortQuery[sortBy] = sortOrder === 'asc' ? 1 : -1;

                // Tính toán skip (bỏ qua) cho phân trang
                const skip = (page - 1) * limit;

                // Truy vấn cơ sở dữ liệu với phân trang, lọc và sắp xếp
                const allUsers = await User.find(filterCriteria)
                    .sort(sortQuery)
                    .skip(skip)
                    .limit(limit);

                const totalCount = await User.countDocuments(filterCriteria);

                return res.status(200).json({
                    success: true,
                    data: {
                        total: totalCount,
                        users: allUsers,
                    },
                });
            } catch (err) {
                console.log(err);
                return res.status(500).json({ success: false, message: "Lỗi Server. Vui lòng thử lại sau" });
            }
        } else {
            return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập" });
        }
    });
});


user_router.delete('/deleteuser/:User_key', midleWare.authenToken,(req,res)=>{
    /* 	#swagger.tags = ['User']
    #swagger.description = 'Endpoint to delete user' 
    #swagger.security = [{
            "apiKeyAuth": []
    }]*/
    const Token = req.header('authorization')
    jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET,async (err,data)=>{
        try {
            const User_key = req.params.User_key; 
        
            // Kiểm tra xem người dùng có tồn tại không
            const user = await User.findOne({ User_key });
        
            if (!user) {
              res.status(404).json({ error: 'Người dùng không tồn tại.' });
              return;
            }
        
            // Xóa người dùng khỏi cơ sở dữ liệu
            await User.findOneAndRemove({ User_key });
        
            res.status(200).json({ message: 'Người dùng đã được xóa thành công.' });
        } catch (error) {
            res.status(500).json({ error: 'Lỗi khi xóa người dùng.' });
          }
    })
})


user_router.put('/updateUser/:User_key', midleWare.authenToken, async (req, res) => {
    /* #swagger.tags = ['User']
    #swagger.description = 'Endpoint to update user' 
    #swagger.security = [{
            "apiKeyAuth": []
    }]*/
    const Token = req.header('authorization');
    jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET, async (err, data) => {
        try {
            const User_key = req.params.User_key;
            const { name, account, email } = req.body;

            // Kiểm tra xem người dùng có tồn tại không
            const user = await User.findOne({ User_key });

            if (!user) {
                return res.status(404).json({ error: 'Người dùng không tồn tại.' });
            }

            // Cập nhật dữ liệu người dùng chỉ với các trường được cung cấp
            if (name) {
                user.name = name;
            }
            if (account) {
                user.account = account;
            }
            if (email) {
                user.email = email;
            }

            await user.save();

            res.status(200).json({ message: 'Dữ liệu người dùng đã được cập nhật thành công.' });
        } catch (error) {
            res.status(500).json({ error: 'Lỗi khi cập nhật dữ liệu người dùng.' });
        }
    });
});


module.exports = user_router
