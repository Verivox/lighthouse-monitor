/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const fs = require('fs-extra')
const { LighthouseReport } = require('../lighthouse')


class JsonMetrics {
    constructor(target=`${__dirname}/../../public/metrics.json`) {
        this._target = target
        this._reports = []
    }

    async receive(report, config) {
        this._reports.push(new LighthouseReport(report, config))
    }

    async afterEvaluation() {
        const payload = {
            timestamp: new Date().toISOString(),
            reports: this._reports.map(report => {
                return {
                    url: report.meta().url,
                    profile: report.meta().profile,
                    metrics: report.metrics()
                }
            })
        }

        await fs.ensureFile(this._target)
        await fs.writeFile(this._target, JSON.stringify(payload, null, 2))
    }
}

module.exports = { JsonMetrics }