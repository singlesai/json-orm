var cfg = require('./config.json')
var router = require('./router')

var express = require('express')
var app = express()
app.use('/', router)
const server = require('http').createServer(app)
const io = require('socket.io')(server)

const Solution = require('./entity/solution')

var base = new Solution()


server.listen(cfg.port, ()=>{
    var host = server.address().address
    var port = server.address().port
    console.log('Your Server Is Running Here:http://%s:%s', host, port)
})