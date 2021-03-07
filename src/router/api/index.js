var express = require('express')
var router = express.Router()

router.all('/*', async function(req, res, next) {
    res.write(req.method+':'+req.originalUrl+";")
    next()
    res.end('')
})

router.get('/', async function(req, res) {
    res.write('api get')
})

router.post('/', async function(req, res) {
    res.write('api post')
})

router.put('/', async function(req, res) {
    res.write('api put')
})

router.delete('/', async function(req, res) {
    res.write('api delete')
})

module.exports = router