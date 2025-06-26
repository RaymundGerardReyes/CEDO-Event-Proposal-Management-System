const { pool } = require('../config/db');
const { MongoClient } = require('mongodb');
const { cache, CacheKeys, CacheTTL } = require('../config/redis');
const { clientPromise: sharedClientPromise } = require('../config/mongodb');

/**
 * Data Synchronization Service
 * Handles consistency between MySQL and MongoDB databases
 */

// Enhanced MongoDB connection with performance optimizations
let mongoClient = null;
let mongoDb = null;

// Initialize MongoDB connection – now just resolve the shared client
async function initMongoDB() {
    try {
        mongoClient = await sharedClientPromise;
        mongoDb = mongoClient.db(); // default DB in the connection string (cedo_auth)
        console.log('✅ Data-Sync Service: Re-using shared MongoDB connection');
        setupMongoMonitoring();
        return true;
    } catch (error) {
        console.error('❌ Data-Sync Service: Failed to obtain shared MongoDB client:', error.message);
        return false;
    }
}

// MongoDB monitoring
function setupMongoMonitoring() {
    mongoClient.on('connectionPoolCreated', () => {
        console.log('📊 MongoDB connection pool created');
    });

    mongoClient.on('connectionCheckedOut', () => {
        // Connection pool monitoring (can be used for metrics)
    });

    mongoClient.on('commandStarted', (event) => {
        if (event.commandName === 'find' || event.commandName === 'aggregate') {
            console.log(`🔍 MongoDB Query: ${event.commandName} on ${event.command.collection || event.databaseName}`);
        }
    });
}

/**
 * Synchronize proposal data between MySQL and MongoDB
 * @param {string} proposalId - The proposal ID to synchronize
 * @param {object} additionalData - Additional data to sync
 * @returns {Promise<object>} Synchronization result
 */
const syncProposalData = async (proposalId, additionalData = {}) => {
    const startTime = Date.now();
    const cacheKey = CacheKeys.proposal(proposalId);

    try {
        console.log('🔄 DATA SYNC: Starting proposal synchronization for ID:', proposalId);

        // Check cache first
        if (!options.skipCache) {
            const cachedData = await cache.get(cacheKey);
            if (cachedData) {
                console.log(`⚡ Cache hit for proposal ${proposalId}`);
                return cachedData;
            }
        }

        // Start transaction for MySQL
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Optimized MySQL query with prepared statement
            const [mysqlData] = await connection.execute(
                `SELECT p.*, u.name as creator_name, u.email as creator_email 
                 FROM proposals p 
                 LEFT JOIN users u ON p.user_id = u.id 
                 WHERE p.id = ? 
                 FOR UPDATE`,
                [proposalId]
            );

            if (!mysqlData || mysqlData.length === 0) {
                await connection.rollback();
                connection.release();
                throw new Error(`Proposal ${proposalId} not found in MySQL`);
            }

            const proposal = mysqlData[0];

            // MongoDB file data with optimized aggregation
            let mongoData = null;
            if (mongoDb) {
                mongoData = await mongoDb.collection('events').aggregate([
                    { $match: { proposalId: parseInt(proposalId) } },
                    {
                        $lookup: {
                            from: 'fs.files',
                            localField: 'files.gridFsId',
                            foreignField: '_id',
                            as: 'fileDetails'
                        }
                    },
                    {
                        $project: {
                            proposalId: 1,
                            eventType: 1,
                            files: 1,
                            fileDetails: 1,
                            createdAt: 1,
                            updatedAt: 1
                        }
                    }
                ]).toArray();
            }

            // Sync result
            const syncResult = {
                proposal,
                mongoData: mongoData || [],
                lastSync: new Date().toISOString(),
                performance: {
                    syncTime: Date.now() - startTime,
                    cacheHit: false
                }
            };

            // Commit MySQL transaction
            await connection.commit();
            connection.release();

            // Cache the result
            await cache.set(cacheKey, syncResult, CacheTTL.PROPOSALS);

            console.log(`✅ Proposal ${proposalId} synced successfully (${Date.now() - startTime}ms)`);
            return syncResult;

        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }

    } catch (error) {
        console.error(`❌ Sync error for proposal ${proposalId}:`, error.message);
        throw error;
    }
};

