/**
 * Connection Manager
 * Purpose: Centralized connection management with graceful degradation
 * Key approaches: Connection pooling, health monitoring, retry logic, fallback strategies
 */

const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');

class ConnectionManager {
    constructor() {
        this.mysqlPool = null;
        this.mongoClient = null;
        this.isMysqlConnected = false;
        this.isMongoConnected = false;
        this.connectionAttempts = {
            mysql: 0,
            mongo: 0
        };
        this.maxRetries = 3;
    }

    /**
     * Initialize MySQL connection with fallback
     */
    async initializeMySQL() {
        try {
            console.log('🔗 Initializing MySQL connection...');

            const pool = mysql.createPool({
                host: process.env.MYSQL_HOST || '127.0.0.1',
                port: process.env.MYSQL_PORT || 3306,
                user: process.env.MYSQL_USER || 'root',
                password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD,
                database: process.env.MYSQL_DATABASE || 'cedo_auth',
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                acquireTimeout: 10000,
                timeout: 10000,
                reconnect: true
            });

            // Test the connection
            await pool.query('SELECT 1');

            this.mysqlPool = pool;
            this.isMysqlConnected = true;
            this.connectionAttempts.mysql = 0;

            console.log('✅ MySQL connection established');
            return true;
        } catch (error) {
            console.warn('⚠️ MySQL connection failed:', error.message);
            this.isMysqlConnected = false;
            this.connectionAttempts.mysql++;
            return false;
        }
    }

    /**
     * Initialize MongoDB connection with retry logic
     */
    async initializeMongoDB() {
        try {
            console.log('🍃 Initializing MongoDB connection...');

            const uri = process.env.MONGODB_URI || 'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_db?authSource=admin';
            const options = {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 15000,
                connectTimeoutMS: 5000,
                heartbeatFrequencyMS: 10000,
                maxIdleTimeMS: 30000,
                retryWrites: true,
                retryReads: true
            };

            const client = new MongoClient(uri, options);
            await client.connect();

            // Test the connection
            await client.db('cedo_db').command({ ping: 1 });

            this.mongoClient = client;
            this.isMongoConnected = true;
            this.connectionAttempts.mongo = 0;

            console.log('✅ MongoDB connection established');
            return true;
        } catch (error) {
            console.warn('⚠️ MongoDB connection failed:', error.message);
            this.isMongoConnected = false;
            this.connectionAttempts.mongo++;
            return false;
        }
    }

    /**
     * Get MySQL pool with health check
     */
    async getMySQLPool() {
        if (!this.isMysqlConnected || !this.mysqlPool) {
            throw new Error('MySQL not connected');
        }

        try {
            // Test the connection
            await this.mysqlPool.query('SELECT 1');
            return this.mysqlPool;
        } catch (error) {
            console.warn('⚠️ MySQL health check failed, attempting reconnection...');
            this.isMysqlConnected = false;
            await this.initializeMySQL();

            if (this.isMysqlConnected) {
                return this.mysqlPool;
            }

            throw new Error('MySQL connection lost and reconnection failed');
        }
    }

    /**
     * Get MongoDB client with health check
     */
    async getMongoClient() {
        if (!this.isMongoConnected || !this.mongoClient) {
            throw new Error('MongoDB not connected');
        }

        try {
            // Test the connection
            await this.mongoClient.db('cedo_db').command({ ping: 1 });
            return this.mongoClient;
        } catch (error) {
            console.warn('⚠️ MongoDB health check failed, attempting reconnection...');
            this.isMongoConnected = false;
            await this.initializeMongoDB();

            if (this.isMongoConnected) {
                return this.mongoClient;
            }

            throw new Error('MongoDB connection lost and reconnection failed');
        }
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            mysql: {
                connected: this.isMysqlConnected,
                attempts: this.connectionAttempts.mysql,
                pool: this.mysqlPool ? 'available' : 'not_available'
            },
            mongodb: {
                connected: this.isMongoConnected,
                attempts: this.connectionAttempts.mongo,
                client: this.mongoClient ? 'available' : 'not_available'
            },
            overall: this.isMysqlConnected || this.isMongoConnected
        };
    }

    /**
     * Health check for all services
     */
    async healthCheck() {
        const status = {
            timestamp: new Date().toISOString(),
            services: {}
        };

        // Check MySQL
        try {
            if (this.isMysqlConnected && this.mysqlPool) {
                const startTime = Date.now();
                await this.mysqlPool.query('SELECT 1');
                const responseTime = Date.now() - startTime;
                status.services.mysql = {
                    status: 'healthy',
                    message: 'MySQL is responding',
                    responseTime: responseTime
                };
            } else {
                status.services.mysql = {
                    status: 'disconnected',
                    message: 'MySQL not connected',
                    responseTime: 0
                };
            }
        } catch (error) {
            status.services.mysql = {
                status: 'error',
                message: error.message,
                responseTime: 0
            };
        }

        // Check MongoDB
        try {
            if (this.isMongoConnected && this.mongoClient) {
                const startTime = Date.now();
                await this.mongoClient.db('cedo_db').command({ ping: 1 });
                const responseTime = Date.now() - startTime;
                status.services.mongodb = {
                    status: 'healthy',
                    message: 'MongoDB is responding',
                    responseTime: responseTime
                };
            } else {
                status.services.mongodb = {
                    status: 'disconnected',
                    message: 'MongoDB not connected',
                    responseTime: 0
                };
            }
        } catch (error) {
            status.services.mongodb = {
                status: 'error',
                message: error.message,
                responseTime: 0
            };
        }

        return status;
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        console.log('🔄 Shutting down connections...');

        try {
            if (this.mysqlPool) {
                await this.mysqlPool.end();
                console.log('✅ MySQL connection closed');
            }
        } catch (error) {
            console.error('❌ Error closing MySQL connection:', error.message);
        }

        try {
            if (this.mongoClient) {
                await this.mongoClient.close();
                console.log('✅ MongoDB connection closed');
            }
        } catch (error) {
            console.error('❌ Error closing MongoDB connection:', error.message);
        }

        console.log('✅ All connections closed');
    }

    /**
     * Initialize all connections
     */
    async initialize() {
        console.log('🚀 Initializing all connections...');

        const results = await Promise.allSettled([
            this.initializeMySQL(),
            this.initializeMongoDB()
        ]);

        const mysqlResult = results[0];
        const mongoResult = results[1];

        console.log('\n📊 Connection Results:');
        console.log(`   MySQL: ${mysqlResult.status === 'fulfilled' && mysqlResult.value ? '✅ Connected' : '❌ Failed'}`);
        console.log(`   MongoDB: ${mongoResult.status === 'fulfilled' && mongoResult.value ? '✅ Connected' : '❌ Failed'}`);
        console.log('');

        return {
            mysql: mysqlResult.status === 'fulfilled' && mysqlResult.value,
            mongodb: mongoResult.status === 'fulfilled' && mongoResult.value,
            overall: (mysqlResult.status === 'fulfilled' && mysqlResult.value) ||
                (mongoResult.status === 'fulfilled' && mongoResult.value)
        };
    }
}

// Create singleton instance
const connectionManager = new ConnectionManager();

module.exports = connectionManager; 