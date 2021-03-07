var express = require('express')
var router = express.Router()

router.post('/regedit', async function(req, res) { //注册
    res.write('regedit')
})

router.get('/verification', async function(req, res) { //注册验证
    res.write('verification')
})

router.get('/login', async function(req, res) { //登录
    res.write('login')
})

router.get('/logout', async function(req, res) { //登出
    res.write('logout')
})

router.get('/status', async function(req, res) { //登录状态
    res.write('status')
})

router.get('/change_password', async function(req, res) { //修改密码
    res.write('change password')
})

module.exports = router