/**
 * Ensure proposal exists in both databases with consistent data
 * @param {string} proposalId - The proposal ID
 * @param {object} proposalData - Proposal data to ensure consistency
 * @returns {Promise<object>} Consistency check result
 */
const ensureProposalConsistency = async (proposalId, proposalData = {}) => {
    const startTime = Date.now();

    try {
        console.log('🔍 DATA SYNC: Checking proposal consistency for ID:', proposalId);

        // Check MySQL
        const [mysqlRows] = await pool.query(
            'SELECT id, status, updated_at FROM proposals WHERE id = ?',
            [proposalId]
        );

        const mysqlExists = mysqlRows.length > 0;
        console.log('📊 DATA SYNC: MySQL existence check:', mysqlExists);

        // Check MongoDB
        const mongoDoc = await mongoDb.collection('events').findOne({
            proposalId: parseInt(proposalId)
        });

        const mongoExists = !!mongoDoc;
        console.log('📄 DATA SYNC: MongoDB existence check:', mongoExists);

        const result = {
            proposalId: proposalId,
            consistency: {
                mysql: mysqlExists,
                mongodb: mongoExists,
                bothExist: mysqlExists && mongoExists,
                consistent: mysqlExists && mongoExists
            },
            data: {
                mysql: mysqlExists ? mysqlRows[0] : null,
                mongodb: mongoDoc || null
            },
            recommendations: []
        };

        // Generate recommendations based on consistency state
        if (!mysqlExists && !mongoExists) {
            result.recommendations.push('Create proposal in both MySQL and MongoDB');
        } else if (mysqlExists && !mongoExists) {
            result.recommendations.push('Create corresponding MongoDB document');
        } else if (!mysqlExists && mongoExists) {
            result.recommendations.push('Create corresponding MySQL record');
        } else {
            result.recommendations.push('Databases are consistent');
        }

        // Add performance recommendations
        if (result.checkTime > 1000) {
            result.recommendations.push('Consider adding database indexes');
        }

        if (mongoDoc && mongoDoc.length > 100) {
            result.recommendations.push('Consider archiving old events');
        }

        console.log('✅ DATA SYNC: Consistency check completed:', {
            proposalId: proposalId,
            consistent: result.consistency.consistent,
            recommendations: result.recommendations.length
        });

        return result;

    } catch (error) {
        console.error('❌ DATA SYNC: Consistency check failed:', {
            proposalId: proposalId,
            error: error.message
        });
        throw new Error(`Consistency check failed: ${error.message}`);
    }
};

/**
 * Get organization name for a proposal ID
 * @param {string} proposalId - The proposal ID
 * @returns {Promise<string>} Organization name
 */
const getOrganizationName = async (proposalId) => {
    const cacheKey = `org:${proposalId}`;

    try {
        // Check cache first
        const cachedOrg = await cache.get(cacheKey);
        if (cachedOrg) {
            return cachedOrg;
        }

        // Query with optimized join
        const [result] = await pool.execute(
            `SELECT p.organization_name, p.partner_organization 
             FROM proposals p 
             WHERE p.id = ? 
             LIMIT 1`,
            [proposalId]
        );

        const orgName = result?.[0]?.organization_name ||
            result?.[0]?.partner_organization ||
            'Unknown Organization';

        // Cache organization name for longer period
        await cache.set(cacheKey, orgName, CacheTTL.EXTENDED);

        return orgName;
    } catch (error) {
        console.error(`❌ Error fetching organization name for proposal ${proposalId}:`, error.message);
        return 'Unknown Organization';
    }
};

/**
 * Update proposal status in both databases
 * @param {string} proposalId - The proposal ID
 * @param {string} newStatus - The new status
 * @returns {Promise<object>} Update result
 */
