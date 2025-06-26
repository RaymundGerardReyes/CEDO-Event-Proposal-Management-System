// The original implementation has been fully modularised into
//   backend/routes/mongodb-unified/*
// This file now simply re-exports the composed router so that
// existing `require('./routes/mongodb-unified-api')` statements
// keep working without changes elsewhere.
module.exports = require('./mongodb-unified'); 