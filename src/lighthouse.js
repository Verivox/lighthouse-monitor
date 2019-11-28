const debug = require('debug')

/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const lighthouseLib = require('lighthouse')
const puppeteer = require('puppeteer');

const DefaultOptions = {
    browserOptions: {
        args: ['--remote-debugging-port=0']
    }
}

class Lighthouse {
    constructor(options = DefaultOptions, _lighthouse = lighthouseLib) {
        this._options = options
        this._lighthouse = _lighthouse
    }

    async startChrome(options) {
        return await puppeteer.launch(options);
    }

    // this function evaluates a page and retries for x times
    async _evaluate(options, maxRetries=3) {
        let tries = 0
        let chrome

        do {
            try {
                tries++
                chrome = await this.startChrome(options.browserOptions)

                if (!chrome) {
                    throw new Error('Could not start Chrome')
                }

                // eslint-disable-next-line require-atomic-updates
                options.port = this.getDebugPort(chrome.wsEndpoint());
                if (options.prehook) {
                    await options.prehook.setup(chrome);
                }

                const result = await this._lighthouse(options.url, options)
                return result
            } catch (e) {
                debug('LIGHTMON:WARN')(`++ Error evaluating, try #${tries}/${maxRetries}: ${e}`)
            } finally {
                await chrome.close()
            }
        } while (tries < maxRetries)
    }

    getDebugPort(url) {
        const s1 = url.substr(url.lastIndexOf(':') + 1);
        return s1.substr(0, s1.indexOf('/'));
    }

    async result() {
        if (!this._result) {
            this._result = await this._evaluate(this._options)
        }
        return this._result
    }

    async reportTo(receivers) {
        const result = await this.result()
        receivers.forEach(async (receiver) => {
            await receiver.receive(result, this._options)
        })
    }
}


class PoppableMap extends Map {
    pop(key) {
        const value = this.get(key)
        this.delete(key)
        return value
    }
}

class LighthouseReport {
    constructor({ lhr }, config) {
        this._metrics = new PoppableMap()
        this._meta = {
            'url': config.url,
            'profile': config['preset'],
        }

        this.add('performance.first-contentful-paint.score', lhr.audits['first-contentful-paint'].score)
        this.add('performance.first-contentful-paint.value', lhr.audits['first-contentful-paint'].numericValue)

        this.add('performance.first-meaningful-paint.score', lhr.audits['first-meaningful-paint'].score)
        this.add('performance.first-meaningful-paint.value', lhr.audits['first-meaningful-paint'].numericValue)

        this.add('performance.speed-index.score', lhr.audits['speed-index'].score)
        this.add('performance.speed-index.value', lhr.audits['speed-index'].numericValue)

        this.add('performance.first-cpu-idle.score', lhr.audits['first-cpu-idle'].score)
        this.add('performance.first-cpu-idle.value', lhr.audits['first-cpu-idle'].numericValue)

        this.add('performance.interactive.score', lhr.audits['interactive'].score)
        this.add('performance.interactive.value', lhr.audits['interactive'].numericValue)

        this.add('performance.estimated-input-latency.score', lhr.audits['estimated-input-latency'].score)
        this.add('performance.estimated-input-latency.value', lhr.audits['estimated-input-latency'].numericValue)

        this.add('performance.time-to-first-byte.score', lhr.audits['time-to-first-byte'].score)
        this.add('performance.time-to-first-byte.value', lhr.audits['time-to-first-byte'].numericValue)

        this.add('performance.byte-weight.total.score', lhr.audits['total-byte-weight'].score)
        this.add('performance.byte-weight.total.value', lhr.audits['total-byte-weight'].numericValue)

        this.add('performance.longest-request-chain.duration', !lhr.audits['critical-request-chains'].error ? lhr.audits['critical-request-chains'].details.longestChain.duration : null)
        this.add('performance.longest-request-chain.length', !lhr.audits['critical-request-chains'].error ? lhr.audits['critical-request-chains'].details.longestChain.length : null)
        this.add('performance.mainthread-work-breakdown', lhr.audits['mainthread-work-breakdown'].numericValue)
        this.add('performance.bootup-time', lhr.audits['bootup-time'].numericValue)

        this.add('performance.dom-size.score', lhr.audits['dom-size'].score)
        this.add('performance.dom-size.value', lhr.audits['dom-size'].numericValue)

        this.add('performance.total.timing', lhr.timing.total)

        this.add('performance.total.score', lhr.categories['performance'].score)

        let totalBytes = []

        lhr.audits['network-requests'].details.items.forEach(resource => {
            const type = resource.resourceType // e.g. script, image, document, ...
            if (!totalBytes[type])
                totalBytes[type] = 0

            totalBytes[type] = totalBytes[type] + resource.transferSize
        })

        for (let key in totalBytes) {
            this.add('performance.byte-weight.' + key.toLowerCase(), totalBytes[key])
        }
    }

    // eslint-disable-next-line no-unused-vars
    add(key, value) {
        throw new Error('Please inherit this class, and override this method')
    }
}

module.exports = {
    Lighthouse,
    DefaultOptions,
    LighthouseReport
}