const updateProposalStatus = async (proposalId, newStatus) => {
    const startTime = Date.now();
    const connection = await pool.getConnection();

    try {
        console.log('🔄 DATA SYNC: Updating proposal status:', { proposalId, newStatus });

        // Optimistic locking: check if proposal was modified
        const [currentData] = await connection.execute(
            'SELECT status, updated_at, version FROM proposals WHERE id = ? FOR UPDATE',
            [proposalId]
        );

        if (!currentData || currentData.length === 0) {
            throw new Error(`Proposal ${proposalId} not found`);
        }

        const current = currentData[0];

        // Check version for optimistic locking (if version field exists)
        if (options.expectedVersion && current.version !== options.expectedVersion) {
            throw new Error('Proposal was modified by another user. Please refresh and try again.');
        }

        // Update proposal with version increment
        const [updateResult] = await connection.execute(
            `UPDATE proposals 
             SET status = ?, updated_at = NOW(), updated_by = ?, version = version + 1
             WHERE id = ?`,
            [newStatus, userId, proposalId]
        );

        if (updateResult.affectedRows === 0) {
            throw new Error('Failed to update proposal status');
        }

        // Log the status change
        await connection.execute(
            `INSERT INTO proposal_status_log (proposal_id, old_status, new_status, changed_by, changed_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [proposalId, current.status, newStatus, userId]
        );

        await connection.commit();

        // Invalidate caches
        await cache.del(CacheKeys.proposal(proposalId));
        await cache.delPattern(`user:*:proposals`); // Clear user proposal lists

        console.log(`✅ Proposal ${proposalId} status updated: ${current.status} → ${newStatus} (${Date.now() - startTime}ms)`);

        return {
            success: true,
            oldStatus: current.status,
            newStatus,
            updateTime: Date.now() - startTime
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Performance monitoring for database operations
class DatabaseMetrics {
    constructor() {
        this.metrics = {
            queryCount: 0,
            totalQueryTime: 0,
            slowQueries: 0,
            errorCount: 0,
            cacheHits: 0,
            cacheMisses: 0
        };

        this.startTime = Date.now();
    }

    async recordQuery(duration, success = true) {
        this.metrics.queryCount++;
        this.metrics.totalQueryTime += duration;

        if (duration > 1000) { // Slow query threshold: 1 second
            this.metrics.slowQueries++;
            console.warn(`🐌 Slow query detected: ${duration}ms`);
        }

        if (!success) {
            this.metrics.errorCount++;
        }
    }

    recordCacheHit() {
        this.metrics.cacheHits++;
    }

    recordCacheMiss() {
        this.metrics.cacheMisses++;
    }

    getStats() {
        const uptime = Date.now() - this.startTime;
        const avgQueryTime = this.metrics.queryCount > 0
            ? this.metrics.totalQueryTime / this.metrics.queryCount
            : 0;

        return {
            ...this.metrics,
            uptime,
            avgQueryTime: Math.round(avgQueryTime),
            cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses),
            queriesPerSecond: (this.metrics.queryCount / uptime) * 1000
        };
    }
}

const dbMetrics = new DatabaseMetrics();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🔄 Closing database connections...');

    if (mongoClient) {
        await mongoClient.close();
        console.log('✅ MongoDB connection closed');
    }

    if (pool) {
        await pool.end();
        console.log('✅ MySQL pool closed');
    }
});

// MongoDB initialization is now handled by the main server startup sequence
// initMongoDB().catch(console.error); // Removed to prevent conflicts with shared connection

module.exports = {
    syncProposalData,
    ensureProposalConsistency,
    getOrganizationName,
    updateProposalStatus,
    dbMetrics,

    // Database connections for direct access
    getMongoDb: () => mongoDb,
    getMySQLPool: () => pool,

    // Utility functions
    isMongoAvailable: () => mongoDb !== null,
    isMySQLAvailable: () => pool !== null,
}; 