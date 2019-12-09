/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const winston = require('winston')
const { Lighthouse } = require('./lighthouse')

async function run(options, receivers) {
    const lighthouse = new Lighthouse(options)
    await lighthouse.reportTo(receivers)
}

async function evaluate(config) {
    const runStartedAt = new Date().toISOString()

    for (const target of config.targets) {
        winston.info(`Working on ${target.name}: ${target.url}`)
        for (const preset of Object.values(config.presets)) {
            winston.info(`+ Running preset ${preset.preset}`)
            const options = Object.assign({}, preset, target)
            options.runStartedAt = runStartedAt
            await run(options, config.receivers)
        }
    }
}

module.exports = {
    default: evaluate,
    evaluate,
}

