/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const { Lighthouse } = require('./lighthouse')
const debug = require('debug')

async function run(options, receivers) {
    const lighthouse = new Lighthouse(options)
    await lighthouse.reportTo(receivers)
}

async function evaluate(config) {
    const runStartedAt = new Date().toISOString()

    for (const target of config.targets) {
        debug('LIGHTMON:INFO')(`Working on ${target.name}: ${target.url}`)
        for (const preset of Object.values(config.presets)) {
            debug('LIGHTMON:INFO')(`+ Running preset ${preset.preset}`)
            const options = Object.assign({}, preset, target)
            options.runStartedAt = runStartedAt
            await run(options, config.receivers)
        }
    }

    for (const receiver of config.receivers) {
        if (typeof receiver.afterEvaluation === 'function') {
            await receiver.afterEvaluation()
        }
    }
}

module.exports = {
    default: evaluate,
    evaluate,
}

