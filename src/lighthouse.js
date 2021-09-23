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

    _checkForDeprecatedOptions(options) {
        if (typeof options.chromeFlags !== 'undefined') {
            debug('LIGHTMON:WARN')('You are using a deprecated config option (chromeFlags) - it is ignored from ' +
                'version 2.0.0. Please check the CHANGELOG.md on the migration process.')
        }
    }

    // this function evaluates a page and retries for x times
    async _evaluate(options, maxRetries=3) {
        this._checkForDeprecatedOptions(options)

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

                return await this._lighthouse(options.url, options)
            } catch (e) {
                debug('LIGHTMON:WARN')(`++ Error evaluating, retry #${tries}/${maxRetries}: ${e}`)
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
        for (const receiver of receivers) {
            await receiver.receive(result, this._options)
        }
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

        this.add('performance.largest-contentful-paint.score', lhr.audits['largest-contentful-paint'].score)
        this.add('performance.largest-contentful-paint.value', lhr.audits['largest-contentful-paint'].numericValue)

        this.add('performance.first-meaningful-paint.score', lhr.audits['first-meaningful-paint'].score)
        this.add('performance.first-meaningful-paint.value', lhr.audits['first-meaningful-paint'].numericValue)

        this.add('performance.speed-index.score', lhr.audits['speed-index'].score)
        this.add('performance.speed-index.value', lhr.audits['speed-index'].numericValue)

        this.add('performance.total-blocking-time.score', lhr.audits['total-blocking-time'].score)
        this.add('performance.total-blocking-time.value', lhr.audits['total-blocking-time'].numericValue)

        this.add('performance.cumulative-layout-shift.score', lhr.audits['cumulative-layout-shift'].score)
        this.add('performance.cumulative-layout-shift.value', lhr.audits['cumulative-layout-shift'].numericValue)

        this.add('performance.first-cpu-idle.score', 0)
        this.add('performance.first-cpu-idle.value', 0)

        this.add('performance.interactive.score', lhr.audits['interactive'].score)
        this.add('performance.interactive.value', lhr.audits['interactive'].numericValue)

        this.add('performance.estimated-input-latency.score', 0)
        this.add('performance.estimated-input-latency.value', 0)

        this.add('performance.byte-weight.total.score', lhr.audits['total-byte-weight'].score)
        this.add('performance.byte-weight.total.value', lhr.audits['total-byte-weight'].numericValue)

        this.add('performance.longest-request-chain.duration', lhr.audits['critical-request-chains'].details ? lhr.audits['critical-request-chains'].details.longestChain.duration : null)
        this.add('performance.longest-request-chain.length', lhr.audits['critical-request-chains'].details ? lhr.audits['critical-request-chains'].details.longestChain.length : null)
        this.add('performance.mainthread-work-breakdown', lhr.audits['mainthread-work-breakdown'].numericValue)
        this.add('performance.bootup-time', lhr.audits['bootup-time'].numericValue)

        this.add('performance.dom-size.score', lhr.audits['dom-size'].score)
        this.add('performance.dom-size.value', lhr.audits['dom-size'].numericValue)

        this.add('performance.total.timing', lhr.timing.total)

        this.add('performance.total.score', lhr.categories['performance'].score)

        let totalBytes = []

        if (lhr.audits['network-requests'].details) {
            lhr.audits['network-requests'].details.items.forEach(resource => {
                const type = resource.resourceType // e.g. script, image, document, ...
                if (!totalBytes[type])
                    totalBytes[type] = 0

                totalBytes[type] = totalBytes[type] + resource.transferSize
            })
        }

        for (let key in totalBytes) {
            this.add('performance.byte-weight.' + key.toLowerCase(), totalBytes[key])
        }
    }

    add(key, value) {
        this._metrics.set(key, value)
    }

    metrics() {
        let obj = {}
        for (let [k,v] of this._metrics) {
            obj[k] = v
        }
        return obj
    }

    meta() {
        return this._meta
    }
}

module.exports = {
    Lighthouse,
    DefaultOptions,
    LighthouseReport
}