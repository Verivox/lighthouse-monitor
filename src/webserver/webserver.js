/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const debug = require('debug')
const info = debug('LIGHTMON:INFO')
const express = require('express')


class Webserver {
    constructor({ port = 3000 }) {
        this._app = express()
        this._port = port
    }

    registerList(middlewares) {
        for (const middle of middlewares) {
            this.register(middle)
        }
    }

    register(mid) {
        if (typeof mid === 'function') {
            this._app.use(mid)
        } else {
            this._app.use(mid.middleware().bind(mid))
        }
    }

    start() {
        this.registerList(Webserver.middleware)
        this._app.listen(this._port, this._onStartup.bind(this))
    }

    _onStartup() {
        info(`Listening on Port: ${this._port}`)
    }

    run() {
        info('Starting Webserver')
        this.start()
    }
}

Webserver.middleware = new Set()


module.exports = {
    default: Webserver,
    Webserver,
}
