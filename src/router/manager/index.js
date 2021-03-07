var express = require('express')
var router = express.Router()

router.all('/*', async function(req, res, next) {
    res.write(req.method+':'+req.originalUrl+";")
    next()
    res.end('')
})

router.get('/', async function(req, res){
    res.write('manager')
})

router.get('/test', async function(req,res){
    res.write('manager test')
})

router.get('/get', async function(req, res) {
    res.write('manager get')
})

module.exports = router