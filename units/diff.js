const assert = require('assert').strict;
const deepd  = require('deep-diff');
const util   = require('util');

function isStrictDifferent(before, after) {
  /**
   *  Check if two objects, or any other types, are identical or not.
   *  {a: 1} vs {a: "1"} = true
   *  {a: "1"} vs {a: "1"} = false
   *  {a: [1,2,3]} vs {a: [1,3,2]} = true
   *
   *  @param {any} before e.g. object to compare with after
   *  @param {any} after e.g. object
   *  @return {boolean} true if objects contents are different, false if aren't
   **/
    try {
        assert.deepStrictEqual(before, after);
        return false;
    }
    catch (e) {
        return true;
    }
}

function removePostProcess(wikidataResult) {
  /**
  * Convert array to object for comparison with ordered elements
  *
  *  @param {object} wikidataResult object results from wikidata
  *  @return {object} object without .postProcess field
   **/
   for (ob of wikidataResult.data) {
      delete ob.postProcess;
   }
   return wikidataResult;
}

function wdarr2obj(arr) {
    /**
    * Convert array to object for comparison with ordered elements
    *
    *  @param {array} arr array of wikidata results
    *  @return {object} object with wikidata id as key
     **/
    let ob = {};
    for (el of arr) {
        let wdId = el.properties.wikidata;
        ob[wdId] = el;
    }
    return ob;
}

function wddiff2obj(arr) {
    /**
    * Convert array of array to array of objects with wikidata id as key.
    *
    *  @param {array} arr array of diff records
    *  @return {object} object of diff records
     **/
    let ars = [];
    for (els of arr) {
        if (typeof els !== 'undefined') {
            let ob = {};
            for (el of els) {
              let wdId = el.path[0];
              ob[wdId] = el;
            }
            ars.push(ob);
        }
    }
    return ars;
}

function processDeepDiff(jsons, finalCallback, passedResults) {
    /**
    * Analyze History looking for differences between versions
    *
    *  @param {array} jsons array of jsons
    *  @param {function} finalCallback callback to call at the very end, with
    *                    results as returned argument populated with differences
    *                    by deep-diff
    *  @param {array} passedResults array of differences generated with
    *                 deep-diff against an object mapped with wikidata Q
    *  @return nothing, see finalCallback
    **/
    let results = (typeof passedResults === 'undefined') ? [] : passedResults;
    let final = false;
    // Only 2 or more elements are comparable
    if (jsons.length > 1) {
            let recordA = jsons.shift();
            let recordB = jsons[0];  // keep for next check
            let parsedA = wdarr2obj(recordA.data);
            let parsedB = wdarr2obj(recordB.data);
            let differences = deepd.diff(
              parsedA, // record A
              parsedB,  // record B
              // XXX not working ignore the generated postProcess field
              // (path, key) => path.length === 0 && ~['postProcess'].indexOf(key)
              // function (path, key) { return true | false }  // prefilter
              // function () { ??? }  // accumulator
            );
            results.push(differences);
            processDeepDiff(jsons, finalCallback, results);
    }
    else {
        util.debug("deep diff ok");
        for (r of results) {
            console.log(r);
        }
        finalCallback(wddiff2obj(results));
    }
}

exports.isStrictDifferent = isStrictDifferent;
exports.processDeepDiff = processDeepDiff;
exports.removePostProcess = removePostProcess;
