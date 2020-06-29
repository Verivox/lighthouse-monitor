/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const chai = require('chai')
const expect = chai.expect
const chaiFiles = require('chai-files')
chai.use(chaiFiles)
const file = chaiFiles.file
const pathjoin = require('path').join
const rm = require('rimraf')
const fs = require('fs')
const tmpdir = require('os').tmpdir

const { Directory } = require('./directory')

const reportFixture = require('../test-fixtures/report.json')


describe('Directory', function() {
    this.beforeEach(() => {
        this._baseDir = fs.mkdtempSync(pathjoin(tmpdir(), 'mocha-'))
        this._target = pathjoin(this._baseDir, 'DirectoryReceiverTest')
    })

    it('creates the directory, if it does not exist and saves all run-data', async () => {
        const dir = new Directory(this._target)
        await dir.receive(reportFixture, {url: 'https://kumbier.it'})

        const reportFile = pathjoin(this._target, 'report.json.gz')
        expect(file(reportFile)).to.exist
        expect(file(reportFile)).not.to.be.empty

        const artifactFile = pathjoin(this._target, 'artifacts.json.gz')
        expect(file(artifactFile)).to.exist
        expect(file(artifactFile)).not.to.be.empty

        const configFile = pathjoin(this._target, 'config.json.gz')
        expect(file(configFile)).to.exist
        expect(file(configFile)).not.to.be.empty
    })

    it('prefixes the filename optionally', async () => {
        const dir = new Directory(this._target)
        await dir.receive(reportFixture, {name: 'kits', preset: '3G'})
        const expected = pathjoin(this._target, 'kits_3G_report.json.gz')
        expect(file(expected)).to.exist
        const notExpected = pathjoin(this._target, 'report.json.gz')
        expect(file(notExpected)).not.to.exist
    })

    afterEach(() => {
        rm.sync(this._baseDir)
    })
})