/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const expect = require('chai').expect

const { NewRelic } = require('./new-relic')
const reportFixture = require('../test-fixtures/report.json')

const InvalidCredentialsOptions = {
    apiKey: 'asldkfhgaslkdjfhaskldfhaklsdjfh',
    accountId: 123456
}


describe('NewRelic (Integration)', async function () {
    it('fails gracefully when invalid credentials are given', async () => {
        const newRelic = new NewRelic(InvalidCredentialsOptions)
        expect(async () => await newRelic.receive(reportFixture, {url: 'https://kumbier.it'})).to.not.throw()
    })
})