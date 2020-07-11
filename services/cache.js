const mongoose = require('mongoose')
const redis = require('redis')
const util = require('util')
const keys = require('../config/keys')

// const redisUrl = 'redis://127.0.0.1:6379'
// const client = redis.createClient(redisUrl)
const client = redis.createClient(keys.redisUrl)
// client.get usa callback, vamos fazer com que ela retorne um promise ao inves do callback
client.hget = util.promisify(client.hget)
const exec = mongoose.Query.prototype.exec

mongoose.Query.prototype.cache = function (options = {}) {
    this.useCache = true
    this.hashKey = JSON.stringify(options.key || '')
    return this
}

mongoose.Query.prototype.exec = async function () {
    if (!this.useCache) {
        return exec.apply(this, arguments)
    }

    const key = JSON.stringify(Object.assign({}, this.getQuery(), {
        collection: this.mongooseCollection.name
    }))

    // procura o id no redis
    const cachedValue = await client.hget(this.hashKey, key)
    // se tiver retorna response e return
    if (cachedValue) {
        console.log('DISPONIBILIZADO PELO CACHE')
        const doc = JSON.parse(cachedValue)
        return Array.isArray(doc)
            ? doc.map(d => new this.model(d))
            : new this.model(doc)
    }
    // procura no mongo
    const result = await exec.apply(this, arguments)
    console.log('DISPONIBILIZADO PELO MONGO')

    // para apagar a memoria do redis,  client.flushall()  
    // insere no redis
    client.hset(this.hashKey, key, JSON.stringify(result))

    return result
}


module.exports = {
    clearHash(hashKey) {
        client.del(JSON.stringify(hashKey))
    }
}

