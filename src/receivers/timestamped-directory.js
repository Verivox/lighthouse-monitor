/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const path = require('path')

const { Directory } = require('./directory')


class TimestampedDirectory extends Directory {
    _target(dir, filename, config) {
        const startedAt = config.runStartedAt.replace(/[><:|?*]/g, '_')
        const now = path.join(dir, startedAt)
        return super._target(now, filename, config)
    }
}


module.exports = { TimestampedDirectory }
