/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const crypto = require('crypto')
const debug = require('debug')
const { readFileSync, existsSync, unlinkSync } = require('fs-extra')
const path = require('path')
const zlib = require('zlib')


class Report {
    constructor({ url, name, preset, date, path }) {
        if (!url || !name || !preset || !date || !path) {
            throw Error('Missing required option in configuration object - required: { url, name, preset, date, path }, given: ' + JSON.stringify(arguments[0], null, 2))
        }

        const options = {
            url,
            name,
            preset,
            date,
            path
        }
        const id = this._calculateId(options)
        Object.assign(this, options, { id })
    }

    static fromMeta({ url, name, preset, runStartedAt, reportsDir }) {
        if (!url || !name || !preset || !runStartedAt || !reportsDir) {
            throw Error('Missing required option in configuration object - required: { url, name, preset, runStartedAt, reportsDir }, given: ' + JSON.stringify(arguments[0], null, 2))
        }

        return new Report({
            url,
            name,
            preset,
            date: runStartedAt,
            path: path.join(reportsDir, runStartedAt.replace(/[><:|?*]/g, '_'))
        })
    }

    static fromFile(dir, configFile) {
        const content = readFileSync(path.join(dir, configFile))
        const config = JSON.parse(zlib.gunzipSync(content))
        config.reportsDir = path.dirname(dir)
        return Report.fromMeta(config)
    }

    _calculateId(options) {
        const hash = crypto.createHash('md5')
        hash.update(JSON.stringify(options))
        return hash.digest('hex')
    }

    get html() {
        return this._getTarget('report.html')
    }

    get artifacts() {
        return this._getTarget('artifacts.json')
    }

    get json() {
        return this._getTarget('report.json')
    }

    get config() {
        return this._getTarget('config.json')
    }

    _getTarget(type) {
        let target = path.join(this.path, `${this.name}_${this.preset}_${type}`)
        target = existsSync(target + '.gz') ? target + '.gz' : target

        if (!existsSync(target)) {
            return null
        }

        return target
    }

    withoutInternals() {
        const secured = Object.assign({}, this)
        delete secured.path
        return secured
    }

    delete() {
        [
            this._getTarget('report.html'),
            this._getTarget('artifacts.json'),
            this._getTarget('report.json'),
            this._getTarget('config.json')
        ]
            .filter(file => !!file)
            .map(file => {
                try {
                    unlinkSync(file)
                } catch (e) {
                    debug('LIGHTMON:WARN')(`Could not delete file - error on ${file} was ${e}`)
                }
            })
    }
}

module.exports = {
    Report
}
