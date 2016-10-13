'use strict';

const winston = require('winston');
const config = require('../configure');

module.exports = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            timestamp: true,
            level: config.logLevel || 'info'
        }),
    ]
});
