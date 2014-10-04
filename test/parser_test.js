var assert = require("assert");
var parser = require("../parser");


function compareResults(json, done) {
	parser.parse(json).then(function (res) {
		jeq(res, JSON.parse(json));
	}).then(done, done);
}

function compareResultsToValid(invalid, valid, done) {
	// confirm that the invalid json is invalid
	try {
		var j = JSON.parse(invalid);
		// it didn't fail!
		done("json was valid!");
	} catch (e) {
		parser.parse(invalid).then(function (res) {
			jeq(res, JSON.parse(valid));
		}).then(done, done);
	}


}

function jeq(obj1, obj2) {
	assert.equal(JSON.stringify(obj1), JSON.stringify(obj2));
}

describe("parser", function () {
	describe("parse() on valid JSON", function (done) {
		it('should handle an empty object', function (done) {
			compareResults("{}", done);
		});

		
		it('should handle an empty list', function (done) {
			compareResults("[]", done);
		});

		it('should handle an single-item list', function (done) {
			compareResults("[4]", done);
		});

		it('should handle an single-item object', function (done) {
			compareResults("{ \"test\": 4 }", done);
		});

		it('should handle a list of numbers', function (done) {
			compareResults("[3, 4, -2, 5.5, 0.5, 0.32]", done);
		});

		it('should handle a list of numbers and strings', function (done) {
			compareResults("[3, 4, -2, \"5.5\", 0.5, 0.32]", done);
		});

		it('should handle a list of numbers, strings, and booleans', function (done) {
			compareResults("[3, 4, -2, \"5.5\", 0.5, false]", done);
		});

		it('should handle a list of numbers, strings, and booleans', function (done) {
			compareResults('["some text", 4, "some more text", "text"]', done);
		});

		it('should handle a list of numbers, strings, and booleans', function (done) {
			compareResults('["[],4,5", "false", ","]', done);
		});

		it('should handle an object with mixed values', function (done) {
			compareResults('{ "test": 56, "test2": "hello!", "test3": false }', done);
		});

		it('should handle an object with list values', function (done) {
			compareResults('{ "test": [3, "str", false, 0.5], "test2": [1, 2, "str2"] }', done);
		});

		it('should handle embedded objects', function (done) {
			compareResults('{ "test": { "test": [1, 2, 3] } }', done);
		});

		it('should handle embedded lists', function (done) {
			compareResults('[1, 2, [3, 4], 5]', done);
		});

		it('should handle embedded lists when the first item is a list', function (done) {
			compareResults('[[1, false], 2, [3, 4], 5]', done);
		});


		it('should handle objects embedded in lists', function (done) {
			compareResults('[2, {"test": "str"}]', done);
		});

		it('should handle objects embedded in lists', function (done) {
			compareResults('[{"test": "str"}, 2, [3, {"test2": "str2"}], 5]', done);
		});


		it('should handle a complex JSON structure', function (done) {
			compareResults('[{"test": "str"}, [2, false, 0.4], [3, {"test2": ["str2", 6]}], 5]', done);
		});

		it('should handle a complex JSON structure', function (done) {
			compareResults('[{"test": "str"}, [2, false, ",", 0.4, "[val]"], [3, {"test2": ["str2", 6]}], 5]', done);
		});

	});

	describe("parse() on invalid JSON", function (done) {
		it('should handle non-quoted object keys', function(done) {
			compareResultsToValid('{test: 5}', '{"test": 5}', done);
		});

		it('should handle single-quoted object keys', function(done) {
			compareResultsToValid('{\'test\': 5}', '{"test": 5}', done);
		});


		it('should handle single-quoted object values', function(done) {
			compareResultsToValid('{\'test\': \'5\'}', '{"test": "5"}', done);
		});

		it('should handle quotes-in-quotes (list)', function(done) {
			compareResultsToValid('["some "quoted" text"]', '["some \\"quoted\\" text"]', done);
		});

		it('should handle quotes-in-quotes (list)', function(done) {
			compareResultsToValid('[3, "some "quoted" text", 2]', '[3, "some \\"quoted\\" text", 2]', done);
		});

		it('should handle quotes-in-quotes (object)', function(done) {
			compareResultsToValid('{"test": "some "quoted" text"}', '{"test": "some \\"quoted\\" text"}', done);
		});

		it('should handle quotes-in-quotes (object)', function(done) {
			compareResultsToValid('{"test0": false, "test": "some "quoted" text", "test1": 5}', '{"test0": false, "test": "some \\"quoted\\" text", "test1": 5}', done);
		});


		
	});
});