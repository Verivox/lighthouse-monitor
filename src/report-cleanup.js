/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const Moment = require('moment')
const debug = require('debug')('LIGHTMON:CLEANUP:DEBUG')
const info = require('debug')('LIGHTMON:CLEANUP:INFO')
const warn = require('debug')('LIGHTMON:CLEANUP:WARNING')
const fs = require('fs-extra')
const path = require('path')


class ReportCleanup {
    constructor({ retainWeekly, retainDaily, reports, dryRun = false }) {
        this.retainWeekly = retainWeekly
        this.retainDaily = retainDaily
        this.reports = reports
        this.dryRun = dryRun
    }

    async clean() {
        if (this.retainWeekly !== undefined) {
            const weekly = this.reports.olderThan(new Moment().subtract(this.retainWeekly, 'days').toDate())
            await this.weekly(this.reports, weekly)
        }

        if (this.retainDaily !== undefined) {
            const daily = this.reports.olderThan(new Moment().subtract(this.retainDaily, 'days').toDate())
            await this.daily(this.reports, daily)
        }
    }

    async weekly(webDir, reports) {
        info(`Crunching reports older than ${this.retainWeekly} days from daily down to weekly resolution`)
        const buckets = this.bucketize(reports, this._keyGenWeekly)
        await this.reduce(webDir, buckets)
    }

    async daily(webDir, reports) {
        info(`Crunching reports older than ${this.retainDaily} days from full down to daily resolution`)
        const buckets = this.bucketize(reports, this._keyGenDaily)
        await this.reduce(webDir, buckets)
    }


    bucketize(reports, keyGen) {
        const buckets = new Map()

        for(const report of reports) {
            const key = keyGen(report)
            if (!buckets.has(key)) {
                buckets.set(key, [])
            }
            const bucket = buckets.get(key)
            bucket.push(report)
            buckets.set(key, bucket)
        }

        return buckets
    }

    _keyGenWeekly(report) {
        const date = Moment.utc(report.date)
        return `${date.format('YYYYww')}_${report.name}_${report.preset}`
    }


    _keyGenDaily(report) {
        const date = Moment.utc(report.date)
        return `${date.format('YYYYMMDD')}_${report.name}_${report.preset}`
    }

    async reduce(reports, buckets) {
        for(const bucket of buckets.values()) {
            bucket.sort((a, b) => a.date < b.date)
            bucket.shift()

            for(const report of bucket) {
                debug(`Deleting ${report.path}/${report.name}_${report.preset} and associated files`)
                if (!this.dryRun) {
                    reports.delete(report)
                }
            }
        }
    }

    async purgeEmptyDirs() {
        const reportDir = this.reports.baseDir

        for (const entry of fs.readdirSync(reportDir)) {
            const subdir = path.join(reportDir, entry)

            if (!fs.statSync(subdir).isDirectory()) {
                continue
            }

            if (fs.readdirSync(subdir).length > 0) {
                continue
            }

            try {
                debug(`Deleting empty directory ${subdir}`)
                if (!this.dryRun) {
                    await fs.rmdir(subdir)
                }
            } catch (e) {
                warn(`Could not delete empty directory ${subdir} - error: ${e}`)
            }
        }
    }
}


module.exports = {
    ReportCleanup,
}
