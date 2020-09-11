/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const express = require('express')


class Healthz {
    constructor({ Webserver, reports, expectedLastReportInSec }) {
        this.router = new express.Router()
        Webserver.middleware.add(this)
        this._expectedLast = !expectedLastReportInSec ? null : expectedLastReportInSec * 1000
        this._reports = reports
    }

    middleware() {
        this.router.route('/healthz').get(this._check.bind(this))
        return this.router
    }

    _check(req, res) {
        if (!this._expectedLast) {
            return res.status(400).send(JSON.stringify({'status':'expectedLastReportInSec not configured, no status available'}, null, 2))
        }
        const from = (new Date(Date.now() - this._expectedLast)).toISOString()
        const results = this._reports.youngerThan(from)
        if (results.length > 0) {
            return res.send(JSON.stringify({'status':'ok'}, null, 2))
        }
        return res.status(500).send(JSON.stringify({'status':'missing reports'}, null, 2))
    }
}


module.exports = {
    Healthz
}
