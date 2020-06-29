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
const fs = require('fs-extra')
const tmpdir = require('os').tmpdir

const { TimestampedDirectory } = require('./timestamped-directory')

const reportFixture = require('../test-fixtures/report.json')


describe('TimestampedDirectory', function() {
    this.beforeEach(() => {
        this._baseDir = fs.mkdtempSync(pathjoin(tmpdir(), 'mocha-'))
    })

    it('creates the directory, if it does not exist and saves report', async () => {
        const dir = new TimestampedDirectory(this._baseDir)
        const config = {url: 'https://kumbier.it', runStartedAt: new Date().toISOString()}
        const reportFile = await dir._target(this._baseDir, 'report.json.gz', config)

        await dir.receive(reportFixture, config)

        expect(file(reportFile)).to.exist
    })

    it('does not contain invalid windows filesystem characters', async () => {
        const dir = new TimestampedDirectory(this._baseDir)
        const config = {url: 'https://kumbier.it', runStartedAt: new Date().toISOString()}
        let reportFile = await dir._target(this._baseDir, 'report.json.gz', config)

        // through away drive letter for windows as it contains colon
        if (process.platform === 'win32') {
            reportFile = reportFile.substr(reportFile.indexOf('\\'));
        }

        expect(reportFile).not.to.match(/[><:|?*]/)
    })

    afterEach(async () => {
        await fs.remove(this._baseDir)
    })
})
