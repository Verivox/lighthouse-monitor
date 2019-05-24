/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const prom = require('prom-client')
const expect = require('chai').expect


describe('PromClient', function () {
    beforeEach(() => {
        prom.register.clear()
        prom.register.resetMetrics()
    })

    afterEach(() => {
        prom.register.clear()
        prom.register.resetMetrics()
        prom.collectDefaultMetrics({timeout: 5000})
    })

    it('deactivates default metrics if asked to', function () {
        clearInterval(prom.collectDefaultMetrics())
        prom.register.clear()
        expect(prom.register.metrics()).not.to.contain('process_')
    })

    it('has gauges that can increase and decrease', function () {
        const gauge = new prom.Gauge({ name: 'some_metric', help: 'A test gauge metric' })
        prom.register.registerMetric(gauge)
        gauge.set(10)
        expect(prom.register.metrics()).to.include('TYPE some_metric gauge')
        expect(prom.register.metrics()).to.include('HELP some_metric A test gauge metric')
        expect(prom.register.metrics()).to.include('some_metric 10')

        gauge.set(18)
        expect(prom.register.metrics()).to.include('some_metric 18')


        gauge.set(9)
        expect(prom.register.metrics()).to.include('some_metric 9')
    })

    it('metrics require name and help', function () {
        expect(() => new prom.Gauge({})).to.throw()
        expect(() => new prom.Gauge({ name: 'foo' })).to.throw()
        expect(() => new prom.Gauge({ help: 'foo' })).to.throw()
        expect(() => new prom.Gauge({ name: 'foo', help: 'foo' })).not.to.throw()
    })

    describe('Labels', function () {
        beforeEach(() => {
            prom.register.clear()
            prom.register.resetMetrics()

            this._gauge = new prom.Gauge({
                name: 'ttfb',
                help: 'Time to first byte',
                labelNames: [
                    'devicetype',
                    'speed',
                    'url'
                ]
            })

            prom.register.registerMetric(this._gauge)
        })

        it('values can still be set without labels', () => {
            this._gauge.set(10)
            expect(prom.register.metrics()).to.include('ttfb 10')
        })

        it('cannot set values with wrong labels', () => {
            expect(() => this._gauge.set({ 'non-existant-label': 'some-value' }, 100)).to.throw()
        })

        it('can set values with all registered labels given', () => {
            this._gauge.set({
                'devicetype': 'mobile',
                'speed': 'slow',
                'url': 'https://kumbier.it'
            }, 15)
            expect(prom.register.metrics()).to.include('ttfb')
            expect(prom.register.metrics()).to.include('devicetype="mobile"')
            expect(prom.register.metrics()).to.include('speed="slow"')
            expect(prom.register.metrics()).to.include('url="https://kumbier.it')
        })

        it('can set values with only a subset of the registered metrics', () => {
            this._gauge.set({
                'devicetype': 'mobile',
                'url': 'https://kumbier.it'
            }, 15)
            expect(prom.register.metrics()).to.include('ttfb')
            expect(prom.register.metrics()).to.include('devicetype="mobile"')
            expect(prom.register.metrics()).to.include('url="https://kumbier.it')
        })

        it('cannot instantiate a gauge with an existing name', () => {
            new prom.Gauge({name: 'g', help: 'g1'})
            expect(() => new prom.Gauge({name: 'g', help: 'g2'})).to.throw()
        })
    })
})