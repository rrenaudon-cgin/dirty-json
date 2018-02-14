// Copyright 2016, 2015, 2014 Ryan Marcus
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

var _typeof =
  typeof Symbol === "function" && typeof Symbol.iterator === "symbol"
    ? function(obj) {
        return typeof obj;
      }
    : function(obj) {
        return obj &&
        typeof Symbol === "function" &&
        obj.constructor === Symbol &&
        obj !== Symbol.prototype
          ? "symbol"
          : typeof obj;
      };

var lexer = require("./lexer");
var Q = require("q");

// terminals
var LEX_KV = 0;
var LEX_KVLIST = 1;
var LEX_VLIST = 2;
var LEX_BOOLEAN = 3;
var LEX_COVALUE = 4;
var LEX_CVALUE = 5;
var LEX_FLOAT = 6;
var LEX_INT = 7;
var LEX_KEY = 8;
var LEX_LIST = 9;
var LEX_OBJ = 10;
var LEX_QUOTE = 11;
var LEX_RB = 12;
var LEX_RCB = 13;
var LEX_TOKEN = 14;
var LEX_VALUE = 15;

// non-terminals
var LEX_COLON = -1;
var LEX_COMMA = -2;
var LEX_LCB = -3;
var LEX_LB = -4;
var LEX_DOT = -5;

Array.prototype.peek = function() {
  return this[this.length - 1];
};

Array.prototype.last = function(i) {
  return this[this.length - (1 + i)];
};

function is(obj, prop) {
  return obj && obj.hasOwnProperty("type") && obj.type == prop;
}

function log(str) {
  //console.log(str);
}

module.exports.parse = parse;
function parse(text) {
  var toR = Q.defer();

  var stack = [];

  var tokens = [];
  var emit = function emit(t) {
    tokens.push(t);
  };

  try {
    lexer.lexString(text, emit);

    for (var i = 0; i < tokens.length; i++) {
      log("Shifting " + tokens[i].type);
      stack.push(tokens[i]);
      log(stack);
      log("Reducing...");
      while (reduce(stack)) {
        log(stack);
        log("Reducing...");
      }
    }

    toR.resolve(compileOST(stack[0]));
  } catch (e) {
    toR.reject(e);
  }

  return toR.promise;
}

