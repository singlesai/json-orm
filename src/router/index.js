var express = require('express')
var router = express.Router()
var managerRouter = require('./manager')
var authRouter = require('./auth')
var apiRouter = require('./api')

router.use('/manager', managerRouter)
router.use('/auth', authRouter)
router.use('/api', apiRouter)

router.all('/*', async function(req, res, next) {
    res.write(req.method+':'+req.originalUrl+";")
    next()
    res.end('')
})

router.get('/test', async function(req, res){
    res.write('test')
})

module.exports = router