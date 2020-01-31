/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const { LighthouseReport } = require('../lighthouse')

const prom = require('prom-client')


class Prometheus {
    async receive(report, config) {
        new PrometheusReport(report, config).save()
    }
}


class PrometheusReport extends LighthouseReport {
    add(key, value) {
        const newKey = key.replace(/\./g, ':').replace(/-/g, '_')
        this._metrics.set(newKey, new Metric(this._meta, newKey, value))
    }

    save() {
        for (const metric of this._metrics.values()) {
            metric.save()
        }
    }
}


class Metric {
    constructor(labels, name, value) {
        this.name = name
        this.labels = labels
        this.labelNames = Object.keys(labels)
        this.value = value || 0

        this.help = this.name
    }

    save() {
        let metric = prom.register.getSingleMetric(this.name)

        if (!metric) {
            metric = new prom.Gauge(this)
            prom.register.registerMetric(metric)
        }

        metric.set(this.labels, this.value)
    }
}


module.exports = {
    Prometheus,
    PrometheusReport,
}