/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const chai = require('chai')
chai.use(require('chai-fs'))
const expect = chai.expect
const Moment = require('moment')
const fs = require('fs-extra')
const join = require('path').join
const tmpdir = require('os').tmpdir

const { Reports } = require('./reports')
const { ReportCleanup } = require('./report-cleanup')

const Fixture = `${__dirname}/test-fixtures/reports/store`
const dirWithoutContent = '2018-08-02T00_00_00.034Z'
const dirWithContent = '2018-08-02T14_10_57.975Z'



/**
 * make sure that a week starts on a sunday for these tests.
 */
Moment.locale('en')


function countBucketEntries(buckets) {
    return Array.from(buckets.values()).reduce((acc, cur) => acc.concat(cur), []).length
}


class MockReport {
    constructor({url, name, preset, date, path}) {
        this.url = url || 'https://kumbier.it'
        this.name = name || 'KITS'
        this.preset = preset || 'mobile-fast'
        this.date = date || '2018-07-15T23:12:05.023Z'
        this.path = path || '/tmp/reports'
    }
}


describe('ReportCleanup', function () {
    this.beforeEach(() => {
        this._baseDir = fs.mkdtempSync(join(tmpdir(), 'mocha-'))
        fs.copySync(Fixture, this._baseDir)
    })

    this.afterEach(() => {
        if (this.reports) {
            this.reports.destroy()
        }
        try {
            fs.removeSync(this._baseDir)
        } catch (e) {}  // eslint-disable-line no-empty
    })

    it('_keyGenWeekly() generates correct bucket keys', () => {
        const sut = new ReportCleanup({})
        const sunday = new MockReport({date: '2019-01-06T00:00:00.000Z'})
        const saturday = new MockReport({date: '2019-01-12T23:59:59.999Z'})
        const nextSunday = new MockReport({date: '2019-01-13T00:00:00.000Z'})

        expect(sut._keyGenWeekly(sunday)).to.equal(sut._keyGenWeekly(saturday))
        expect(sut._keyGenWeekly(saturday)).not.to.equal(sut._keyGenWeekly(nextSunday))
    })


    it('_keyGenDaily() generates correct bucket keys', () => {
        const sut = new ReportCleanup({})
        const saturdayStart = new MockReport({date: '2019-01-12T00:00:00.000Z'})
        const saturdayEnd = new MockReport({date: '2019-01-12T23:59:59.999Z'})
        const sunday = new MockReport({date: '2019-01-13T00:00:00.000Z'})

        expect(sut._keyGenWeekly(saturdayStart)).to.equal(sut._keyGenWeekly(saturdayEnd))
        expect(sut._keyGenWeekly(saturdayEnd)).not.to.equal(sut._keyGenWeekly(sunday))
    })

    describe('bucketize()', () => {
        it('puts reports of same name and same preset into daily buckets', () => {
            const sut = new ReportCleanup({})
            const reports = [
                new MockReport({date: '2019-01-12T00:00:00.000Z'}),
                new MockReport({date: '2019-01-12T23:59:59.999Z'}),
                new MockReport({date: '2019-01-13T00:00:00.000Z'})
            ]
            const buckets = sut.bucketize(reports, sut._keyGenDaily)
            expect(buckets.size).to.equal(2)
            expect(countBucketEntries(buckets)).to.equal(reports.length)
        })

        it('puts reports of same name and different presets into daily buckets', () => {
            const sut = new ReportCleanup({})
            const reports = [
                new MockReport({date: '2019-01-12T00:00:00.000Z', preset: 'fast'}),
                new MockReport({date: '2019-01-12T00:01:00.000Z', preset: 'slow'}),
                new MockReport({date: '2019-01-12T23:59:59.999Z', preset: 'fast'}),
                new MockReport({date: '2019-01-13T00:00:00.000Z', preset: 'fast'}),
                new MockReport({date: '2019-01-13T00:00:00.000Z', preset: 'slow'})
            ]
            const buckets = sut.bucketize(reports, sut._keyGenDaily)
            expect(buckets.size).to.equal(4)
            expect(countBucketEntries(buckets)).to.equal(reports.length)
        })

        it('puts reports of different names and different presets into daily buckets', () => {
            const sut = new ReportCleanup({})
            const reports = [
                new MockReport({date: '2019-01-12T00:00:00.000Z', name: 'KITS', preset: 'fast'}),
                new MockReport({date: '2019-01-12T00:01:00.000Z', name: 'KITS', preset: 'slow'}),
                new MockReport({date: '2019-01-12T23:59:59.999Z', name: 'KITS', preset: 'fast'}),
                new MockReport({date: '2019-01-13T00:00:00.000Z', name: 'KITS', preset: 'fast'}),
                new MockReport({date: '2019-01-13T00:00:00.000Z', name: 'KITS', preset: 'slow'}),
                new MockReport({date: '2019-01-12T00:00:00.000Z', name: 'EXAMPLE', preset: 'fast'}),
                new MockReport({date: '2019-01-12T00:01:00.000Z', name: 'EXAMPLE', preset: 'slow'}),
                new MockReport({date: '2019-01-12T23:59:59.999Z', name: 'EXAMPLE', preset: 'fast'}),
                new MockReport({date: '2019-01-13T00:00:00.000Z', name: 'EXAMPLE', preset: 'fast'}),
                new MockReport({date: '2019-01-13T00:00:00.000Z', name: 'EXAMPLE', preset: 'slow'})
            ]
            const buckets = sut.bucketize(reports, sut._keyGenDaily)
            expect(buckets.size).to.equal(8)
            expect(countBucketEntries(buckets)).to.equal(reports.length)
        })
    })

    /**
     * The current cache cannot be prefilled. FIXME
     */
    xit('removes empty directories in the reportDir', async () => {
        this.reports = await Reports.setup(this._baseDir, false)
        fs.unlinkSync(join(this._baseDir, dirWithoutContent, '.gitkeep'))
        const sut = new ReportCleanup({reports: this.reports, dryRun: false})
        expect(this._baseDir).be.a.directory().and.include.subDirs([dirWithoutContent])
        expect(this._baseDir).be.a.directory().and.include.subDirs([dirWithContent])
        await sut.purgeEmptyDirs()

        /*
          ok, so: for whatever stupid reason windows does not sync the filesystem operations
          fast enough, so that this test will fail, if we omit this line. We are unable to
          force synchronization, because node does not expose that for directories, but only
          for files. This is a workaround and we are not proud of it. but it works. FIXME.
          plz.
        */
        await fs.readdir(this._baseDir)
        expect(this._baseDir).be.a.directory().and.not.include.subDirs([dirWithoutContent])
        expect(this._baseDir).be.a.directory().and.include.subDirs([dirWithContent])
    })
})