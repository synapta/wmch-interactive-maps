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

// class Accumulator {
//     constructor() {
//         this.els = [];
//     }
//     push(el) {
//         this.els.push(el);
//         return;
//     }
// }

// let acc = new Accumulator();

function processDeepDiff(hists, finalCallback, passedResults) {
    let results = (typeof passedResults === 'undefined') ? [] : passedResults;
    let final = false;
    // Only 2 or more elements are comparable
    if (hists.length > 1) {
        try {
            let recordA = hists.shift();
            // console.log(recordA);
            // process.exit(1);
            let recordB = hists[0];  // keep for next check
            // console.log(recordA);
            // process.exit(1);
            util.log("Show diff between id %d and %d", recordA.get('id'), recordB.get('id'));
            let parsedA = JSON.parse(recordA.json);
            let parsedB = JSON.parse(recordB.json);
            let differences = deepd.diff(
              parsedA, // record A
              parsedB,  // record B
              // function (path, key) {  // prefilter
              //     // do nothing
              //     // if (key === 'wikidata') {
              //     //     return true;
              //     // }
              // }
              // acc
              // // function (path, key) {  // accumulator
              // // }
            );
            // console.log(differences);
            results.push(differences);
            // display diff
            let recArr = [recordA, recordB];
            for (rec of recArr) {
                let nomeFile = util.format("local/record_%d.json", rec.get('id'));
                fs.writeFile(nomeFile, JSON.stringify(JSON.parse(rec.json), 2, '\t'), (err) => {
                    // throws an error, you could also catch it here
                    if (err) throw err;

                    // success case, the file was saved
                    console.log('saved!');
                    processDeepDiff(hists, finalCallback, results);
                });
            }
        }
        catch (e) {
            util.debug("Cannot get diff, next");
            processDeepDiff(hists, finalCallback, results);
        }
    }
    else {
        util.debug("deep diff ok");
        finalCallback(results);
    }
}

exports.isStrictDifferent = isStrictDifferent;
exports.processDeepDiff = processDeepDiff;
