const request = require('request');

function getJSONfromQuery(encodedQuery, caller) {
  /**
   *  Get values for map, edit or add.
   *  @param {integer} id Map primary key on database, numeric integer.
   *  @return {Promise} Promise of an object containing:
          object['error'] true | false
          object['errormsg'] error message
          object['errorcode'] HTTP error code from Wikidata
          object['errorarr'] HTTP error code from Wikidata
          object['data'] The result object from Wikidata if any
   **/
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

        function apiDataProcess() {
            /**
             *  Return array .
             *  @return {Array}: Array of objects with parsed and enriched results from Wikidata.
             **/
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

        function orderLangs(jsonResults) {
            /**
             *  Order langs array to allow successful comparison as JSON string.
             *  @param {Array} jsonResults: Array of objects with parsed and enriched results from Wikidata.
             *  @return {Array}: the source array, with ordered properties.langs
             **/
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

exports.getJSONfromQuery = getJSONfromQuery;
