/**
 * Part of Lightmon: https://github.com/verivox/lightmon
 * Licensed under MIT from the Verivox GmbH
 */
const path = require('path')
const express = require('express')


class StaticFiles {
    constructor({ Webserver, publicFolder }) {
        this.publicPath = path.resolve(path.join(__dirname, '..', '..', publicFolder))
        Webserver.middleware.add(this)
    }

    middleware() {
        return express.static(this.publicPath)
    }
}


module.exports = {
    StaticFiles,
}
