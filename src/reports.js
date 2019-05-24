/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const chokidar = require('chokidar')
const path = require('path')
const fs = require('fs-extra')

const { Report } = require('./report')


class Reports {
    constructor(baseDir, setupWatcher = true) {
        this._baseDir = baseDir
        fs.ensureDirSync(baseDir)
        this._reports = new Map()
        if (setupWatcher) {
            this._setupWatcher()
        }
    }

    static async setup(baseDir) {
        const reports = new Reports(baseDir, false)
        await reports._setupWatcher(baseDir)
        return reports
    }

    _setupWatcher(dir = this._baseDir) {
        return new Promise(async (resolve, reject) => {
            const watchOptions = {
                ignoreInitial: false,
                persistent: false
            }

            this._watcher = chokidar.watch(dir, watchOptions)
                .on('add', (changed) => {
                    if (!changed.endsWith('_config.json.gz')) {
                        return
                    }
                    const filename = path.basename(changed)
                    const filedir = path.dirname(changed)
                    this._addFromConfigFile(filedir, filename)
                }).on('ready', () => {
                    resolve()
                }).on('error', err => {
                    reject(err)
                })
        })
    }

    _addFromConfig(config) {
        const meta = Report.fromMeta(config)
        this._reports.set(meta.id, meta)
    }

    _addFromConfigFile(dir, configFile) {
        const meta = Report.fromFile(dir, configFile)
        this._reports.set(meta.id, meta)
    }

    single(id) {
        return this._reports.get(id)
    }

    all() {
        return Array.from(this._reports.values())
    }

    /**
     * Removes disk location of reports to mitigate information leakage
     */
    withoutInternals() {
        return this.all().map(r => r.withoutInternals())
    }

    olderThan(date) {
        return this.all().filter(report => {
            return new Date(report.date) < date
        })
    }

    delete(report) {
        report.delete()
        this._reports.delete(report.id)
    }

    get baseDir() {
        return this._baseDir
    }
}


module.exports = {
    Reports
}