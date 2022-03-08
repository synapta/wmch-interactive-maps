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
 * Update a list of records an pop one after another until it's consumed.
 * Then send a response with the outcome.
 * @param  {array} records        list of records
 * @return Express send the outcome (an Object with updateNumer: COUNT)
 */
    async function updateMapsList(records) {
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
        // Reassign categories for this map
        /** if (record.hasOwnProperty('category')) {
            console.log(`${record.id} ${record.category}`)
            await query.setMapCategory(record.id, record.category);
        } **/
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
     * @return {Object} Express object to send the outcome (an Object with updateNumer: COUNT)
     */
     async function updateOrAddCategories(records) {      
        let errors = 0;
        let count = 0;
        console.log("Da aggiornare / aggiungere")
        for (const record of records.filter(record => !record.delete)) {
            console.log(record)
        }
        console.log("Da cancellare")
        for (const record of records.filter(record => record.delete)) {
            console.log(record)
        }
        /** const [instance, created] = await MyModel.upsert({
            // your new row data here
        }); **/

        /** for (const record of records.filter(record => !record.delete)) {
            if (record.hasOwnProperty('id')) {
                // Update existing
                await Category.update({
                        sticky: record.sticky,
                        name: record.name
                    }, {
                    where: {
                        id: record.id
                    }
                });
                count++;
            }
            else {
                // Create new
                if (typeof record.name === "string" && record.name.length > 0) {
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
            }
        }
        const idsToDelete = records.filter(record => record.delete === true).map(record => record.id);
        await query.deleteCategory(...idsToDelete); **/
        // return {error: errors > 0, updateNumber: count, deleteNumber: idsToDelete.length};
        return {error: errors > 0};
    }

/**
 * Update multiple records.
 * 
 * @param {*} req 
 * @param {*} res 
 */
 async function admin_api_action_update (req, res) {
    let hasErrors = true;
    let updateNumber = 0;
    try {
        /** Save all Category records **/
        const categoryRecords = getRecordsForModel(req.body.records, 'category');
        /** Save all Map records **/
        const mapRecords = getRecordsForModel(req.body.records, 'map');
        // console.log(mapRecords);  // DEBUG
        const updatedRecordsMessage = await updateMapsList(mapRecords);
        // console.log(categoryRecords);  // DEBUG
        const updatedCategoriesMessage = await updateOrAddCategories(categoryRecords);
        /** merge errors on response **/
        hasErrors = updatedRecordsMessage.error || updatedCategoriesMessage.error;
        updateNumber = updatedRecordsMessage.count + updatedCategoriesMessage.count;
        if (hasErrors) {
            throw `errors on update`;
        }
        res.send({
            error: hasErrors, 
            updateNumber: updateNumber
        });
    }
    catch (e) {
        logger.debug(e)
        res.status(500).send({
            error: hasErrors, 
            updateNumber: updateNumber
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
