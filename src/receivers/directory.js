/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const zlib = require('zlib')
const fs = require('fs-extra')
const path = require('path')
const os = require('os')
const debug = require('debug')

class Directory {
    constructor(directory) {
        if (!directory) {
            directory = os.tmpdir()
            debug(`Reports will be saved to ${directory}`)
        }
        this._directory = directory
    }

    async receive(report, config) {
        this._saveJson(await this._target(this._directory, 'config.json', config), config)
        this._saveJson(await this._target(this._directory, 'report.json', config), report.lhr)

        if (report.artifacts) {
            this._saveJson(await this._target(this._directory, 'artifacts.json', config), report.artifacts)
        }

        if (config.output instanceof Array && config.output.some(item => item === 'html')) {
            const i = config.output.findIndex(item => item === 'html')
            const target = await this._target(this._directory, 'report.html', config)
            const content = report.report[i]
            this._save(target, content)
        }
    }

    async _target(dir, filename, config={}) {
        await fs.ensureDir(dir)
        const parts = []

        if (config.name) {
            parts.push(config.name)
        }

        if (config.preset) {
            parts.push(config.preset)
        }

        parts.push(filename)

        const targetfile = parts.join('_')
        return path.join(dir, targetfile)
    }

    _saveJson(target, data) {
        this._save(target, JSON.stringify(data, null, 2))
    }

    _save(target, content) {
        const compressed = zlib.gzipSync(content)
        fs.writeFileSync(target + '.gz', compressed)
    }
}

module.exports = { Directory }