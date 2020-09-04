/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const debug = require('debug')
const path = require('path')
const { spawn } = require('child_process');
const fs = require('fs-extra')
const Sqlite3 = require('better-sqlite3')

const {Report} = require('./report')

const tableDDL = `
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  preset TEXT NOT NULL,
  date TEXT NOT NULL,
  path TEXT NOT NULL,
  lastseen TEXT
)
`


class ReportsCache {
    constructor(path, readonly = false) {
        try {
            this._db = new Sqlite3(path, {readonly})
        } catch (e) {
            console.error(`ERROR: Could not open cache database at ${path}`)
            console.error(e)
            process.exit(1)
        }

        // set the current time for lastseen on initialization
        this.updateCurrentLastseen()

        // this enables better concurrency while the file watcher syncs the database cache
        this._db.pragma('journal_mode=WAL')
        this._db.prepare(tableDDL).run()
    }

    updateCurrentLastseen(value = (new Date()).toISOString()) {
        const x = Date.parse(value)
        if (isNaN(x)) {
            throw new Error(`Not a valid Date: "${value}"`)
        }
        this._currentLastseen = (new Date(value)).toISOString()
    }

    upsert(report) {
        let values = {
            id: report.id.toString(),
            url: report.url.toString(),
            name: report.name.toString(),
            preset: report.preset.toString(),
            date: report.date.toString(),
            path: report.path.toString(),
            lastseen: this._currentLastseen
        }
        this._db.prepare('INSERT INTO reports VALUES ($id, $url, $name, $preset, $date, $path, $lastseen) ' +
            'ON CONFLICT(id) DO UPDATE SET lastseen=$lastseen').run(values)
    }

    delete(report) {
        return this._db.prepare('DELETE FROM reports WHERE id = ?').run(report.id)
    }

    deleteByMeta(name, preset, created) {
        if (!name || !preset || !created) {
            throw new Error(`deleteByMeta requires three parameters - at least one is missing: (name: ${name}, preset: ${preset}, created: ${created})`)
        }
        return this._db.prepare('DELETE FROM reports WHERE name=? AND preset=? AND date=?').run(name, preset, created)
    }

    get(id) {
        let result = this._db.prepare('SELECT id, url, name, preset, date, path FROM reports WHERE id = ?').get(id)
        if (!result)
            return
        return new Report(result)
    }

    /**
     * INSECURE! An internal method, which accepts a where-clause as a string. ONLY use this method with static data.
     * Allowing unsecured input into the parameter results in an SQL injection vulnerability.
     * @param where
     * @returns Result[]
     * @private
     */
    _all(where = '1=1') {
        let result = this._db.prepare(`SELECT id, url, name, preset, date, path FROM reports WHERE ${where}`).all()
        return result.map(row => new Report(row))
    }

    all() {
        return this._all()
    }

    outdated() {
        return this._all(`lastseen<'${this._currentLastseen}'`)
    }
}


class ReportsCacheDisabled {
    constructor() {
    }

    upsert() {
    }

    updateCurrentLastseen() {
    }

    delete() {
    }

    get() {
    }

    all() {
    }

    outdated() {
    }
}


class Reports {
    constructor(baseDir, setupWatcher = true, cache = null) {
        this._baseDir = baseDir
        fs.ensureDirSync(baseDir)
        this._reportsCache = cache === null ? new ReportsCache(path.join(baseDir, 'cache.sqlite3')) : cache
        if (setupWatcher) {
            this._setupWatcher()
        }
    }

    static async setup(baseDir, cache = null) {
        const reports = new Reports(baseDir, false, cache)
        await reports._setupWatcher(baseDir)
        return reports
    }

    _setupWatcher(dir = this._baseDir) {
        this._watcher = spawn(path.join(__dirname, '..', 'bin', 'sync-cache'), ['--report-dir', dir, '--verbose'], {
            detached: false,
            stdio: ['pipe', 'inherit', 'inherit']
        })
        //this._watcher.stdout.on('data', (data) => debug('LIGHTMON:SYNC:INFO')(`${data.trim()}`))
        //this._watcher.stderr.on('data', (data) => debug('LIGHTMON:SYNC:ERROR')(`${data.trim()}`))
        this._watcher.on('close', (code) => {
            debug('LIGHTMON:WARNING')(`Sync childprocess exited with code ${code}`)
        })
    }

    single(id) {
        return this._reportsCache.get(id)
    }

    all() {
        return this._reportsCache.all()
    }

    /**
     * Removes disk location of reports to mitigate information leakage
     */
    withoutInternals() {
        return this.all().map(r => r.withoutInternals())
    }

    olderThan(date) {
        return this.all().filter(report => {
            return new Date(report.date) < date
        })
    }

    delete(report) {
        report.delete()
        this._reportsCache.delete(report)
    }

    get baseDir() {
        return this._baseDir
    }

    async destroy() {
        try {
            this._watcher.kill()
            // eslint-disable-next-line no-empty
        } catch (e) {
            console.error(e)
        }
    }
}


module.exports = {
    Reports,
    ReportsCache,
    ReportsCacheDisabled
}