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

var Q = require("q");
var Lexer = require("lex");
var unescapeJs = require("unescape-js");
var utf8 = require("utf8");

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

var lexMap = {
  ":": { type: LEX_COLON },
  ",": { type: LEX_COMMA },
  "{": { type: LEX_LCB },
  "}": { type: LEX_RCB },
  "[": { type: LEX_LB },
  "]": { type: LEX_RB },
  ".": {
    type: LEX_DOT // TODO: remove?
  }
};

var lexSpc = [
  [/:/, LEX_COLON],
  [/,/, LEX_COMMA],
  [/{/, LEX_LCB],
  [/}/, LEX_RCB],
  [/\[/, LEX_LB],
  [/\]/, LEX_RB],
  [/\./, LEX_DOT] // TODO: remove?
];

function parseString(str) {
  // unescape-js doesn't cover the \/ case, but we will here.
  str = str.replace(/\\\//, "/");
  return unescapeJs(str);
}

function getLexer(string) {
  var lexer = new Lexer();
  lexer.addRule(/"((?:\\.|[^"])*)($|")/, function(lexeme, txt) {
    return { type: LEX_QUOTE, value: parseString(txt) };
  });

  lexer.addRule(/'((?:\\.|[^'])*)($|')/, function(lexeme, txt) {
    return { type: LEX_QUOTE, value: parseString(txt) };
  });

  // floats with a dot
  lexer.addRule(/[\-0-9]*\.[0-9]*([eE][\+\-]?)?[0-9]*/, function(lexeme) {
    return { type: LEX_FLOAT, value: parseFloat(lexeme) };
  });

  // floats without a dot but with e notation
  lexer.addRule(/\-?[0-9]+([eE][\+\-]?)[0-9]*/, function(lexeme) {
    return { type: LEX_FLOAT, value: parseFloat(lexeme) };
  });

  lexer.addRule(/[\-0-9]+/, function(lexeme) {
    return { type: LEX_INT, value: parseInt(lexeme) };
  });

  lexSpc.forEach(function(item) {
    lexer.addRule(item[0], function(lexeme) {
      return { type: item[1], value: lexeme };
    });
  });

  lexer.addRule(/\s/, function(lexeme) {
    // chomp whitespace...
  });

  lexer.addRule(/./, function(lexeme) {
    var lt = LEX_TOKEN;
    var val = lexeme;

    return { type: lt, value: val };
  });

  lexer.setInput(string);

  return lexer;
}

module.exports.lexString = lexString;
function lexString(str, emit) {
  var lex = getLexer(str);

  var token = "";
  while ((token = lex.lex())) {
    emit(token);
  }
}

module.exports.getAllTokens = getAllTokens;
function getAllTokens(str) {
  var toR = Q.defer();

  var arr = [];
  var emit = function emit(i) {
    arr.push(i);
  };

  lexString(str, emit);

  toR.resolve(arr);
  return toR.promise;
}
