var express = require('express')
var router = express.Router()

router.get('/', async function(req, res) {
    res.end('api get')
})

router.post('/', async function(req, res) {
    res.end('api post')
})

router.put('/', async function(req, res) {
    res.end('api put')
})

router.delete('/', async function(req, res) {
    res.end('api delete')
})

module.exports = router