/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const cluster = require('cluster')
const { Webserver, SingleRun, PeriodicRun, ReportCruncher } = require('../src/submodules')

class Program {
    /**
     * Parses the argv arguments and switches between server and single run mode.
     * @param {*} args
     */
    constructor(args) {
        this._args = args
    }

    run() {
        return this._args.server
            ? new ServerMode(cluster).run()
            : new SingleRunMode(cluster).run()
    }
}

class ServerMode {

    /**
     * Create instance of ServerMode to continously generate and monitor reports.
     * @param _cluster The cluster to fork on
     */
    constructor(_cluster = cluster) {
        this._cluster = _cluster
    }

    /**
     * Fork periodic report generation and a monitoring webserver.
     */
    run() {
        Webserver.fork(this._cluster)
        PeriodicRun.fork(this._cluster)
        ReportCruncher.fork(this._cluster)
    }
}

class SingleRunMode {

    /**
     * Create instance of SingleRunMode to only generate reports once and then exit.
     * @param _cluster The cluster to fork on
     */
    constructor(_cluster = cluster) {
        this._cluster = _cluster
    }

    /**
     * Fork one instance of the SingleRun submodule
     */
    run() {
        SingleRun.fork(this._cluster)
    }
}

module.exports = {
    Program,
    ServerMode,
}
