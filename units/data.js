const util        = require('util');
const request     = require('request');
const dbinit      = require('../db/init');
const localconfig = dbinit.init();

/**
 * Get values for map, edit or add.
 * @param  {integer} encodedQuery encoded query for wikidata
 * @param  {text} caller       caller (message for debug purposes)
 * @return {Promise}           promise with results
 */
function getJSONfromQuery(encodedQuery, caller) {
    console.log("Caller:\n", caller, "query:\n", encodedQuery, "\n-----------");
    return new Promise((resolve, reject) => {
        // encodeURIComponent(query) non necessario
        let jsonRes = [];
        let arr = [];
        let errorObj = {
          code: 400,
          arr: []
        };
        let options = {
            url: "https://query.wikidata.org/sparql?query=" + encodedQuery,
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'wmch-interactive-maps'
            }
        };

        /**
         * Map results from arr, populating jsonRes.
         * @return {Array} Array of objects with parsed and enriched results from Wikidata.
         */
        function apiDataProcess() {
            var oldQid;
            var isNewQid = true;

            for (let i = 0; i < arr.length; i++) {
                if (oldQid !== arr[i].item.value && oldQid !== undefined) {
                    isNewQid = true;
                    jsonRes.push(obj);
                }

                if (isNewQid) {
                    oldQid = arr[i].item.value;
                    isNewQid = false;
                    var obj = {};

                    obj.type = "Feature";

                    obj.properties = {};
                    obj.properties.name = arr[i].itemLabel.value;
                    obj.properties.wikidata = arr[i].item.value.replace("http://www.wikidata.org/entity/","");
                    if (arr[i].commons !== undefined) obj.properties.commons = arr[i].commons.value;
                    if (arr[i].website !== undefined) obj.properties.website = arr[i].website.value;
                    if (arr[i].img !== undefined) obj.properties.image = arr[i].img.value;
                    obj.properties.lang = [];
                    if (arr[i].lang !== undefined) obj.properties.lang.push(arr[i].lang.value);

                    obj.geometry = {};
                    obj.geometry.type = "Point";

                    let coordArray = [];
                    coordArray.push(arr[i].coord.value.split(" ")[0].replace("Point(",""));
                    coordArray.push(arr[i].coord.value.split(" ")[1].replace(")",""));
                    obj.geometry.coordinates = coordArray;
                } else {
                    if (arr[i].lang !== undefined) obj.properties.lang.push(arr[i].lang.value);
                    // check existing values to avoid duplicates
                    obj.properties.lang = obj.properties.lang.filter(function(elem, pos) {
                        return obj.properties.lang.indexOf(elem) == pos;
                    })
                }

                if (i === arr.length -1) jsonRes.push(obj);
            }
            return jsonRes;
        }

        /**
         * Order langs array to allow successful comparison as JSON string.
         * @param  {Array} jsonResults Array of objects with parsed and enriched results from Wikidata.
         * @return {Array}            the source array, with ordered properties.langs
         */
        function orderLangs(jsonResults) {
             for (feature of jsonResults) {
                 // see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
                 feature.properties.lang.sort(function(a, b) {
                   var nameA = a.toUpperCase(); // ignore upper and lowercase
                   var nameB = b.toUpperCase(); // ignore upper and lowercase
                   if (nameA < nameB) {
                     return -1;
                   }
                   if (nameA > nameB) {
                     return 1;
                   }

                   // names must be equal
                   return 0;
                 });
             }
             return jsonResults;
        }

        request(options, function (error, response, body) {
            let result = {};
            try {
                let res = JSON.parse(body);
                arr = res.results.bindings;
            }
            catch (e) {
                error = true;
            }
            if (error) {
                // error response
                result['error'] = true;
                result['errorcode'] = errorObj.code;
                result['errorarr'] = errorObj.arr;
                result['errormsg'] = error;
                resolve(result);
            }
            else {
                result['error'] = false;
                result['data'] = orderLangs(apiDataProcess());
                resolve(result);
            }
        });
    });
}

/**
 * Return an object containing the converted JSON result on route with req parameters
 * @param  {[type]} route route to call
 * @param  {[type]} req   Express request object
 * @return {[type]}       Object
 */
function getJSONfromInternalUrl(route, previousReq) {
    return new Promise((resolve, reject) => {
        let options = {
            // re-encode component decoded by express, @see http://expressjs.com/en/api.html#req
            url: util.format("%s/api/data/?q=%s", localconfig.url, encodeURIComponent(previousReq.query.q)),
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'wmch-interactive-maps'
            }
        };
        request(options, function (error, response, body) {
            // results are already parsed in previous call (only wikidataResult.data returned)
            resolve(JSON.parse(body));
        });
    });
}

exports.getJSONfromQuery = getJSONfromQuery;
exports.getJSONfromInternalUrl = getJSONfromInternalUrl;
