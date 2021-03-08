var express = require('express')
var router = express.Router()
var managerRouter = require('./manager')
var authRouter = require('./auth')
var apiRouter = require('./api')

router.use('/manager', managerRouter)
router.use('/auth', authRouter)
router.use('/api', apiRouter)

router.all('/*', async function(req, res, next) {
    if(req.url==="/favicon.ico"){
    　　res.end()
        return
    }
    try{
        const Solution = require('../entity/solution')
        var base = new Solution()
        var srvSolution = new Solution(base, 'srv')
        var test =await (await srvSolution.model('model')).query()
        console.log('test', test)
    }catch(ex){
        console.log('ex', ex)
    }
    res.write(req.method+':'+req.originalUrl+";")
    next()
    res.end('')
})

router.get('/test', async function(req, res){
    res.write('test')
})

module.exports = router