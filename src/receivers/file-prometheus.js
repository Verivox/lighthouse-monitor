/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const { Prometheus } = require('./prometheus')

const fs = require('fs-extra')
const prom = require('prom-client')


class FilePrometheus extends Prometheus {
    constructor(filename) {
        super()

        if (!filename) {
            throw new Error('Prometheus requires a filename to save metrics to')
        }

        this.filename = filename
    }

    async receive(report, config) {
        super.receive(report, config)
    }

    async afterEvaluation() {
        await fs.ensureFile(this.filename)
        await fs.writeFile(this.filename, prom.register.metrics())
    }
}


module.exports = {
    FilePrometheus,
}