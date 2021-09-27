/**
 * This is the main configuration file.
 *
 * Note that this will be checked into the repository, so it MUST NOT contain
 * any secrets whatsoever.
 *
 *
 * ========================================================
 * DO NOT MAKE CHANGES IN THIS FILE FOR DEPLOYMENT REASONS!
 * ========================================================
 *
 * If you want to change settings, you can overwrite any by copying over
 * ./sample.js to ./local.js and change your settings there.
 *
 *
 * Some configuration options can be given via environment variables as well.
 */
const os = require('os')
const path = require('path')

const { TimestampedDirectory } = require('../src/receivers/timestamped-directory')
const { FilePrometheus } = require('../src/receivers/file-prometheus')
const { NewRelic } = require('../src/receivers/new-relic')

const debug = require('debug')

let localConfig = {}
try {
    localConfig = require('./local')
} catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
        debug('LIGHTMON:ERROR')('config/local.js found, but threw exception while importing: ', e.toString())
        process.exit(1)
    }
}



/**
 * These are the default settings, allowing lighthouse to run in docker
 */
const presetDefault = {
    browserOptions: {
        headless: true,
        args: [
            '--no-sandbox'
        ]
    },
    onlyCategories: [
        'performance'
    ],
    output: [
        'html'
    ]
}

if (process.env.NO_HEADLESS) {
    presetDefault.browserOptions.headless = false
}


/**
 * By default, lighthouse will run through each of these presets for every
 * target url.
 */
const presets = {
    'mobile_mid-slow': Object.assign(
        {},
        presetDefault,
        {
            preset: 'mobile_mid-slow',
            formFactor: 'mobile',
            screenEmulation: {
                mobile: true,
                width: 360,
                height: 640,
                deviceScaleFactor: 2.625,
                disabled: false,
            },
            emulatedUserAgent: 'Mozilla/5.0 (Linux; Android 7.0; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4590.2 Mobile Safari/537.36 Chrome-Lighthouse',
            throttlingMethod: 'simulate',
            throttling: {
                rttMs: 150,
                throughputKbps: 1638.4,
                cpuSlowdownMultiplier: 4
            }
        }
    ),
    'mobile_mid-fast': Object.assign(
        {},
        presetDefault,
        {
            preset: 'mobile_mid-fast',
            formFactor: 'mobile',
            screenEmulation: {
                mobile: true,
                width: 360,
                height: 640,
                deviceScaleFactor: 2.625,
                disabled: false,
            },
            emulatedUserAgent: 'Mozilla/5.0 (Linux; Android 7.0; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4590.2 Mobile Safari/537.36 Chrome-Lighthouse',
            throttlingMethod: 'simulate',
            throttling: {
                rttMs: 28,
                throughputKbps: 16000,
                cpuSlowdownMultiplier: 4
            }
        }
    ),
    'desktop-fast': Object.assign(
        {},
        presetDefault,
        {
            preset: 'desktop-fast',
            formFactor: 'desktop',
	        screenEmulation: {
	            mobile: false,
		        width: 1350,
		        height: 940,
		        deviceScaleFactor: 1,
		        disabled: false
	        },	        
            emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4590.2 Safari/537.36 Chrome-Lighthouse',
            throttlingMethod: 'simulate',
            throttling: {
                rttMs: 28,
                throughputKbps: 16000,
                cpuSlowdownMultiplier: 1
            }
        }
    )
}



/**
 * These are the targets to run through. The name needs to be unique and will
 * be used in the receivers.
 */
const targets = [
    {
        name: 'verivox-startpage',
        url: 'https://www.verivox.de/',
    },
    {
        name: 'kumbierit',
        url: 'https://kumbier.it',
    },
]


const WebserverOptions = {
    port: process.env.NODE_PORT || 3000,
    publicFolder: 'public',
}


/**
 * Build the configuration object with some dynamic receiver insertion
 * depending on environment variables
 */
const receivers = []

/**
 * The directory where reports are stored.
 * @type {string}
 */
const reportDir = process.env.REPORT_DIR || localConfig.reportDir || path.join(os.tmpdir(), 'lightmon')

/**
 * The directory, in which the cache for the reports are stored
 * @type {string|*}
 */
const cacheDir = process.env.CACHE_DIR || localConfig.cacheDir || os.tmpdir()

const prometheusMetricsFile = path.join(WebserverOptions.publicFolder, 'metrics', 'index.html')
const jsonMetricsFile = path.join(WebserverOptions.publicFolder, 'metrics.json')


/**
 * How often do we expect reports? /healthz will return a 500, if no report has been seen in that time
 * defaults to once every 25h
 * @type {number}
 */
const expectedLastReportInSec = localConfig.expectedLastReportInSec || 25*60*60


/**
 * If the reports are saved on a network folder, the filesystem watcher will most likely not work.
 * This instructs chokidar to use polling instead. Set to a non-number to disable polling.
 * @type {number|false}
 */
const reportsPollingEverySec = false


receivers.push(
    new TimestampedDirectory(reportDir),
    new FilePrometheus(prometheusMetricsFile)
)

const newRelicOptions = {
    accountId: process.env.NEW_RELIC_ACCOUNT_ID,
    apiKey: process.env.NEW_RELIC_API_KEY
}
if (newRelicOptions.accountId || newRelicOptions.apiKey) {
    receivers.push(
        new NewRelic(newRelicOptions)
    )
}


/**
 * Do you want to use a mutex to make sure, that no evaluation will run in parallel?
 *
 * Uncomment the following line for the default linux behavior
 */
//const lockFile = process.geteuid() === 0 ? '/run/lightmon-evaluate.lock' : `/run/user/${process.geteuid()}/lightmon-evaluate.lock`
const lockFile = null

/**
 * We user proper-lockfile for process locking - you can add your options here if you want to.
 * @see https://github.com/moxystudio/node-proper-lockfile
 */
const lockFileOptions = {
    stale: 60000,
    update: 5000
}


/**
 * Overwrite this default configuration with the local.js, if present
 */
const config = Object.assign(
    {
        presets,
        receivers,
        targets,
        WebserverOptions,
        prometheusMetricsFile,
        jsonMetricsFile,
        lockFile,
        lockFileOptions,
        cacheDir,
        reportDir,
        expectedLastReportInSec,
        reportsPollingEverySec
    },
    localConfig
)

// TODO: this is getting ridiculous - create a real config class
config.reportDir = reportDir

// el cheapo validity check
if (!presets || Object.keys(presets).length === 0 ||
    !receivers || receivers.length === 0 ||
    !targets || targets.length === 0) {
    debug('LIGHTMON:ERROR')('Invalid config. I require at least one preset, one receiver and one target')
    process.exit(1)
}

// all set
module.exports = config
