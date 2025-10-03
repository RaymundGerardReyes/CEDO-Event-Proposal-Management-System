/**
 * =============================================
 * DATA SYNC SERVICE - postgresql + postgresql Synchronization
 * =============================================
 * 
 * This service handles data synchronization between postgresql and postgresql
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

const { pool, query } = require('../config/database-postgresql-only');
// getDb is used in some branches; import defensively
let getDb;
try {
  ({ getDb } = require('../config/database-mongodb'));
} catch (_) {
  getDb = async () => { throw new Error('MongoDB not configured'); };
}
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

  if (!params.direction || !['postgresql-to-postgresql', 'postgresql-to-postgresql', 'bidirectional'].includes(params.direction)) {
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
        postgresqlValue: data1[key],
        postgresqlValue: data2[key]
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

/**
 * Get organization name by ID
 * 
 * @param {string|number} organizationId - Organization ID
 * @returns {Promise<string>} Organization name
 */
const getOrganizationName = async (organizationId) => {
  try {
    console.log(`🔍 SYNC: Looking up organization name for ID: ${organizationId}`);

    // Try to get from users table first
    const [userRows] = await pool.query(
      'SELECT organization_name FROM users WHERE id = ? AND organization_name IS NOT NULL',
      [organizationId]
    );

    if (userRows.length > 0 && userRows[0].organization_name) {
      console.log(`✅ SYNC: Found organization name from users table: ${userRows[0].organization_name}`);
      return userRows[0].organization_name;
    }

    // Try to get from proposals table
    const [proposalRows] = await pool.query(
      'SELECT organization_name FROM proposals WHERE user_id = ? AND organization_name IS NOT NULL ORDER BY created_at DESC LIMIT 1',
      [organizationId]
    );

    if (proposalRows.length > 0 && proposalRows[0].organization_name) {
      console.log(`✅ SYNC: Found organization name from proposals table: ${proposalRows[0].organization_name}`);
      return proposalRows[0].organization_name;
    }

    // Fallback to default organization name
    console.log(`⚠️ SYNC: No organization name found for ID ${organizationId}, using default`);
    return 'Unknown Organization';

  } catch (error) {
    console.error(`❌ SYNC: Error getting organization name for ID ${organizationId}:`, error.message);
    return 'Unknown Organization';
  }
};

/**
 * Ensure proposal consistency across databases
 * 
 * @param {string|number} organizationId - Organization ID
 * @returns {Promise<Object>} Consistency check result
 */
const ensureProposalConsistency = async (organizationId) => {
  try {
    console.log(`🔄 SYNC: Checking proposal consistency for organization: ${organizationId}`);

    const orgName = await getOrganizationName(organizationId);

    // Check PostgreSQL proposals
    const [pgProposals] = await pool.query(
      'SELECT id, uuid, proposal_status, organization_name FROM proposals WHERE user_id = ?',
      [organizationId]
    );

    // Check MongoDB proposals (if available)
    let mongoProposals = [];
    try {
      const db = await getDb();
      mongoProposals = await db.collection('proposals').find({ submitter: organizationId.toString() }).toArray();
    } catch (postgresqlError) {
      console.warn('⚠️ SYNC: postgresql not available for consistency check');
    }

    const consistency = {
      organizationName: orgName,
      pgProposalCount: pgProposals.length,
      mongoProposalCount: mongoProposals.length,
      consistent: true,
      recommendations: []
    };

    // Check for inconsistencies
    if (pgProposals.length !== mongoProposals.length) {
      consistency.consistent = false;
      consistency.recommendations.push('Proposal count mismatch between databases');
    }

    // Check organization name consistency
    const inconsistentProposals = pgProposals.filter(p => p.organization_name !== orgName);
    if (inconsistentProposals.length > 0) {
      consistency.consistent = false;
      consistency.recommendations.push(`${inconsistentProposals.length} proposals have inconsistent organization names`);
    }

    console.log(`✅ SYNC: Consistency check completed for organization: ${orgName}`);
    return { consistency };

  } catch (error) {
    console.error(`❌ SYNC: Error checking proposal consistency:`, error.message);
    return {
      consistency: {
        organizationName: 'Unknown',
        postgresqlProposalCount: 0,
        postgresqlProposalCount: 0,
        consistent: false,
        recommendations: ['Error occurred during consistency check']
      }
    };
  }
};

// =============================================
// postgresql TO postgresql SYNC FUNCTIONS
// =============================================

/**
 * Sync proposal data from postgresql to postgresql
 * 
 * @param {string|number} proposalId - Proposal ID
 * @returns {Promise<Object>} Sync result
 */
