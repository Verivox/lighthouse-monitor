/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const { Report } = require('./report')

const fs = require('fs-extra')
const { dirname, join, resolve } = require('path')
const tmpdir = require('os').tmpdir
const chai = require('chai')
chai.use(require('chai-fs'))
const expect = chai.expect

const { Reports, ReportsCache } = require('./reports')

const dirFixture = resolve(__dirname, './test-fixtures/reports/store')
const anotherReportDir = join(dirFixture, '..', 'other',  '2018-08-03T09:20:00.059Z')


// FIXME: without a cache, the reports is unfilled at the beginning and should instead use
//        a truly non-cached version.
xdescribe('Reports', function () {
    this.beforeEach(async function () {
        this._baseDir = fs.mkdtempSync(join(tmpdir(), 'mocha-'))
        fs.copySync(dirFixture, this._baseDir)
        this.reports = await Reports.setup(this._baseDir, false)
    })


    this.afterEach(async () => {
        if (this.reports) {
            await this.reports.destroy()
        }
        try {
            fs.removeSync(this._baseDir)
        } catch (e) {}  // eslint-disable-line no-empty
    })


    it('can list the existing reports', async function () {
        expect(this.reports.all().length).to.equal(7)
    })


    it('is notified on new reports', function (done) {
        Reports.setup(this._baseDir, false).then(reports => {
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

describe('ReportsCache', function() {
    beforeEach(() => {
        this._cache = new ReportsCache(':memory:')
        this._someReport = new Report({ url: 'https://kumbier.it', name: 'KITS', preset: 'desktop-fast', date: '2020-08-28T15:56:12Z', path: '/path/2020-08-28T15_56_12Z' })
    })

    it('inserts and retrieves a report', () => {
        this._cache.upsert(this._someReport)
        let retrievedReport = this._cache.get(this._someReport.id)
        expect(this._someReport.id).to.equal(retrievedReport.id)
    })

    it('deletes a report', () => {
        this._cache.upsert(this._someReport)
        let retrievedReport = this._cache.get(this._someReport.id)
        expect(retrievedReport).not.to.be.undefined

        this._cache.delete(this._someReport)

        expect(this._cache.get(this._someReport.id)).to.be.undefined
    })

    it('ignores already existing reports', () => {
        this._cache.upsert(this._someReport)
        this._cache.upsert(this._someReport)

        let retrievedReports = this._cache.all()

        expect(retrievedReports.length).to.equal(1)
    })

    it('retrieves all reports', () => {
        this._cache.upsert(this._someReport)
        const anotherReport = new Report({ url: 'https://kumbier.it', name: 'KITS', preset: 'desktop-fast', date: '2020-08-28T16:01:00Z', path: '/path/2020-08-28T16_01_00Z' })
        this._cache.upsert(anotherReport)

        let retrievedIds = this._cache.all().map(report => report.id).sort()

        expect(retrievedIds).to.deep.equal([anotherReport.id, this._someReport.id].sort())
    })

    it('retrieves outdated reports', () => {
        const anotherReport = new Report({ url: 'https://kumbier.it', name: 'KITS', preset: 'desktop-fast', date: '2020-08-28T16:01:00Z', path: '/path/2020-08-28T16_01_00Z' })
        this._cache.updateCurrentLastseen('2020-09-01T00:00:00.000Z')
        this._cache.upsert(this._someReport)
        this._cache.updateCurrentLastseen('2020-09-01T01:00:00.000Z')
        this._cache.upsert(anotherReport)

        let retrievedIds = this._cache.outdated().map(report => report.id)

        expect(retrievedIds).to.deep.equal([this._someReport.id])
    })
})