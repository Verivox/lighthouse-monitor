/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const debug = require('debug')
const request = require('request-promise-native')
const { LighthouseReport } = require('../lighthouse')

class NewRelic {
    constructor(options) {
        this._config = (options instanceof NewRelicOptions) ? options : new NewRelicOptions(options)
    }

    async receive(report, runConfig) {
        const requestBody = [this._transform(report, runConfig)]

        const requestOptions = {
            method: 'POST',
            uri: this._config.apiUrl,
            headers: {
                'X-Insert-Key': this._config.apiKey
            },
            body: requestBody,
            json: true
        }

        try {
            await request(requestOptions)
        } catch(e) {
            debug('LIGHTMON:WARN')('Could not send report to NewRelic - error was:', e.toString())
        }
    }

    _transform(report, config) {
        const flattened = new NewRelicReport(report, config)
        flattened.add('eventType', 'PerformanceMonitoring')
        const obj = {}
        for (const [key, report] of flattened._metrics) {
            obj[key] = report
        }
        return obj
    }
}


class NewRelicOptions {
    constructor(options) {
        if (!options.accountId) {
            throw Error('Missing required option: accountId')
        }

        if (!options.apiKey) {
            throw Error('Missing required option: apiKey')
        }

        this.apiKey = options.apiKey
        this.apiUrl = options.apiUrl || `https://insights-collector.newrelic.com/v1/accounts/${options.accountId}/events`
    }
}

class NewRelicReport extends LighthouseReport {
    constructor(report, config) {
        super(report, config)

        this._flattenMetaToMetrics()
    }

    // for newrelic, meta data is just another metric in the list.
    _flattenMetaToMetrics() {
        for(const key of Object.keys(this._meta)) {
            this.add(key, this._meta[key])
        }
    }

    add(key, value) {
        this._metrics.set(key, value)
    }
}

module.exports = {
    NewRelic,
    NewRelicOptions,
    NewRelicReport,
}