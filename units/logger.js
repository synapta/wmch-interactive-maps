"use strict";
// logger
const logger = require("log4js").getLogger();
if (parseInt(process.env.DEBUG) > 1) {
    logger.level = 'trace';
} else if (parseInt(process.env.DEBUG) == 1) {
    logger.level = 'debug';
} else {
    logger.level = 'info';
}
exports.logger = logger;
