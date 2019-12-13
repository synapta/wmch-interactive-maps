const assert = require('assert').strict;

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
