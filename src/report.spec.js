/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const { Report } = require('./report')
const { join, resolve } = require('path')
const chai = require('chai')
chai.use(require('chai-fs'))
const expect = chai.expect
const fs = require('fs-extra')
const tmpdir = require('os').tmpdir

const dirFixture = resolve(__dirname, './test-fixtures/reports/store')
const subDir = '2018-08-03T09_10_00.013Z'
const configFileFixture = 'KITS_mobile-fast_config.json.gz'


describe('Report', function () {
    this.beforeEach(async function() {
        this._baseDir = fs.mkdtempSync(join(tmpdir(), 'mocha-'))
        fs.copySync(dirFixture, this._baseDir)
    })

    this.afterEach(function() {
        try {
            fs.removeSync(this._baseDir)
        } catch (e) {}  // eslint-disable-line no-empty
    })


    it('has an identical canonical id for identical metadata', function () {
        const conf = {
            url: 'https://kumbier.it',
            name: 'KITS',
            preset: 'mobile-fast',
            date: '2018-07-15T23:12:05.023Z',
            path: '/some/path/2018-07-15T23_12_05.023Z'
        }
        const conf1 = new Report(conf)
        const conf2 = new Report(conf)

        expect(conf1.id).not.to.be.undefined
        expect(conf2.id).not.to.be.undefined
        expect(conf1.id).to.equal(conf2.id)
    })


    it('can instantiate itself from meta-information', function () {
        const meta = {
            url: 'https://kumbier.it',
            name: 'KITS',
            preset: 'mobile-fast',
            reportsDir: dirFixture,
            runStartedAt: '2018-07-15T23:12:05.023Z'
        }
        const conf = {
            url: 'https://kumbier.it',
            name: 'KITS',
            preset: 'mobile-fast',
            date: '2018-07-15T23:12:05.023Z',
            path: join(dirFixture, '2018-07-15T23_12_05.023Z')
        }
        const actual = Report.fromMeta(meta)
        const expected = new Report(conf)
        expect(actual.id).to.equal(expected.id)
    })


    it('can instantiate itself from a configfile', function () {
        const report = Report.fromFile(join(dirFixture, subDir), configFileFixture)
        const expected = new Report({
            url: 'https://kumbier.it',
            name: 'KITS',
            preset: 'mobile-fast',
            date: '2018-08-03T09:10:00.013Z',
            path: join(dirFixture, subDir)
        })

        expect(report.id).to.equal(expected.id)
    })


    it('has a secure version of itself', function () {
        const report = Report.fromFile(join(dirFixture, subDir), configFileFixture)
        expect(report.withoutInternals()).to.not.haveOwnProperty('path')
    })


    it('can delete itself', function() {
        const report = Report.fromFile(join(this._baseDir, subDir), configFileFixture)
        const configFile = join(this._baseDir, subDir, configFileFixture)

        expect(fs.existsSync(configFile)).to.be.true

        report.delete()

        expect(fs.existsSync(configFile)).to.be.false
    })
})
