// backend/config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    transports: [new winston.transports.Console()],
    format: winston.format.simple()
});

module.exports = logger;
