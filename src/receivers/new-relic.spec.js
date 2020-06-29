/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const expect = require('chai').expect

const { NewRelic, NewRelicOptions } = require('./new-relic')
const reportFixture = require('../test-fixtures/report.json')

const NewRelicOptionsValid = {
    apiKey: 'some-secret-key',
    accountId: 12345,
    apiUrl: undefined,
}


describe('NewRelic', function() {
    it('instantiates a NewRelic Instance from string', () => {
        expect(() => new NewRelic(NewRelicOptionsValid)).not.to.throw()
        const invalidOptions = Object.assign({}, NewRelicOptionsValid, {accountId: undefined})
        expect(() => new NewRelic(invalidOptions)).to.throw()
    })

    it('extracts audit data from lighthouse report', () => {
        const sus = new NewRelic(NewRelicOptionsValid)
        const transformed = sus._transform(reportFixture, {url: 'https://kumbier.it'})
        expect(Object.keys(transformed).length).to.be.greaterThan(10)
    })

    it('extracts byte-weights from lighthouse report', () => {
        const sus = new NewRelic(NewRelicOptionsValid)
        const transformed = sus._transform(reportFixture, {url: 'https://kumbier.it'})
        expect(transformed['performance.byte-weight.document']).to.exist
        expect(transformed['performance.byte-weight.image']).to.exist
        expect(transformed['performance.byte-weight.font']).to.exist
        expect(transformed['performance.byte-weight.other']).to.exist
        expect(transformed['performance.byte-weight.script']).to.exist
        expect(transformed['performance.byte-weight.stylesheet']).to.exist
    })

    describe('NewRelicOptions', function () {
        it('can instantiate a NewRelicOptions instance', () => {
            expect(() => new NewRelicOptions(NewRelicOptionsValid)).not.to.throw()
        })

        it('throws when missing data is given', () => {
            const missingAccount = Object.assign({}, NewRelicOptionsValid, {accountId: undefined})
            expect(() => new NewRelicOptions(missingAccount)).to.throw()

            const missingApiKey = Object.assign({}, NewRelicOptionsValid, {apiKey: undefined})
            expect(() => new NewRelicOptions(missingApiKey)).to.throw()
        })
    })
})