"use strict";
/**
 * API for Express
 */
const fs = require('fs');
const {migrate, connection, Map, History, Category, MapCategory} = require("./modelsB.js");
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
 * Update a list of records an pop one after another until it's consumed.
 * Then send a response with the outcome.
 * @param  {array} records        list of records
 * @return Express send the outcome (an Object with updateNumer: COUNT)
 */
    async function updateMaps(records) {
    let count = 0
    for (const record of records) {
        const [affectedCount, affectedRows] = await Map.update(
            {
                sticky: record.sticky,
                history: record.history,
                published: record.published
            }, /* set attributes' value */
            { where: { id: record.id }} /* where criteria */
        );
        count += affectedCount;
    }
    return {error: false, updateNumber: count};
}

/**
 * 
 * @param {Array} records Array of records from admin UI
 * @param {String} modelName modelname
 */
    function getRecordsForModel(records, modelName) {
    return records.filter(record => record.model === modelName)
}

/**
 * 
 * @param {Array} records 
 * @return {Object}
 */
async function deleteCategories(records) {  
    let errors = 0;    
    let idsToDelete = records.filter(record => record.delete).map(record => record.id)
    try {
        await query.deleteCategory(...idsToDelete);
    }
    catch(e) {
        errors++;
    }
    return {error: errors > 0};
}


/**
 * 
 * @param {Array} records 
 * @return {Object}
 */
async function addCategories(records) {  
    let errors = 0;
    let count = 0;       
    let recordsToAdd = records.filter(record => !record.delete && !record.hasOwnProperty('id'))
    for (const record of recordsToAdd) {
        try {
            await Category.create({
                "name": record.name
            });
            count++;
        }
        catch(e) {
            errors++;
        }
    }
    return {error: errors > 0};
}


/**
 * 
 * @param {Array} records 
 * @return {Object}
 */
 async function updateCategories(records) {  
    let errors = 0; 
    let count = 0;   
    let recordsToUpdate = records.filter(record => !record.delete && record.hasOwnProperty('id'))
    for (const record of recordsToUpdate) {
        try {
            await Category.update({
                "name": record.name,
                "sticky": record.sticky
            }, {
                "where": {"id": record.id}
            });
            count++;
        }
        catch(e) {
            errors++;
        }
    }
    return {error: errors > 0};
}


/**
 * 
 * @param {Array} records 
 * @return {Object}
 */
 async function updateMapCategory(records) {
    for (const record of records) {
        if (record.id && record.category) {
            await query.setMapCategory(record.id, record.category);
        }
        else {
            logger.debug("Prevent empty error on updateMapCategory, record is:");
            logger.debug(records);
        }
    }
}


/**
 * Update multiple records.
 * 
 * @param {*} req 
 * @param {*} res 
 */
 async function admin_api_action_update (req, res) {
    let hasErrors = false;
    try {
        console.log(req.body.records)
        const categoryRecords = getRecordsForModel(req.body.records, 'category');
        const mapRecords = getRecordsForModel(req.body.records, 'map');

        let msgCat1 = await deleteCategories(categoryRecords);
        let msgCat2 = await addCategories(categoryRecords);
        let msgCat3 = await updateCategories(categoryRecords);
        
        let msgMap1 = await updateMaps(mapRecords);

        /** merge errors on response **/
        hasErrors = msgCat1.error || msgCat2.error || msgCat3.error || msgMap1.error //|| msgMap2.error;
        if (hasErrors) {
            logger.debug(msgCat1.error,msgCat2.error,msgCat3.error, msgMap1.error)
            // TODO: nuova categoria
            // false true false false
            throw `errors on update`;
        }
        res.send({
            error: hasErrors
        });
    }
    catch (e) {
        logger.debug(e)
        res.status(500).send({
            error: true
        });
    }
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