const syncPostgresToMongo = async (proposalId) => {
  try {
    logSyncOperation('postgresql to postgresql sync started', { proposalId });

    // Get PostgreSQL proposal data
    const [pgProposals] = await pool.query(
      'SELECT * FROM proposals WHERE id = ?',
      [proposalId]
    );

    if (pgProposals.length === 0) {
      throw new Error('Proposal not found in postgresql');
    }

    const postgresqlData = pgProposals[0];

    // Get postgresql database
    const db = await getDb();
    const collection = db.collection('proposals');

    // Check if postgresql record exists
    const existingpostgresqlRecord = await collection.findOne({ proposalId: proposalId.toString() });

    if (existingpostgresqlRecord) {
      // Update existing record
      const updateResult = await collection.updateOne(
        { proposalId: proposalId.toString() },
        {
          $set: {
            ...postgresqlData,
            proposalId: proposalId.toString(),
            lastSyncedFrompostgresql: generateSyncTimestamp(),
            updatedAt: new Date()
          }
        }
      );

      logSyncOperation('postgresql to postgresql sync completed (update)', {
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
        ...postgresqlData,
        proposalId: proposalId.toString(),
        lastSyncedFrompostgresql: generateSyncTimestamp(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      logSyncOperation('postgresql to postgresql sync completed (insert)', {
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
    console.error('❌ SYNC: Error syncing postgresql to postgresql:', error);
    throw new Error(`Failed to sync postgresql to postgresql: ${error.message}`);
  }
};

/**
 * Sync multiple proposals from postgresql to postgresql
 * 
 * @param {Array} proposalIds - Array of proposal IDs
 * @returns {Promise<Object>} Batch sync result
 */
const batchSyncPostgresToMongo = async (proposalIds) => {
  try {
    logSyncOperation('Batch postgresql to postgresql sync started', {
      proposalCount: proposalIds.length
    });

    const results = [];
    const errors = [];

    for (const proposalId of proposalIds) {
      try {
        const result = await syncPostgresToMongo(proposalId);
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

    logSyncOperation('Batch postgresql to postgresql sync completed', summary);

    return summary;

  } catch (error) {
    console.error('❌ SYNC: Error in batch postgresql to postgresql sync:', error);
    throw new Error(`Failed to batch sync postgresql to postgresql: ${error.message}`);
  }
};

// =============================================
// postgresql TO postgresql SYNC FUNCTIONS
// =============================================

/**
 * Sync proposal data from postgresql to postgresql
 * 
 * @param {string|number} proposalId - Proposal ID
 * @returns {Promise<Object>} Sync result
 */
const syncMongoToPostgres = async (proposalId) => {
  try {
    logSyncOperation('postgresql to postgresql sync started', { proposalId });

    // Get postgresql proposal data
    const db = await getDb();
    const collection = db.collection('proposals');

    const postgresqlData = await collection.findOne({ proposalId: proposalId.toString() });

    if (!postgresqlData) {
      throw new Error('Proposal not found in postgresql');
    }

    // Check if postgresql record exists
    const [pgCheck] = await pool.query(
      'SELECT id FROM proposals WHERE id = ?',
      [proposalId]
    );

    if (pgCheck.length > 0) {
      // Update existing record
      const updateFields = [];
      const updateValues = [];

      // Map postgresql fields to postgresql fields
      const fieldMapping = {
        organization_name: postgresqlData.organization_name,
        organization_type: postgresqlData.organization_type,
        contact_name: postgresqlData.contact_name,
        contact_email: postgresqlData.contact_email,
        contact_phone: postgresqlData.contact_phone,
        event_name: postgresqlData.event_name,
        event_venue: postgresqlData.event_venue,
        event_mode: postgresqlData.event_mode,
        event_start_date: postgresqlData.event_start_date,
        event_end_date: postgresqlData.event_end_date,
        proposal_status: postgresqlData.proposal_status,
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

      logSyncOperation('postgresql to postgresql sync completed (update)', {
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
          postgresqlData.organization_name,
          postgresqlData.organization_type,
          postgresqlData.contact_name,
          postgresqlData.contact_email,
          postgresqlData.contact_phone,
          postgresqlData.event_name,
          postgresqlData.event_venue,
          postgresqlData.event_mode,
          postgresqlData.event_start_date,
          postgresqlData.event_end_date,
          postgresqlData.proposal_status,
          new Date(),
          new Date()
        ]
      );

      logSyncOperation('postgresql to postgresql sync completed (insert)', {
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
    console.error('❌ SYNC: Error syncing postgresql to postgresql:', error);
    throw new Error(`Failed to sync postgresql to postgresql: ${error.message}`);
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
    const [pgProposals] = await pool.query(
      'SELECT * FROM proposals WHERE id = ?',
      [proposalId]
    );

    const db = await getDb();
    const collection = db.collection('proposals');
    const postgresqlData = await collection.findOne({ proposalId: proposalId.toString() });
    const pgData = pgProposals[0] || null;

    // Compare data structures
    const comparison = compareDataStructures(pgData || {}, postgresqlData || {});

    const syncResult = {
      proposalId: proposalId,
      pgExists: !!pgData,
      mongoExists: !!postgresqlData,
      hasDifferences: comparison.hasDifferences,
      differences: comparison.differences,
      syncOperations: []
    };

    // Sync based on differences
    if (comparison.hasDifferences) {
      if (pgData && postgresqlData) {
        // Both exist, resolve conflicts
        const conflictResolution = await resolveDataConflicts(proposalId, pgData, postgresqlData);
        syncResult.conflictResolution = conflictResolution;
      } else if (postgresqlData && !pgData) {
        // Only postgresql exists, sync to postgresql
        const postgresqlResult = await syncMongoToPostgres(proposalId);
        syncResult.syncOperations.push(postgresqlResult);
      } else if (!postgresqlData && pgData) {
        // Only postgresql exists, sync to postgresql
        const postgresqlResult = await syncMongoToPostgres(proposalId);
        syncResult.syncOperations.push(postgresqlResult);
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
 * Resolve data conflicts between postgresql and postgresql
 * 
 * @param {string|number} proposalId - Proposal ID
 * @param {Object} postgresqlData - postgresql data
 * @param {Object} postgresqlData - postgresql data
 * @returns {Promise<Object>} Conflict resolution result
 */
const resolveDataConflicts = async (proposalId, pgData, mongoData) => {
  try {
    logSyncOperation('Resolving data conflicts', { proposalId });

    const comparison = compareDataStructures(pgData, mongoData);
    const resolution = {
      proposalId: proposalId,
      conflicts: comparison.differences,
      resolution: 'postgresql-wins', // Default strategy
      resolvedFields: []
    };

    // Apply resolution strategy (postgresql wins by default)
    for (const conflict of comparison.differences) {
      const pgValue = conflict.postgresqlValue;
      const mongoValue = conflict.postgresqlValue;

      // Update postgresql with postgresql value
      const db = await getDb();
      const collection = db.collection('proposals');

      await collection.updateOne(
        { proposalId: proposalId.toString() },
        {
          $set: {
            [conflict.field]: pgValue,
            lastConflictResolution: generateSyncTimestamp()
          }
        }
      );

      resolution.resolvedFields.push({
        field: conflict.field,
        oldValue: mongoValue,
        newValue: pgValue
      });
    }

    logSyncOperation('Data conflicts resolved', {
      proposalId,
      resolvedFields: resolution.resolvedFields.length
    });

    return resolution;

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
    const [pgProposals] = await pool.query(
      'SELECT * FROM proposals WHERE id = ?',
      [proposalId]
    );

    const db = await getDb();
    const collection = db.collection('proposals');
    const postgresqlData = await collection.findOne({ proposalId: proposalId.toString() });
    const pgData = pgProposals[0] || null;

    const validation = {
      proposalId: proposalId,
      pgExists: !!pgData,
      mongoExists: !!postgresqlData,
      dataConsistent: false,
      differences: [],
      validationPassed: false
    };

    if (pgData && postgresqlData) {
      const comparison = compareDataStructures(pgData, postgresqlData);
      validation.dataConsistent = !comparison.hasDifferences;
      validation.differences = comparison.differences;
      validation.validationPassed = comparison.hasDifferences === false;
    } else {
      validation.validationPassed = false;
      validation.differences = [{
        field: 'existence',
        postgresqlValue: !!pgData,
        postgresqlValue: !!postgresqlData
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

// =============================================
// EXPORT FUNCTIONS
// =============================================

module.exports = {
  // Postgres -> Mongo Sync
  syncPostgresToMongo,
  batchSyncPostgresToMongo,

  // Mongo -> Postgres Sync
  syncMongoToPostgres,

  // Bidirectional Sync
  bidirectionalSync,
  resolveDataConflicts,

  // Validation
  validateSyncIntegrity,

  // Utility Functions
  validateSyncParams,
  compareDataStructures,
  generateSyncTimestamp,
  logSyncOperation,
  getOrganizationName,
  ensureProposalConsistency
};