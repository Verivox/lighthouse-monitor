/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const chai = require('chai')
const expect = chai.expect
const fs = require('fs-extra')
const join = require('path').join
const prom = require('prom-client')
const tmpdir = require('os').tmpdir

const { FilePrometheus } = require('./file-prometheus')
const reportFixture = require('../test-fixtures/report.json')

chai.use(require('chai-fs'))


describe('FilePrometheus', function() {
    beforeEach(() => {
        prom.register.clear()
        prom.register.resetMetrics()
        this._baseDir = fs.mkdtempSync(join(tmpdir(), 'mocha-'))
        this._target = join(this._baseDir, 'metrics')
    })

    afterEach(async () => {
        prom.register.clear()
        prom.register.resetMetrics()
        await fs.remove(this._baseDir)
    })

    it('adds new metrics over time', async () => {
        const p = new FilePrometheus(this._target)
        await p.receive(reportFixture, {url: 'https://kumbier.it'})
        await p.afterEvaluation()

        expect(this._target).to.be.a.file()
        expect(this._target).with.contents.that.match(/url="https:\/\/kumbier.it"/)
        expect(this._target).not.with.contents.that.match(/url="https:\/\/example.com"/)

        await p.receive(reportFixture, {url: 'https://example.com'})
        await p.afterEvaluation()
        expect(this._target).with.contents.that.match(/url="https:\/\/kumbier.it"/)
        expect(this._target).with.contents.that.match(/url="https:\/\/example.com"/)
    })
})
