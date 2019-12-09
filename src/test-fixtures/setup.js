const winston = require('winston')

/**
 * Disable all messages in testing
 */
winston.configure({
    transports: [
        new winston.transports.Console({
            silent: true
        })
    ]
})