/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const { Lighthouse, DefaultOptions } = require('./lighthouse')

const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
chai.use(sinonChai)

const report = require('./test-fixtures/report.json')


describe('Lighthouse', function() {
    it('sends a report with config to receivers', async function() {
        const spy1 = sinon.spy()
        const receiver1 = { receive: spy1 }
        const spy2 = sinon.spy()
        const receiver2 = { receive: spy2 }
        const config = Object.assign({}, DefaultOptions, {url: 'https://kumbier.it'})
        const lighthouse = new Lighthouse(config)
        sinon.stub(lighthouse, 'result').returns(new Promise((resolve) => resolve(report)))

        await lighthouse.reportTo([receiver1, receiver2])

        expect(spy1.called).to.equal(true)
        expect(spy2.called).to.equal(true)
        expect(spy1).to.have.been.calledWith(report, config)
        expect(spy2).to.have.been.calledWith(report, config)
    })

    it('calls a defined prehook before evaluating', async () => {
        const setup = sinon.spy();
        const prehook = { setup };
        const evaluation = sinon.spy()
        const sut = new Lighthouse({}, evaluation)

        await sut._evaluate({prehook: prehook})

        expect(setup).to.have.been.calledBefore(evaluation)
    })
})