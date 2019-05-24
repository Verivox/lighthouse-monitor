/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const config = require('../../config/default')
const express = require('express')
const { Reports } = require('../reports')
const mime = require('mime/lite')

const mapToObj = m => {
    return Array.from(m).reduce((obj, [key, value]) => {
        obj[key] = value
        return obj
    }, {})
}

class HtmlReport {
    constructor({ Webserver }) {
        this.router = new express.Router()
        this.reports = new Reports(config.reportDir)
        Webserver.middleware.add(this)
    }

    middleware() {
        this.router.route('/report').get(this._all.bind(this))
        this.router.route('/report/url').get(this._url.bind(this))
        this.router.route('/report/url/:url/').get(this._profileByUrl.bind(this))
        this.router.route('/report/url/:url/:profile/').get(this._reportByUrlAndPreset.bind(this))
        this.router.route('/report/url/:url/:profile/:timestamp').get(this._reportByUrlPresetTimestamp.bind(this))
        this.router.route('/report/:id').get(this._get.bind(this))
        this.router.route('/report/:id/artifacts').get(this._getArtifact.bind(this))
        this.router.route('/report/:id/html').get(this._getHtml.bind(this))
        this.router.route('/report/:id/download').get(this._download.bind(this))
        this.router.route('/report/:id/json').get(this._getJson.bind(this))
        this.router.route('/report/:id/config').get(this._getConfig.bind(this))
        return this.router
    }

    _all(req, res) {
        const reportMonsterObj = {}
        for (let report of this.reports.withoutInternals()) {
            reportMonsterObj[report.id] = report
        }
        const json = JSON.stringify(reportMonsterObj, null, 2)
        return res.send(json)
    }

    _url(req, res) {
        return res.send(
            this.reports
                .withoutInternals()
                .map(report => report.url)
                .filter((url, i, self) => self.indexOf(url) === i)
                .sort()
        )
    }

    _profileByUrl(req, res) {
        return res.send(
            this.reports
                .withoutInternals()
                .filter(report => report.url === req.params.url)
                .map(report => report.preset)
                .filter((preset, i, self) => self.indexOf(preset) === i)
                .sort()
        )
    }

    _reportByUrlAndPreset(req, res) {
        return res.send(
            mapToObj(
                new Map(
                    this.reports
                        .withoutInternals()
                        .filter(report => report.url === req.params.url)
                        .filter(report => report.preset === req.params.profile)
                        .map(report => [report.date, report.id])
                )
            )
        )
    }

    _reportByUrlPresetTimestamp(req, res) {
        return res.send(
            this.reports
                .withoutInternals()
                .filter(report => report.url === req.params.url)
                .filter(report => report.preset === req.params.profile)
                .filter(report => report.date === req.params.timestamp)[0]
        )
    }

    _get(req, res) {
        const id = req.params.id
        const report = this.reports.single(id)

        return (!report) ?
            res.status(404).send('Resource not found') :
            res.type('json')
                .send(report.withoutInternals())
    }

    _getHtml(req, res) {
        return this.__getFile(req, res, 'html')
    }

    _download(req, res) {
        res.set('Content-disposition', 'attachment; filename=report.html')
        return this.__getFile(req, res, 'html')
    }

    _getArtifact(req, res) {
        res.set('Content-disposition', 'attachment; filename=artifact.json')
        return this.__getFile(req, res, 'artifacts')
    }

    _getJson(req, res) {
        res.set('Content-disposition', 'attachment; filename=report.json')
        return this.__getFile(req, res, 'json')
    }

    _getConfig(req, res) {
        res.set('Content-disposition', 'attachment; filename=config.json')
        return this.__getFile(req, res, 'config')
    }

    __getFile(req, res, type) {
        const id = req.params.id
        const report = this.reports.single(id)

        if (!report || !report[type]) {
            return res.status(404).send('Resource not found')
        }

        if (report[type].endsWith('.gz')) {
            res.set('Content-Encoding', 'gzip')
            res.set('Content-Type', this._getType(report[type]))
        }

        return res.sendFile(report[type])
    }

    _getType(filename) {
        const fileWithoutGz = filename.endsWith('.gz') ? filename.substr(0, filename.length - 3) : filename
        const ext = fileWithoutGz.substr(fileWithoutGz.lastIndexOf('.') + 1)
        return mime.getType(ext)
    }
}


module.exports = {
    HtmlReport
}
