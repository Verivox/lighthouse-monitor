/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const express = require('express')
const path = require('path')


class Metrics {
    constructor({ Webserver, prometheusMetricsFile, jsonMetricsFile }) {
        this._prometheusFile = prometheusMetricsFile
        this._jsonFile = jsonMetricsFile
        this.router = new express.Router()

        this.router.route('/metrics/').get(this._prometheusFormat.bind(this))
        this.router.route('/metrics.json').get(this._jsonFormat.bind(this))

        Webserver.middleware.add(this)
    }

    middleware() {
        return this.router
    }

    _prometheusFormat(req, res) {
        const metrics = path.join(__dirname, '..', '..', this._prometheusFile)
        res.sendFile(metrics)
    }

    _jsonFormat(req, res) {
        res.sendFile(path.join(__dirname, '..', '..', this._jsonFile))
    }
}


module.exports = {
    Metrics
}