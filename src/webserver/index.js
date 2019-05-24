/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const { HtmlReport } = require('./html-report')
const { Metrics } = require('./metrics')
const { StaticFiles } = require('./static-files')
const { Webserver } = require('./webserver')

module.exports = {
    HtmlReport,
    Metrics,
    StaticFiles,
    Webserver,
}