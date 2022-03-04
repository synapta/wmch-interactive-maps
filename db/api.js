"use strict";
/**
 * API for Express
 */
const fs = require('fs');
const {migrate, connection, Map, History, Category} = require("./modelsB.js");
const query = require("./query.js");
const { logger } = require('../units/logger');


// Get /////////////////////////////////////////////////////
/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns {Object} with exists flag, or a message 
 */
async function admin_api_get_map (req, res) {
    if (req.query.path) {
        const map = await query.mapByPath(req.query.path, req.query.id);
        res.send({
            "exists": map ? true : false
        });
    }
    else {
        res.status(400).send({"message": "Invalid request"})
    }
}

async function admin_api_get_categories (req, res) {
    /** Get all Category records **/
    const categories = await query.getAllCategories();
    /** Remap to consume on wizard category search */
    res.send(categories.map(category => new Object({"title": category.name, "id": category.id})));
}


exports.adminApiGetName = (req, res) => {
    let fun = eval('admin_api_get_' + req.params.name);
    try {
        fun(req, res);
    }
    catch (e) {
        // Function not found, pass
        res.send("Error")
    }
}
// Action //////////////////////////////////////////////////

/**
 * Update multiple records.
 * 
 * @param {*} req 
 * @param {*} res 
 */
 async function admin_api_action_update (req, res) {
    /** Save all Category records **/
    const categoryRecords = getRecordsForModel(req.body.records, 'category');
    /** Save all Map records **/
    const mapRecords = getRecordsForModel(req.body.records, 'map');
    // console.log(mapRecords);  // DEBUG
    const updatedRecordsMessage = await updateMapsList(mapRecords);
    // console.log(categoryRecords);  // DEBUG
    const updatedCategoriesMessage = await updateOrAddCategories(categoryRecords);
    /** merge errors on response **/
    res.send({
        error: updatedRecordsMessage.error || updatedCategoriesMessage.error, 
        updateNumber: updatedRecordsMessage.count + updatedCategoriesMessage.count
    });
}

function admin_api_action_undelete (req, res, published=true) {
    admin_api_action_delete(req, res, published);
}

function admin_api_action_delete (req, res, published=false) {
    // move to Draft
    console.log(req.body);
    Map.update(
        { published: published }, /* set attributes' value */
        { where: { id: req.body.id }} /* where criteria */
        ).then(([affectedCount, affectedRows]) => {
            // Notice that affectedRows will only be defined in dialects which support returning: true
            // affectedCount will be n
            res.send({error: false, updateNumber: affectedCount});
        });
}

exports.adminApiAction = (req, res) => {
    let fun = eval('admin_api_action_' + req.params.action);
    try {
        fun(req, res);
    }
    catch (e) {
        // Function not found, pass
        res.send("Error");
    }
}
