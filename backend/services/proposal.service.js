const { pool } = require('../config/db');
const { getDb } = require('../config/mongodb');
const { Binary } = require('mongodb');
const path = require("path");
const Proposal = require("../models/Proposal");
const ROLES = require('../constants/roles');
const transporter = require('../config/nodemailer.config');
const User = require("../models/User");
const fs = require("fs");

async function saveSection2Data(data) {
    const {
        title, description, category, organizationType,
        contactPerson, contactEmail, contactPhone,
        startDate, endDate, location, budget, objectives, volunteersNeeded,
        status = 'draft',
        proposal_id
    } = data;

    if (!title || !contactPerson || !contactEmail) {
        throw new Error('Missing required fields');
    }

    if (proposal_id) {
        const updateQuery = `
        UPDATE proposals 
        SET 
          title = ?, description = ?, category = ?, organizationType = ?,
          contactPerson = ?, contactEmail = ?, contactPhone = ?,
          startDate = ?, endDate = ?, location = ?, budget = ?, 
          objectives = ?, volunteersNeeded = ?, status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

        const [result] = await pool.query(updateQuery, [
            title, description, category, organizationType,
            contactPerson, contactEmail, contactPhone,
            startDate, endDate, location, budget,
            objectives, volunteersNeeded, status,
            proposal_id
        ]);
        return { id: proposal_id, affectedRows: result.affectedRows };
    } else {
        const insertQuery = `
        INSERT INTO proposals (
          title, description, category, organizationType,
          contactPerson, contactEmail, contactPhone,
          startDate, endDate, location, budget,
          objectives, volunteersNeeded, status,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

        const [result] = await pool.query(insertQuery, [
            title, description, category, organizationType,
            contactPerson, contactEmail, contactPhone,
            startDate, endDate, location, budget,
            objectives, volunteersNeeded, status
        ]);
        return { id: result.insertId };
    }
}

async function saveSection2OrgData(data) {
    const {
        title, description, category, organizationType,
        contactPerson, contactEmail, contactPhone,
        startDate, endDate, location, budget, objectives, volunteersNeeded,
        status = 'draft',
        proposal_id
    } = data;

    let validatedOrganizationType = organizationType;
    const validTypes = ['school-based', 'community-based'];
    if (!validTypes.includes(validatedOrganizationType)) {
        console.warn(
            `[WARN] Invalid 'organizationType' received: "${validatedOrganizationType}". ` +
            `Defaulting to 'school-based' to prevent database error.`
        );
        validatedOrganizationType = 'school-based';
    }

    if (!title || !contactPerson || !contactEmail) {
        throw new Error('Missing required fields');
    }

    if (proposal_id) {
        const updateQuery = `
          UPDATE proposals 
          SET organization_name = ?, organization_description = ?, organization_type = ?,
              contact_name = ?, contact_email = ?, contact_phone = ?,
              event_name = ?, event_venue = ?, event_start_date = ?, event_end_date = ?,
              event_start_time = ?, event_end_time = ?,
              school_event_type = ?, community_event_type = ?,
              proposal_status = ?, updated_at = NOW()
          WHERE id = ?
        `;
        const schoolEventType = validatedOrganizationType === 'school-based' ? 'other' : null;
        const communityEventType = validatedOrganizationType === 'community-based' ? 'others' : null;

        const updateValues = [
            title, description, validatedOrganizationType,
            contactPerson, contactEmail, contactPhone,
            title + ' Event', location || 'TBD',
            startDate || '2025-01-01',
            endDate || '2025-01-01',
            '09:00:00', '17:00:00',
            schoolEventType,
            communityEventType,
            status, proposal_id
        ];

        const [updateResult] = await pool.query(updateQuery, updateValues);
        if (updateResult.affectedRows === 0) {
            throw new Error('Proposal not found');
        }
        return { id: proposal_id };
    } else {
        const insertQuery = `
          INSERT INTO proposals (
            organization_name, organization_description, organization_type,
            contact_name, contact_email, contact_phone,
            event_name, event_venue, event_start_date, event_end_date,
            event_start_time, event_end_time,
            school_event_type, community_event_type,
            proposal_status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        const schoolEventType = validatedOrganizationType === 'school-based' ? 'other' : null;
        const communityEventType = validatedOrganizationType === 'community-based' ? 'others' : null;

        const insertValues = [
            title, description, validatedOrganizationType,
            contactPerson, contactEmail, contactPhone,
            title + ' Event', location || 'TBD',
            startDate || '2025-01-01',
            endDate || '2025-01-01',
            '09:00:00', '17:00:00',
            schoolEventType,
            communityEventType,
            status
        ];

        const [insertResult] = await pool.query(insertQuery, insertValues);
        return { id: insertResult.insertId };
    }
}

async function saveSection3EventData(data) {
    const {
        proposal_id, venue, start_date, end_date, time_start, time_end,
        event_type, event_mode
    } = data;

    if (!proposal_id) {
        throw new Error('Missing required field: proposal_id');
    }

    const [currentProposal] = await pool.query(
        'SELECT proposal_status FROM proposals WHERE id = ?',
        [proposal_id]
    );

    if (currentProposal.length === 0) {
        throw new Error('Proposal not found');
    }

    const currentStatus = currentProposal[0].proposal_status;
    let nextStatus = currentStatus;
    if (currentStatus === 'draft') {
        nextStatus = 'pending';
    }

    const updateQuery = `
      UPDATE proposals 
      SET event_venue = ?, 
          event_start_date = ?, 
          event_end_date = ?,
          event_start_time = ?, 
          event_end_time = ?,
          school_event_type = ?,
          event_mode = ?,
          proposal_status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const updateValues = [
        venue || 'TBD',
        start_date || null,
        end_date || null,
        time_start || null,
        time_end || null,
        event_type || 'other',
        event_mode || 'offline',
        nextStatus,
        proposal_id
    ];

    const [updateResult] = await pool.query(updateQuery, updateValues);
    if (updateResult.affectedRows === 0) {
        throw new Error('Proposal not found or could not be updated');
    }

    const [verifyProposal] = await pool.query(
        'SELECT proposal_status FROM proposals WHERE id = ?',
        [proposal_id]
    );

    return {
        id: proposal_id,
        previousStatus: currentStatus,
        newStatus: verifyProposal[0]?.proposal_status,
        autoPromoted: currentStatus === 'draft' && verifyProposal[0]?.proposal_status === 'pending'
    };
}

async function getDebugProposalInfo(proposalId) {
    let mongoProposal = null;
    try {
        mongoProposal = await Proposal.findById(proposalId);
    } catch (mongoError) {
        // Ignore, probably not a mongo id
    }

    let mysqlProposal = null;
    try {
        const [rows] = await pool.query('SELECT * FROM proposals WHERE id = ?', [proposalId]);
        mysqlProposal = rows[0] || null;
    } catch (mysqlError) {
        // Ignore
    }

    return {
        mongodb: {
            found: !!mongoProposal,
            data: mongoProposal ? {
                id: mongoProposal._id,
                title: mongoProposal.title,
                contactEmail: mongoProposal.contactEmail,
                status: mongoProposal.status
            } : null
        },
        mysql: {
            found: !!mysqlProposal,
            data: mysqlProposal ? {
                id: mysqlProposal.id,
                organization_name: mysqlProposal.organization_name,
                contact_email: mysqlProposal.contact_email,
                proposal_status: mysqlProposal.proposal_status
            } : null
        }
    };
}

async function searchProposal(organization_name, contact_email) {
    if (!organization_name || !contact_email) {
        throw new Error('Missing required search parameters');
    }

    const searchQuery = `
      SELECT id, organization_name, contact_email, proposal_status, created_at
      FROM proposals 
      WHERE organization_name = ? AND contact_email = ?
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const [rows] = await pool.query(searchQuery, [organization_name, contact_email]);

    if (rows.length === 0) {
        return null;
    }
    return rows[0];
}

// ===================================================================
// MONGO DB PROPOSAL CRUD
// ===================================================================

async function createProposal(user, proposalData, files) {
    const {
        title, description, category, startDate, endDate, location, budget,
        objectives, volunteersNeeded, organizationType, contactPerson,
        contactEmail, contactPhone, status
    } = proposalData;

    const documents = files ? files.map((file) => ({
        name: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
    })) : [];

    const proposal = new Proposal({
        title,
        description,
        category,
        startDate,
        endDate,
        location,
        budget,
        objectives,
        volunteersNeeded,
        submitter: user.id,
        organizationType,
        contactPerson,
        contactEmail,
        contactPhone,
        status: status || "pending",
        documents,
    });

    await proposal.save();

    // Async email notification
    sendNewProposalEmail(proposal, user);

    return proposal;
}

async function sendNewProposalEmail(proposal, user) {
    try {
        const reviewers = await User.find({ role: ROLES.REVIEWER });

        if (reviewers.length > 0) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                bcc: reviewers.map(r => r.email),
                subject: "New Partnership Proposal Submitted",
                text: `Hello Reviewer,\n\nA new partnership proposal titled "${proposal.title}" has been submitted by ${user.name || user.email} and is awaiting your review.\n\nView proposal here: ${process.env.FRONTEND_URL}/proposals/${proposal._id}\n\nRegards,\nCEDO Team`,
                html: `<p>Hello Reviewer,</p><p>A new partnership proposal titled "<strong>${proposal.title}</strong>" has been submitted by ${user.name || user.email} and is awaiting your review.</p><p><a href="${process.env.FRONTEND_URL}/proposals/${proposal._id}">View Proposal Details</a></p><p>Regards,<br>CEDO Team</p>`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Email notification failed:", error);
                } else {
                    console.log("Email notification sent:", info.response);
                }
            });
        } else {
            console.log("No users found with role 'reviewer' to notify.");
        }
    } catch (emailErr) {
        console.error("Error finding reviewers or preparing email:", emailErr.message);
    }
}

async function getProposals(user, filters) {
    const query = {};
    const requestingUserRole = user.role;

    if (requestingUserRole === ROLES.STUDENT || requestingUserRole === ROLES.PARTNER) {
        query.submitter = user.id;
    }

    if (filters.status) {
        query.status = filters.status;
    }
    if (filters.category) {
        query.category = filters.category;
    }
    if (filters.organizationType) {
        query.organizationType = filters.organizationType;
    }

    if (filters.search) {
        const searchRegex = new RegExp(filters.search, 'i');
        query.$or = [
            { title: searchRegex },
            { description: searchRegex },
        ];
    }

    const proposals = await Proposal.find(query)
        .populate("submitter", "name email organization")
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 });

    return proposals;
}

async function getProposalById(proposalId, user) {
    const proposal = await Proposal.findById(proposalId)
        .populate("submitter", "name email organization")
        .populate("assignedTo", "name email")
        .populate("reviewComments.reviewer", "name email role");

    if (!proposal) {
        return null;
    }

    if (user.role === ROLES.PARTNER && proposal.submitter && proposal.submitter._id.toString() !== user.id) {
        const error = new Error("Not authorized to view this proposal");
        error.statusCode = 403;
        throw error;
    }

    return proposal;
}

async function updateProposal(proposalId, user, updateData, files) {
    let proposal = await Proposal.findById(proposalId);
    if (!proposal) {
        throw new Error("Proposal not found");
    }

    const isOwner = proposal.submitter.toString() === user.id;
    const isAdminOrManager = [ROLES.HEAD_ADMIN, ROLES.MANAGER].includes(user.role);

    if (!isOwner && !isAdminOrManager) {
        const err = new Error("Not authorized to update this proposal");
        err.statusCode = 403;
        throw err;
    }

    if (isOwner && !["draft", "pending"].includes(proposal.status)) {
        const err = new Error("Cannot update proposals that are not in 'draft' or 'pending' status");
        err.statusCode = 403;
        throw err;
    }

    if (files && files.length > 0) {
        const newDocuments = files.map((file) => ({
            name: file.originalname,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size,
            uploadedAt: new Date(),
        }));
        updateData.documents = [...proposal.documents, ...newDocuments];
    }

    const updateFields = { ...updateData };
    if (!isAdminOrManager && updateFields.status !== undefined && updateFields.status !== proposal.status) {
        delete updateFields.status;
    }

    proposal = await Proposal.findByIdAndUpdate(
        proposalId,
        { $set: updateFields },
        { new: true, runValidators: true }
    );

    return proposal;
}

async function deleteProposal(proposalId, user) {
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
        throw new Error("Proposal not found");
    }

    const isOwner = proposal.submitter.toString() === user.id;
    const isAdminOrManager = [ROLES.HEAD_ADMIN, ROLES.MANAGER].includes(user.role);

    if (!isOwner && !isAdminOrManager) {
        const err = new Error("Not authorized to delete this proposal");
        err.statusCode = 403;
        throw err;
    }

    if (isOwner && !["draft", "pending"].includes(proposal.status)) {
        const err = new Error("Cannot delete proposals that have been approved or rejected");
        err.statusCode = 403;
        throw err;
    }

    const deleteFilePromises = proposal.documents.map((doc) => {
        return new Promise((resolve) => {
            fs.unlink(doc.path, (err) => {
                if (err) {
                    console.error(`Failed to delete file: ${doc.path}`, err.message);
                } else {
                    console.log(`Deleted file: ${doc.path}`);
                }
                resolve();
            });
        });
    });

    await Promise.all(deleteFilePromises);
    await Proposal.findByIdAndDelete(proposalId);

    return { msg: "Proposal removed" };
}

module.exports = {
    saveSection2Data,
    saveSection2OrgData,
    saveSection3EventData,
    getDebugProposalInfo,
    searchProposal,
    createProposal,
    getProposals,
    getProposalById,
    updateProposal,
    deleteProposal,
}; 