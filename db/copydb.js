"use strict";
/**
 * Usage: node copydb.js
 */
const {migrate, connection} = require("./modelsB.js");

(async() => {
    // create tables
    await migrate()
    // TODO: populate tables from database to databaseB
    // ...
    // close connection (must be the last line)
    await connection.close()
})();