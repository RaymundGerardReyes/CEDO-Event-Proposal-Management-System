/**
 * Logger Utility
 *
 * This module provides a centralized logging system for the application.
 *
 * @module utils/logger
 * @requires winston
 */

const winston = require("winston")
const path = require("path")

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
)

// Create logger instance
const logger = winston.createLogger({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: logFormat,
    defaultMeta: { service: "cedo-api" },
    transports: [
        // Write logs to console
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(
                    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? "\n" + info.stack : ""}`,
                ),
            ),
        }),

        // Write all logs to file
        new winston.transports.File({
            filename: path.join(__dirname, "../logs/error.log"),
            level: "error",
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: path.join(__dirname, "../logs/combined.log"),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
})

// Add request logging middleware
logger.requestLogger = (req, res, next) => {
    const start = Date.now()

    res.on("finish", () => {
        const duration = Date.now() - start
        const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`

        if (res.statusCode >= 400) {
            logger.warn(message, {
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                duration,
                ip: req.ip,
                userId: req.user?.id,
            })
        } else {
            logger.info(message, {
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                duration,
            })
        }
    })

    next()
}

module.exports = logger
