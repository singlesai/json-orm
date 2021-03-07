var express = require('express')
var router = express.Router()
var managerRouter = require('./manager')
var apiRouter = require('./api')

router.use('/manager', managerRouter)
router.use('/api', apiRouter)

router.get('/test', async function(req, res){
    res.end('test')
})

module.exports = router