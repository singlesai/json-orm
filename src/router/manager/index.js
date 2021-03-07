var express = require('express')
var router = express.Router()

router.get('/', async function(req, res){
    res.end('manager')
})

router.get('/test', async function(req,res){
    res.end('manager test')
})

router.get('/get', async function(req, res) {
    res.end('manager get')
})

module.exports = router