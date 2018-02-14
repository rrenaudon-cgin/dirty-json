// Copyright 2015, 2014 Ryan Marcus
// This file is part of dirty-json.
//
// dirty-json is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// dirty-json is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with dirty-json.  If not, see <http://www.gnu.org/licenses/>.

"use strict";

var parser = require("./parser");

module.exports.parse = parse;
function parse(text, fallback) {
  return parser.parse(text).catch(function(e) {
    // our parser threw an error! see if the JSON was valid...
    /* istanbul ignore next */
    if (fallback === false) {
      console.log("throwing!!!");
      throw e;
    }

    try {
      var json = JSON.parse(text);
      // if we didn't throw, it was valid JSON!
      /* istanbul ignore next */
      console.warn(
        "dirty-json got valid JSON that failed with the custom parser. We're returning the valid JSON, but please file a bug report here: https://github.com/RyanMarcus/dirty-json/issues  -- the JSON that caused the failure was: " +
          text
      );

      /* istanbul ignore next */
      return json;
    } catch (json_error) {
      throw e;
    }
  });
}

//console.log(JSON.stringify(JSON.parse('["\\" \\\\\ \\/ \\b \\f \\n \\r \\t"]')));
//parse('["\\" \\\\\ \\/ \\b \\f \\n \\r \\t"]').then(JSON.stringify).then(console.log).catch(console.err);
