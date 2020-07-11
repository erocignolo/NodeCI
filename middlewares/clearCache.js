const { clearHash } = require('../services/cache')

module.exports = async (req, res, next) => {
    await next()
    console.log('estou no await next() do clearCache.js')
    clearHash(req.user.id)
}