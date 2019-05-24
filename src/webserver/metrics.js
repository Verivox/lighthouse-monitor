/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const express = require('express')
const path = require('path')


class Metrics {
    constructor({ Webserver, prometheusMetricsFile }) {
        this.metricsFile = prometheusMetricsFile
        this.router = new express.Router()

        this.router.route('/metrics/').get(this._get.bind(this))

        Webserver.middleware.add(this)
    }

    middleware() {
        return this.router
    }

    _get(req, res) {
        const metrics = path.join(__dirname, '..', '..', this.metricsFile)
        res.sendFile(metrics)
    }
}


module.exports = {
    Metrics
}