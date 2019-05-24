const debug = require('debug')
const { Prometheus } = require('./prometheus')

const prom = require('prom-client')


class PushPrometheus extends Prometheus {
    constructor(pushgw) {
        super()

        if(!pushgw) {
            throw new Error('PushPrometheus requires a pushgateway url')
        }

        this.pushgw = new prom.Pushgateway(pushgw)
    }


    async receive(report, config) {
        await super.receive(report, config)

        this.pushgw.pushAdd({jobName: 'lightmon'}, (err) => {
            if (err) {
                debug('LIGHTMON:PUSHGW:WARN')(err)
            }
        })
    }
}


module.exports = {
    PushPrometheus,
}