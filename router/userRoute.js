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
    const accessToken  = jwt.sign({email:req.body.email},process.env.ACCESS_TOKEN_SECRET,{expiresIn:'10h'})
    
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
    #swagger.description = 'Endpoint to get user' */
    const Token = req.header('authorization')
    jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET,async (err,data)=>{
        var user = await User.findOne({email:data.email})
        res.json(user)
    })    
})

user_router.post('/get_alluser', midleWare.authenToken, async (req, res) => {
    /* 	#swagger.tags = ['User']
    #swagger.description = 'Endpoint to get all user' */
    
    const Token = req.header('authorization');
    
    // Xác thực token
    jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET, async (err, data) => {
        if (err) {
            return res.status(401).json({ success: false, message: "Token không hợp lệ" });
        }

        // Kiểm tra vai trò của người dùng từ dữ liệu sau khi giải mã token
        const userRole = data.role; // Giả sử role được lưu trong dữ liệu giải mã từ token

        if (userRole === 'admin') {
            try {
                // Nếu là admin, lấy tất cả người dùng từ cơ sở dữ liệu
                const allUsers = await User.find();

                return res.status(200).json({
                    success: true,
                    data: {
                        total: allUsers.length,
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
    #swagger.description = 'Endpoint to delete user' */
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



user_router.put('/updateUser/:User_key', midleWare.authenToken,(req,res)=>{
/* 	#swagger.tags = ['User']
    #swagger.description = 'Endpoint to update user' */
    const Token = req.header('authorization')
    jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET,async (err,data)=>{
    try {
      const User_key = req.params.User_key; 
      const updatedData = req.body;
  
      // Kiểm tra xem người dùng có tồn tại không
      const user = await User.findOne({ User_key });
  
      if (!user) {
        res.status(404).json({ error: 'Người dùng không tồn tại.' });
        return;
      }
      console.log(updatedData)
      // Cập nhật dữ liệu người dùng
      await User.updateOne({ User_key }, updatedData);
  
      res.status(200).json({ message: 'Dữ liệu người dùng đã được cập nhật thành công.' });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi khi cập nhật dữ liệu người dùng.' });
    }
    })
})









module.exports = user_router
