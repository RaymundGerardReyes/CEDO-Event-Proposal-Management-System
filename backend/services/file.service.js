const Proposal = require("../models/Proposal");
const fs = require("fs");

async function addDocumentsToProposal(proposalId, user, files) {
    if (!files || files.length === 0) {
        const err = new Error("No documents uploaded");
        err.statusCode = 400;
        throw err;
    }

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
        throw new Error("Proposal not found");
    }

    const isOwner = proposal.submitter.toString() === user.id;
    const ROLES = require('../constants/roles');
    const isAdminOrManager = [ROLES.HEAD_ADMIN, ROLES.MANAGER].includes(user.role);

    if (!isOwner && !isAdminOrManager) {
        const err = new Error("Not authorized to add documents to this proposal");
        err.statusCode = 403;
        throw err;
    }

    const newDocuments = files.map((file) => ({
        name: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
    }));

    const updatedProposal = await Proposal.findByIdAndUpdate(
        proposalId,
        { $push: { documents: { $each: newDocuments } } },
        { new: true, runValidators: true }
    );

    return updatedProposal;
}

async function deleteDocumentFromProposal(proposalId, docId, user) {
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
        throw new Error("Proposal not found");
    }

    const isOwner = proposal.submitter.toString() === user.id;
    const ROLES = require('../constants/roles');
    const isAdminOrManager = [ROLES.HEAD_ADMIN, ROLES.MANAGER].includes(user.role);

    if (!isOwner && !isAdminOrManager) {
        const err = new Error("Not authorized to delete documents from this proposal");
        err.statusCode = 403;
        throw err;
    }

    const docIndex = proposal.documents.findIndex((doc) => doc._id && doc._id.toString() === docId);
    if (docIndex === -1) {
        const err = new Error("Document not found on this proposal");
        err.statusCode = 404;
        throw err;
    }

    const documentToDelete = proposal.documents[docIndex];
    fs.unlink(documentToDelete.path, (err) => {
        if (err) {
            console.error(`Failed to delete file from disk: ${documentToDelete.path}`, err.message);
        } else {
            console.log(`Deleted file from disk: ${documentToDelete.path}`);
        }
    });

    const updatedProposal = await Proposal.findByIdAndUpdate(
        proposalId,
        { $pull: { documents: { _id: docId } } },
        { new: true, runValidators: true }
    );

    return updatedProposal;
}

module.exports = {
    addDocumentsToProposal,
    deleteDocumentFromProposal,
}; 