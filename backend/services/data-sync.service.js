/**
 * =============================================
 * DATA SYNC SERVICE - MySQL + MongoDB Synchronization
 * =============================================
 * 
 * This service handles data synchronization between MySQL and MongoDB
 * databases, ensuring data consistency across the hybrid architecture.
 * It provides comprehensive sync operations, validation, and error handling.
 * 
 * @module services/data-sync.service
 * @author CEDO Development Team
 * @version 1.0.0
 * 
 * @description
 * Features:
 * - Bidirectional data synchronization
 * - Data validation and integrity checks
 * - Conflict resolution strategies
 * - Incremental sync operations
 * - Error recovery and logging
 * - Performance optimization
 */

const { pool } = require('../config/db');
const { getDb } = require('../utils/db');

// =============================================
// SHARED UTILITY FUNCTIONS
// =============================================

/**
 * Validate sync operation parameters
 * 
 * @param {Object} params - Sync parameters
 * @returns {Object} Validation result
 */
const validateSyncParams = (params) => {
  const errors = [];

  if (!params.proposalId) {
    errors.push('Proposal ID is required');
  }

  if (!params.direction || !['mysql-to-mongo', 'mongo-to-mysql', 'bidirectional'].includes(params.direction)) {
    errors.push('Invalid sync direction');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Compare data structures for differences
 * 
 * @param {Object} data1 - First data object
 * @param {Object} data2 - Second data object
 * @returns {Object} Comparison result
 */
const compareDataStructures = (data1, data2) => {
  const differences = [];
  const allKeys = new Set([...Object.keys(data1), ...Object.keys(data2)]);

  allKeys.forEach(key => {
    if (data1[key] !== data2[key]) {
      differences.push({
        field: key,
        mysqlValue: data1[key],
        mongoValue: data2[key]
      });
    }
  });

  return {
    hasDifferences: differences.length > 0,
    differences: differences,
    totalFields: allKeys.size,
    differentFields: differences.length
  };
};

/**
 * Generate sync timestamp
 * 
 * @returns {string} ISO timestamp
 */
const generateSyncTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Log sync operation
 * 
 * @param {string} operation - Operation type
 * @param {Object} details - Operation details
 */
const logSyncOperation = (operation, details) => {
  console.log(`🔄 SYNC: ${operation}`, {
    timestamp: generateSyncTimestamp(),
    ...details
  });
};

// =============================================
// MYSQL TO MONGODB SYNC FUNCTIONS
// =============================================

/**
 * Sync proposal data from MySQL to MongoDB
 * 
 * @param {string|number} proposalId - Proposal ID
 * @returns {Promise<Object>} Sync result
 */
const syncMySQLToMongo = async (proposalId) => {
  try {
    logSyncOperation('MySQL to MongoDB sync started', { proposalId });

    // Get MySQL proposal data
    const [mysqlProposals] = await pool.query(
      'SELECT * FROM proposals WHERE id = ?',
      [proposalId]
    );

    if (mysqlProposals.length === 0) {
      throw new Error('Proposal not found in MySQL');
    }

    const mysqlData = mysqlProposals[0];

    // Get MongoDB database
    const db = await getDb();
    const collection = db.collection('proposals');

    // Check if MongoDB record exists
    const existingMongoRecord = await collection.findOne({ proposalId: proposalId.toString() });

    if (existingMongoRecord) {
      // Update existing record
      const updateResult = await collection.updateOne(
        { proposalId: proposalId.toString() },
        {
          $set: {
            ...mysqlData,
            proposalId: proposalId.toString(),
            lastSyncedFromMySQL: generateSyncTimestamp(),
            updatedAt: new Date()
          }
        }
      );

      logSyncOperation('MySQL to MongoDB sync completed (update)', {
        proposalId,
        modifiedCount: updateResult.modifiedCount
      });

      return {
        success: true,
        operation: 'update',
        proposalId: proposalId,
        modifiedCount: updateResult.modifiedCount,
        syncedAt: generateSyncTimestamp()
      };

    } else {
      // Create new record
      const insertResult = await collection.insertOne({
        ...mysqlData,
        proposalId: proposalId.toString(),
        lastSyncedFromMySQL: generateSyncTimestamp(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      logSyncOperation('MySQL to MongoDB sync completed (insert)', {
        proposalId,
        insertedId: insertResult.insertedId
      });

      return {
        success: true,
        operation: 'insert',
        proposalId: proposalId,
        insertedId: insertResult.insertedId,
        syncedAt: generateSyncTimestamp()
      };
    }

  } catch (error) {
    console.error('❌ SYNC: Error syncing MySQL to MongoDB:', error);
    throw new Error(`Failed to sync MySQL to MongoDB: ${error.message}`);
  }
};

/**
 * Sync multiple proposals from MySQL to MongoDB
 * 
 * @param {Array} proposalIds - Array of proposal IDs
 * @returns {Promise<Object>} Batch sync result
 */
const batchSyncMySQLToMongo = async (proposalIds) => {
  try {
    logSyncOperation('Batch MySQL to MongoDB sync started', {
      proposalCount: proposalIds.length
    });

    const results = [];
    const errors = [];

    for (const proposalId of proposalIds) {
      try {
        const result = await syncMySQLToMongo(proposalId);
        results.push(result);
      } catch (error) {
        errors.push({
          proposalId: proposalId,
          error: error.message
        });
      }
    }

    const summary = {
      total: proposalIds.length,
      successful: results.length,
      failed: errors.length,
      results: results,
      errors: errors
    };

    logSyncOperation('Batch MySQL to MongoDB sync completed', summary);

    return summary;

  } catch (error) {
    console.error('❌ SYNC: Error in batch MySQL to MongoDB sync:', error);
    throw new Error(`Failed to batch sync MySQL to MongoDB: ${error.message}`);
  }
};

// =============================================
// MONGODB TO MYSQL SYNC FUNCTIONS
// =============================================

/**
 * Sync proposal data from MongoDB to MySQL
 * 
 * @param {string|number} proposalId - Proposal ID
 * @returns {Promise<Object>} Sync result
 */
const syncMongoToMySQL = async (proposalId) => {
  try {
    logSyncOperation('MongoDB to MySQL sync started', { proposalId });

    // Get MongoDB proposal data
    const db = await getDb();
    const collection = db.collection('proposals');

    const mongoData = await collection.findOne({ proposalId: proposalId.toString() });

    if (!mongoData) {
      throw new Error('Proposal not found in MongoDB');
    }

    // Check if MySQL record exists
    const [mysqlProposals] = await pool.query(
      'SELECT id FROM proposals WHERE id = ?',
      [proposalId]
    );

    if (mysqlProposals.length > 0) {
      // Update existing record
      const updateFields = [];
      const updateValues = [];

      // Map MongoDB fields to MySQL fields
      const fieldMapping = {
        organization_name: mongoData.organization_name,
        organization_type: mongoData.organization_type,
        contact_name: mongoData.contact_name,
        contact_email: mongoData.contact_email,
        contact_phone: mongoData.contact_phone,
        event_name: mongoData.event_name,
        event_venue: mongoData.event_venue,
        event_mode: mongoData.event_mode,
        event_start_date: mongoData.event_start_date,
        event_end_date: mongoData.event_end_date,
        proposal_status: mongoData.proposal_status,
        updated_at: new Date()
      };

      Object.entries(fieldMapping).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      });

      updateValues.push(proposalId);

      const [updateResult] = await pool.query(
        `UPDATE proposals SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      logSyncOperation('MongoDB to MySQL sync completed (update)', {
        proposalId,
        affectedRows: updateResult.affectedRows
      });

      return {
        success: true,
        operation: 'update',
        proposalId: proposalId,
        affectedRows: updateResult.affectedRows,
        syncedAt: generateSyncTimestamp()
      };

    } else {
      // Create new record
      const [insertResult] = await pool.query(
        `INSERT INTO proposals (
          id, organization_name, organization_type, contact_name, contact_email,
          contact_phone, event_name, event_venue, event_mode,
          event_start_date, event_end_date, proposal_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          proposalId,
          mongoData.organization_name,
          mongoData.organization_type,
          mongoData.contact_name,
          mongoData.contact_email,
          mongoData.contact_phone,
          mongoData.event_name,
          mongoData.event_venue,
          mongoData.event_mode,
          mongoData.event_start_date,
          mongoData.event_end_date,
          mongoData.proposal_status,
          new Date(),
          new Date()
        ]
      );

      logSyncOperation('MongoDB to MySQL sync completed (insert)', {
        proposalId,
        insertId: insertResult.insertId
      });

      return {
        success: true,
        operation: 'insert',
        proposalId: proposalId,
        insertId: insertResult.insertId,
        syncedAt: generateSyncTimestamp()
      };
    }

  } catch (error) {
    console.error('❌ SYNC: Error syncing MongoDB to MySQL:', error);
    throw new Error(`Failed to sync MongoDB to MySQL: ${error.message}`);
  }
};

// =============================================
// BIDIRECTIONAL SYNC FUNCTIONS
// =============================================

/**
 * Perform bidirectional sync for a proposal
 * 
 * @param {string|number} proposalId - Proposal ID
 * @returns {Promise<Object>} Bidirectional sync result
 */
const bidirectionalSync = async (proposalId) => {
  try {
    logSyncOperation('Bidirectional sync started', { proposalId });

    // Get data from both databases
    const [mysqlProposals] = await pool.query(
      'SELECT * FROM proposals WHERE id = ?',
      [proposalId]
    );

    const db = await getDb();
    const collection = db.collection('proposals');
    const mongoData = await collection.findOne({ proposalId: proposalId.toString() });

    const mysqlData = mysqlProposals[0] || null;

    // Compare data structures
    const comparison = compareDataStructures(mysqlData || {}, mongoData || {});

    const syncResult = {
      proposalId: proposalId,
      mysqlExists: !!mysqlData,
      mongoExists: !!mongoData,
      hasDifferences: comparison.hasDifferences,
      differences: comparison.differences,
      syncOperations: []
    };

    // Sync based on differences
    if (comparison.hasDifferences) {
      if (mysqlData && mongoData) {
        // Both exist, resolve conflicts
        const conflictResolution = await resolveDataConflicts(proposalId, mysqlData, mongoData);
        syncResult.conflictResolution = conflictResolution;
      } else if (mysqlData && !mongoData) {
        // Only MySQL exists, sync to MongoDB
        const mongoResult = await syncMySQLToMongo(proposalId);
        syncResult.syncOperations.push(mongoResult);
      } else if (!mysqlData && mongoData) {
        // Only MongoDB exists, sync to MySQL
        const mysqlResult = await syncMongoToMySQL(proposalId);
        syncResult.syncOperations.push(mysqlResult);
      }
    }

    syncResult.syncedAt = generateSyncTimestamp();

    logSyncOperation('Bidirectional sync completed', {
      proposalId,
      hasDifferences: comparison.hasDifferences,
      operations: syncResult.syncOperations.length
    });

    return syncResult;

  } catch (error) {
    console.error('❌ SYNC: Error in bidirectional sync:', error);
    throw new Error(`Failed to perform bidirectional sync: ${error.message}`);
  }
};

/**
 * Resolve data conflicts between MySQL and MongoDB
 * 
 * @param {string|number} proposalId - Proposal ID
 * @param {Object} mysqlData - MySQL data
 * @param {Object} mongoData - MongoDB data
 * @returns {Promise<Object>} Conflict resolution result
 */
const resolveDataConflicts = async (proposalId, mysqlData, mongoData) => {
  try {
    logSyncOperation('Resolving data conflicts', { proposalId });

    const comparison = compareDataStructures(mysqlData, mongoData);
    const resolution = {
      proposalId: proposalId,
      conflicts: comparison.differences,
      resolution: 'mysql-wins', // Default strategy
      resolvedFields: []
    };

    // Apply resolution strategy (MySQL wins by default)
    for (const conflict of comparison.differences) {
      const mysqlValue = conflict.mysqlValue;
      const mongoValue = conflict.mongoValue;

      // Update MongoDB with MySQL value
      const db = await getDb();
      const collection = db.collection('proposals');

      await collection.updateOne(
        { proposalId: proposalId.toString() },
        {
          $set: {
            [conflict.field]: mysqlValue,
            lastConflictResolution: generateSyncTimestamp()
          }
        }
      );

      resolution.resolvedFields.push({
        field: conflict.field,
        oldValue: mongoValue,
        newValue: mysqlValue
      });
    }

    logSyncOperation('Data conflicts resolved', {
      proposalId,
      resolvedFields: resolution.resolvedFields.length
    });

<<<<<<< HEAD
/**
 * Synchronize proposal data between MySQL and MongoDB
 * @param {string} proposalId - The proposal ID to synchronize
 * @param {object} additionalData - Additional data to sync
 * @param {object} options - Options for synchronization (optional)
 * @returns {Promise<object>} Synchronization result
 */
const syncProposalData = async (proposalId, additionalData = {}, options = {}) => {
    const startTime = Date.now();
    const cacheKey = CacheKeys.proposal(proposalId);
=======
    return resolution;
>>>>>>> f6553a8 (Refactor backend services and configuration files)

  } catch (error) {
    console.error('❌ SYNC: Error resolving data conflicts:', error);
    throw new Error(`Failed to resolve data conflicts: ${error.message}`);
  }
};

// =============================================
// SYNC VALIDATION FUNCTIONS
// =============================================

/**
 * Validate sync integrity
 * 
 * @param {string|number} proposalId - Proposal ID
 * @returns {Promise<Object>} Validation result
 */
const validateSyncIntegrity = async (proposalId) => {
  try {
    logSyncOperation('Validating sync integrity', { proposalId });

    // Get data from both databases
    const [mysqlProposals] = await pool.query(
      'SELECT * FROM proposals WHERE id = ?',
      [proposalId]
    );

    const db = await getDb();
    const collection = db.collection('proposals');
    const mongoData = await collection.findOne({ proposalId: proposalId.toString() });

    const mysqlData = mysqlProposals[0] || null;

    const validation = {
      proposalId: proposalId,
      mysqlExists: !!mysqlData,
      mongoExists: !!mongoData,
      dataConsistent: false,
      differences: [],
      validationPassed: false
    };

    if (mysqlData && mongoData) {
      const comparison = compareDataStructures(mysqlData, mongoData);
      validation.dataConsistent = !comparison.hasDifferences;
      validation.differences = comparison.differences;
      validation.validationPassed = comparison.hasDifferences === false;
    } else {
      validation.validationPassed = false;
      validation.differences = [{
        field: 'existence',
        mysqlValue: !!mysqlData,
        mongoValue: !!mongoData
      }];
    }

    logSyncOperation('Sync integrity validation completed', {
      proposalId,
      validationPassed: validation.validationPassed,
      differences: validation.differences.length
    });

    return validation;

  } catch (error) {
    console.error('❌ SYNC: Error validating sync integrity:', error);
    throw new Error(`Failed to validate sync integrity: ${error.message}`);
  }
};

<<<<<<< HEAD
/**
 * Update proposal status in both databases
 * @param {string} proposalId - The proposal ID
 * @param {string} newStatus - The new status
 * @param {string} userId - The user making the change (optional)
 * @param {object} options - Additional options (optional)
 * @returns {Promise<object>} Update result
 */
const updateProposalStatus = async (proposalId, newStatus, userId = 'system', options = {}) => {
    const startTime = Date.now();
    const connection = await pool.getConnection();

    try {
        console.log('🔄 DATA SYNC: Updating proposal status:', { proposalId, newStatus, userId });

        await connection.beginTransaction();

        // Optimistic locking: check if proposal was modified
        const [currentData] = await connection.execute(
            'SELECT status, updated_at, version FROM proposals WHERE id = ? FOR UPDATE',
            [proposalId]
        );

        if (!currentData || currentData.length === 0) {
            await connection.rollback();
            throw new Error(`Proposal ${proposalId} not found`);
        }

        const current = currentData[0];

        // Check version for optimistic locking (if version field exists)
        if (options.expectedVersion && current.version !== options.expectedVersion) {
            await connection.rollback();
            throw new Error('Proposal was modified by another user. Please refresh and try again.');
        }

        // Update proposal - handle cases where version column may not exist
        let updateQuery, updateParams;
        if (current.version !== undefined) {
            updateQuery = `UPDATE proposals 
                          SET status = ?, updated_at = NOW(), updated_by = ?, version = version + 1
                          WHERE id = ?`;
            updateParams = [newStatus, userId, proposalId];
        } else {
            updateQuery = `UPDATE proposals 
                          SET status = ?, updated_at = NOW(), updated_by = ?
                          WHERE id = ?`;
            updateParams = [newStatus, userId, proposalId];
        }

        const [updateResult] = await connection.execute(updateQuery, updateParams);

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            throw new Error('Failed to update proposal status');
        }

        // Log the status change - create table if it doesn't exist
        try {
            await connection.execute(
                `INSERT INTO proposal_status_log (proposal_id, old_status, new_status, changed_by, changed_at)
                 VALUES (?, ?, ?, ?, NOW())`,
                [proposalId, current.status, newStatus, userId]
            );
        } catch (logError) {
            // If status log table doesn't exist, just log the warning but don't fail
            console.warn('⚠️ Could not log status change (table may not exist):', logError.message);
        }

        await connection.commit();

        // Invalidate caches
        try {
            await cache.del(CacheKeys.proposal(proposalId));
            await cache.delPattern(`user:*:proposals`); // Clear user proposal lists
        } catch (cacheError) {
            console.warn('⚠️ Cache invalidation failed:', cacheError.message);
        }

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

/**
 * Initialize the data sync service
 * Sets up MongoDB connection and monitoring
 */
const initialize = async () => {
    console.log('🔧 Data-Sync Service: Initializing...');

    try {
        const mongoInitialized = await initMongoDB();

        if (mongoInitialized) {
            console.log('✅ Data-Sync Service: MongoDB connection established');
        } else {
            console.warn('⚠️ Data-Sync Service: MongoDB connection failed, continuing in limited mode');
        }

        console.log('✅ Data-Sync Service: Initialization complete');
        return mongoInitialized;
    } catch (error) {
        console.error('❌ Data-Sync Service: Initialization failed:', error.message);
        throw error;
    }
};

module.exports = {
    initialize,
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
=======
// =============================================
// EXPORT FUNCTIONS
// =============================================

module.exports = {
  // MySQL to MongoDB Sync
  syncMySQLToMongo,
  batchSyncMySQLToMongo,
  
  // MongoDB to MySQL Sync
  syncMongoToMySQL,
  
  // Bidirectional Sync
  bidirectionalSync,
  resolveDataConflicts,
  
  // Validation
  validateSyncIntegrity,
  
  // Utility Functions
  validateSyncParams,
  compareDataStructures,
  generateSyncTimestamp,
  logSyncOperation
>>>>>>> f6553a8 (Refactor backend services and configuration files)
}; 