/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const chai = require('chai')
const expect = chai.expect
const prom = require('prom-client')

const { Prometheus, PrometheusReport } = require('./prometheus')
const reportFixture = require('../test-fixtures/report.json')

chai.use(require('chai-fs'))


describe('Prometheus', function() {
    beforeEach(() => {
        prom.register.clear()
        prom.register.resetMetrics()
    })

    afterEach(async () => {
        prom.register.clear()
        prom.register.resetMetrics()
    })

    it('adds a single metric when receiving a report', async () => {
        const p = new Prometheus()
        await p.receive(reportFixture, {url: 'https://kumbier.it'})

        const metric = prom.register.getSingleMetricAsString('performance:first_meaningful_paint:score')
        expect(metric).to.contain('performance:first_meaningful_paint:score')
        expect(metric).to.contain('url="https://kumbier.it"')
    })
})


describe ('PrometheusReport', function() {
    it('only contains valid prometheus metric keys', function() {
        const report = new PrometheusReport(reportFixture, {url: 'https://kumbier.it'})
        for (const key in report) {
            expect(key).to.match(/^[a-zA-Z_:]([a-zA-Z0-9_:])*$/)
        }
    })
})