/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const fs = require('fs-extra')
const { dirname, join, resolve } = require('path')
const tmpdir = require('os').tmpdir
const chai = require('chai')
chai.use(require('chai-fs'))
const expect = chai.expect

const { Reports } = require('./reports')

const dirFixture = resolve(__dirname, './test-fixtures/reports/store')
const anotherReportDir = join(dirFixture, '..', 'other',  '2018-08-03T09:20:00.059Z')


describe('Reports', function () {
    this.beforeEach(async function () {
        this._baseDir = fs.mkdtempSync(join(tmpdir(), 'mocha-'))
        fs.copySync(dirFixture, this._baseDir)
        this.reports = await Reports.setup(this._baseDir)
    })


    this.afterEach(function () {
        try {
            fs.removeSync(this._baseDir)
        } catch (e) {}  // eslint-disable-line no-empty
    })


    it('can list the existing reports', async function () {
        expect(this.reports.all().length).to.equal(7)
    })


    it('is notified on new reports', function (done) {
        Reports.setup(this._baseDir).then(reports => {
            const before = reports.all().length

            fs.copySync(dirname(anotherReportDir), this._baseDir)

            setTimeout(() => {
                expect(reports.all().length).to.equal(before + 4)
                done()
            }, 50)
        })
    })


    it('can get a report with a specific id', async function() {
        const validId = this.reports.all()[0].id
        const retrieved = this.reports.single(validId)
        expect(retrieved.id).to.equal(validId)
    })


    it('returns results older than', async function() {
        let retrieved = this.reports.olderThan(new Date('2018-08-04'))
        expect(retrieved.length).to.equal(7)

        retrieved = this.reports.olderThan(new Date('2018-08-03'))
        expect(retrieved.length).to.equal(3)

        retrieved = this.reports.olderThan(new Date('2018-08-02'))
        expect(retrieved.length).to.equal(0)

        retrieved = this.reports.olderThan(new Date('2018-08-01'))
        expect(retrieved.length).to.equal(0)
    })


    it('deletes report with all associated files', async function() {
        const before = this.reports.all().length
        const someReport = this.reports.all()[0]

        this.reports.delete(someReport)

        expect(before - 1).to.equal(this.reports.all().length)
        expect(this.reports.single(someReport.id)).to.be.undefined
    })
})