function reduce(stack) {
  var next = stack.pop();

  switch (next.type) {
    case LEX_KEY:
      if (next.value == "true") {
        log("Rule 5");
        stack.push({ type: LEX_BOOLEAN, value: "true" });
        return true;
      }

      if (next.value == "false") {
        log("Rule 6");
        stack.push({ type: LEX_BOOLEAN, value: "false" });
        return true;
      }

      if (next.value == "null") {
        log("Rule 7");
        stack.push({ type: LEX_VALUE, value: null });
        return true;
      }
      break;

    case LEX_TOKEN:
      if (is(stack.peek(), LEX_KEY)) {
        log("Rule 11a");
        stack.peek().value += next.value;
        return true;
      }

      log("Rule 11c");
      stack.push({ type: LEX_KEY, value: [next.value] });
      return true;

    case LEX_INT:
      if (is(next, LEX_INT) && is(stack.peek(), LEX_KEY)) {
        log("Rule 11b");
        stack.peek().value += next.value;
        return true;
      }

      log("Rule 11f");
      next.type = LEX_VALUE;
      stack.push(next);
      return true;

    case LEX_QUOTE:
      log("Rule 11d");
      next.type = LEX_VALUE;
      next.value = next.value;
      stack.push(next);
      return true;

    case LEX_BOOLEAN:
      log("Rule 11e");
      next.type = LEX_VALUE;

      if (next.value == "true") {
        next.value = true;
      } else {
        next.value = false;
      }

      stack.push(next);
      return true;

    case LEX_FLOAT:
      log("Rule 11g");
      next.type = LEX_VALUE;
      stack.push(next);
      return true;

    case LEX_VALUE:
      if (is(stack.peek(), LEX_COMMA)) {
        log("Rule 12");
        next.type = LEX_CVALUE;
        stack.pop();
        stack.push(next);
        return true;
      }

      if (is(stack.peek(), LEX_COLON)) {
        log("Rule 13");
        next.type = LEX_COVALUE;
        stack.pop();
        stack.push(next);
        return true;
      }

      if (is(stack.peek(), LEX_KEY) && is(stack.last(1), LEX_VALUE)) {
        log("Error rule 1");
        var middleVal = stack.pop();
        stack.peek().value += '"' + middleVal.value + '"';
        stack.peek().value += next.value;
        return true;
      }

      if (is(stack.peek(), LEX_KEY) && is(stack.last(1), LEX_VLIST)) {
        log("Error rule 2");
        var _middleVal = stack.pop();
        var oldLastVal = stack.peek().value.pop();
        oldLastVal += '"' + _middleVal.value + '"';
        oldLastVal += next.value;

        stack.peek().value.push(oldLastVal);

        return true;
      }

      if (is(stack.peek(), LEX_KEY) && is(stack.last(1), LEX_KVLIST)) {
        log("Error rule 3");
        var _middleVal2 = stack.pop();
        var _oldLastVal = stack.peek().value.pop();
        _oldLastVal.value += '"' + _middleVal2.value + '"';
        _oldLastVal.value += next.value;

        stack.peek().value.push(_oldLastVal);

        return true;
      }

      if (is(stack.peek(), LEX_KEY)) {
        log("Error rule 4");
        var keyValue = stack.pop().value;
        next.value = keyValue + next.value;
        stack.push(next);
        return true;
      }

      break;

    case LEX_LIST:
      if (is(next, LEX_LIST) && is(stack.peek(), LEX_COMMA)) {
        log("Rule 12a");
        next.type = LEX_CVALUE;
        stack.pop();
        stack.push(next);
        return true;
      }

      if (is(stack.peek(), LEX_COLON)) {
        log("Rule 13a");
        next.type = LEX_COVALUE;
        stack.pop();
        stack.push(next);
        return true;
      }
      break;

    case LEX_OBJ:
      if (is(stack.peek(), LEX_COMMA)) {
        log("Rule 12b");
        var toPush = { type: LEX_CVALUE, value: next };
        stack.pop();
        stack.push(toPush);
        return true;
      }

      if (is(stack.peek(), LEX_COLON)) {
        log("Rule 13b");
        var _toPush = { type: LEX_COVALUE, value: next };
        stack.pop();
        stack.push(_toPush);
        return true;
      }
      break;

    case LEX_CVALUE:
      if (is(stack.peek(), LEX_VLIST)) {
        log("Rule 14");
        stack.peek().value.push(next.value);
        return true;
      }

      log("Rule 15");
      stack.push({ type: LEX_VLIST, value: [next.value] });
      return true;

    case LEX_VLIST:
      if (is(stack.peek(), LEX_VALUE)) {
        log("Rule 15a");
        next.value.unshift(stack.peek().value);
        stack.pop();
        stack.push(next);
        return true;
      }

      if (is(stack.peek(), LEX_LIST)) {
        log("Rule 15b");
        next.value.unshift(stack.peek().value);
        stack.pop();
        stack.push(next);
        return true;
      }

      if (is(stack.peek(), LEX_OBJ)) {
        log("Rule 15c");
        next.value.unshift(stack.peek());
        stack.pop();
        stack.push(next);
        return true;
      }

      if (is(stack.peek(), LEX_KEY) && (stack.last(1), LEX_COMMA)) {
        log("Error rule 7");
        var l = stack.pop();
        //stack.pop();
        stack.push({ type: LEX_VALUE, value: l.value });
        log("Start subreduce... (" + l.value + ")");
        while (reduce(stack)) {}
        log("End subreduce");
        stack.push(next);

        return true;
      }

      if (is(stack.peek(), LEX_VLIST)) {
        log("Error rule 8");
        stack.peek().value.push(next.value[0]);
        return true;
      }
      break;

    case LEX_COVALUE:
      if (
        is(stack.peek(), LEX_KEY) ||
        is(stack.peek(), LEX_VALUE) ||
        is(stack.peek(), LEX_VLIST)
      ) {
        log("Rule 16");
        var key = stack.pop();
        stack.push({ type: LEX_KV, key: key.value, value: next.value });
        return true;
      }

      throw new Error("Got a :value that can't be handled");

    case LEX_KV:
      if (is(stack.last(0), LEX_COMMA) && is(stack.last(1), LEX_KVLIST)) {
        log("Rule 17");
        stack.last(1).value.push(next);
        stack.pop();
        return true;
      }

      log("Rule 18");
      stack.push({ type: LEX_KVLIST, value: [next] });
      return true;

    case LEX_KVLIST:
      if (is(stack.peek(), LEX_KVLIST)) {
        log("Rule 17a");
        next.value.forEach(function(i) {
          stack.peek().value.push(i);
        });

        return true;
      }

      break;

    case LEX_RB:
      if (is(stack.peek(), LEX_VLIST) && is(stack.last(1), LEX_LB)) {
        log("Rule 19");
        var _l = stack.pop();
        stack.pop();
        stack.push({ type: LEX_LIST, value: _l.value });
        return true;
      }

      if (is(stack.peek(), LEX_LIST) && is(stack.last(1), LEX_LB)) {
        log("Rule 19b");
        var _l2 = stack.pop();
        stack.pop();
        stack.push({ type: LEX_LIST, value: [_l2.value] });
        return true;
      }

      if (is(stack.peek(), LEX_LB)) {
        log("Rule 22");
        stack.pop();
        stack.push({ type: LEX_LIST, value: [] });
        return true;
      }

      if (is(stack.peek(), LEX_VALUE) && is(stack.last(1), LEX_LB)) {
        log("Rule 23");
        var val = stack.pop().value;
        stack.pop();
        stack.push({ type: LEX_LIST, value: [val] });
        return true;
      }

      if (is(stack.peek(), LEX_OBJ) && is(stack.last(1), LEX_LB)) {
        log("Rule 23b");
        var _val = stack.pop();
        stack.pop();
        stack.push({ type: LEX_LIST, value: [_val] });
        return true;
      }

      if (is(stack.peek(), LEX_KEY) && (stack.last(1), LEX_COMMA)) {
        log("Error rule 5");
        var _l3 = stack.pop();
        //stack.pop();
        stack.push({ type: LEX_VALUE, value: _l3.value });
        log("Start subreduce... (" + _l3.value + ")");
        while (reduce(stack)) {}
        log("End subreduce");
        stack.push({ type: LEX_RB });
        return true;
      }

      break;

    case LEX_RCB:
      if (is(stack.peek(), LEX_KVLIST) && (stack.last(1), LEX_LCB)) {
        log("Rule 20");
        var _l4 = stack.pop();
        stack.pop();
        stack.push({ type: LEX_OBJ, value: _l4.value });
        return true;
      }

      if (is(stack.peek(), LEX_LCB)) {
        log("Rule 21");
        stack.pop();
        stack.push({ type: LEX_OBJ, value: null });
        return true;
      }

      if (is(stack.peek(), LEX_KEY) && (stack.last(1), LEX_COLON)) {
        log("Error rule 4");
        var _l5 = stack.pop();
        //stack.pop();
        stack.push({ type: LEX_VALUE, value: _l5.value });
        log("Start subreduce... (" + _l5.value + ")");
        while (reduce(stack)) {}
        log("End subreduce");
        stack.push({ type: LEX_RCB });
        return true;
      }

      throw new Error("Found } that I can't handle.");

    case LEX_COMMA:
      if (is(stack.peek(), LEX_COMMA)) {
        log("Comma error rule");
        // do nothing -- so don't push the extra comma onto the stack
        return true;
      }
  }

  stack.push(next);
  return false;
}

function compileOST(tree) {
  var rawTypes = ["boolean", "number", "string"];

  if (
    rawTypes.indexOf(
      typeof tree === "undefined" ? "undefined" : _typeof(tree)
    ) != -1
  )
    return tree;

  if (tree === null) return null;

  if (Array.isArray(tree)) {
    var toR = [];
    while (tree.length > 0) {
      toR.unshift(compileOST(tree.pop()));
    }
    return toR;
  }

  if (is(tree, LEX_OBJ)) {
    var _toR = {};
    if (tree.value === null) return {};
    tree.value.forEach(function(i) {
      _toR[i.key] = compileOST(i.value);
    });
    return _toR;
  }

  if (is(tree, LEX_LIST)) {
    return compileOST(tree.value);
  }

  // it must be a value
  return tree.value;
}
