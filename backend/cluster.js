const cluster = require('cluster');
const os = require('os');
const path = require('path');

// Performance monitoring
let clusterStartTime = Date.now();
const workerMetrics = new Map();

// Configuration
const config = {
    // Use all CPU cores in production, limited in development
    workerCount: process.env.NODE_ENV === 'production'
        ? os.cpus().length
        : Math.min(2, os.cpus().length),

    // Restart settings
    maxRestarts: 5,
    restartDelay: 1000,

    // Health check interval
    healthCheckInterval: 30000, // 30 seconds

    // Graceful shutdown timeout
    shutdownTimeout: 10000, // 10 seconds
};

if (cluster.isMaster) {
    console.log(`🚀 CEDO Master Process ${process.pid} starting...`);
    console.log(`💻 CPU Cores: ${os.cpus().length}`);
    console.log(`👥 Workers to spawn: ${config.workerCount}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Memory: ${Math.round(os.totalmem() / 1024 / 1024)} MB total`);

    // Worker restart tracking
    const workerRestarts = new Map();

    // Spawn workers
    for (let i = 0; i < config.workerCount; i++) {
        spawnWorker();
    }

    // Function to spawn a new worker
    function spawnWorker() {
        const worker = cluster.fork();
        const workerId = worker.process.pid;

        console.log(`✅ Worker ${workerId} started`);

        // Initialize worker metrics
        workerMetrics.set(workerId, {
            startTime: Date.now(),
            restarts: workerRestarts.get(workerId) || 0,
            lastHealthCheck: Date.now(),
            memoryUsage: 0,
            cpuUsage: 0
        });

        // Worker message handling
        worker.on('message', (message) => {
            if (message.type === 'health') {
                const metrics = workerMetrics.get(workerId);
                if (metrics) {
                    metrics.lastHealthCheck = Date.now();
                    metrics.memoryUsage = message.memory;
                    metrics.cpuUsage = message.cpu;
                }
            }
        });

        // Handle worker exit
        worker.on('exit', (code, signal) => {
            console.warn(`⚠️ Worker ${workerId} died (${signal || code})`);

            // Remove from metrics
            workerMetrics.delete(workerId);

            // Check restart count
            const restarts = workerRestarts.get(workerId) || 0;

            if (restarts < config.maxRestarts) {
                console.log(`🔄 Restarting worker ${workerId} (attempt ${restarts + 1}/${config.maxRestarts})`);
                workerRestarts.set(workerId, restarts + 1);

                setTimeout(() => {
                    spawnWorker();
                }, config.restartDelay);
            } else {
                console.error(`❌ Worker ${workerId} exceeded max restarts (${config.maxRestarts})`);

                // If we have no workers left, exit
                if (Object.keys(cluster.workers).length === 0) {
                    console.error('💥 No workers remaining. Exiting master process.');
                    process.exit(1);
                }
            }
        });

        return worker;
    }

    // Health monitoring
    const healthCheckInterval = setInterval(() => {
        const now = Date.now();
        const unhealthyWorkers = [];

        workerMetrics.forEach((metrics, workerId) => {
            const timeSinceLastCheck = now - metrics.lastHealthCheck;

            if (timeSinceLastCheck > config.healthCheckInterval * 2) {
                console.warn(`🩺 Worker ${workerId} health check timeout (${timeSinceLastCheck}ms)`);
                unhealthyWorkers.push(workerId);
            }
        });

        // Restart unhealthy workers
        unhealthyWorkers.forEach(workerId => {
            const worker = Object.values(cluster.workers).find(w => w.process.pid === workerId);
            if (worker) {
                console.log(`🔄 Restarting unhealthy worker ${workerId}`);
                worker.kill('SIGTERM');
            }
        });

    }, config.healthCheckInterval);

    // Cluster statistics endpoint (for monitoring)
    const getClusterStats = () => {
        const uptime = Date.now() - clusterStartTime;
        const workers = Array.from(workerMetrics.entries()).map(([pid, metrics]) => ({
            pid,
            uptime: Date.now() - metrics.startTime,
            restarts: metrics.restarts,
            memoryUsage: metrics.memoryUsage,
            cpuUsage: metrics.cpuUsage,
            healthy: Date.now() - metrics.lastHealthCheck < config.healthCheckInterval * 2
        }));

        return {
            master: {
                pid: process.pid,
                uptime,
                totalWorkers: config.workerCount,
                activeWorkers: Object.keys(cluster.workers).length,
                environment: process.env.NODE_ENV,
                nodeVersion: process.version,
                platform: os.platform(),
                cpuCores: os.cpus().length,
                totalMemory: Math.round(os.totalmem() / 1024 / 1024),
                freeMemory: Math.round(os.freemem() / 1024 / 1024),
                loadAverage: os.loadavg()
            },
            workers
        };
    };

    // Log cluster stats periodically
    setInterval(() => {
        const stats = getClusterStats();
        console.log(`📊 Cluster Stats: ${stats.master.activeWorkers}/${stats.master.totalWorkers} workers, ${Math.round(stats.master.uptime / 1000)}s uptime`);
    }, 60000); // Every minute

    // Graceful shutdown
    const shutdown = (signal) => {
        console.log(`\n🛑 Master received ${signal}. Shutting down gracefully...`);

        clearInterval(healthCheckInterval);

        // Send shutdown signal to all workers
        Object.values(cluster.workers).forEach(worker => {
            worker.send({ type: 'shutdown' });
        });

        // Force shutdown after timeout
        setTimeout(() => {
            console.log('⏰ Shutdown timeout reached. Forcing exit...');
            Object.values(cluster.workers).forEach(worker => {
                worker.kill('SIGKILL');
            });
            process.exit(1);
        }, config.shutdownTimeout);

        // Wait for workers to exit gracefully
        cluster.on('exit', () => {
            if (Object.keys(cluster.workers).length === 0) {
                console.log('✅ All workers shut down. Master exiting.');
                process.exit(0);
            }
        });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        console.error('💥 Master uncaught exception:', error);
        shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('💥 Master unhandled rejection at:', promise, 'reason:', reason);
    });

} else {
    // Worker process
    const workerId = process.pid;
    console.log(`👷 Worker ${workerId} starting...`);

    // Import and start the main server
    const server = require('./server.js');

    // Worker health reporting
    const reportHealth = () => {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        process.send({
            type: 'health',
            memory: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
            cpu: cpuUsage.user + cpuUsage.system,
            timestamp: Date.now()
        });
    };

    // Start health reporting
    const healthInterval = setInterval(reportHealth, 10000); // Every 10 seconds

    // Handle messages from master
    process.on('message', (message) => {
        if (message.type === 'shutdown') {
            console.log(`🛑 Worker ${workerId} received shutdown signal`);
            clearInterval(healthInterval);

            // Graceful shutdown
            if (server && server.close) {
                server.close(() => {
                    console.log(`✅ Worker ${workerId} server closed`);
                    process.exit(0);
                });

                // Force exit after timeout
                setTimeout(() => {
                    console.log(`⏰ Worker ${workerId} shutdown timeout. Forcing exit.`);
                    process.exit(1);
                }, 5000);
            } else {
                process.exit(0);
            }
        }
    });

    // Worker error handling
    process.on('uncaughtException', (error) => {
        console.error(`💥 Worker ${workerId} uncaught exception:`, error);
        process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error(`💥 Worker ${workerId} unhandled rejection:`, reason);
        process.exit(1);
    });

    console.log(`✅ Worker ${workerId} ready and listening`);
} 