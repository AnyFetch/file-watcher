"use strict";

var DEFAULT_DIR = '/tmp/anyfetch-file-watcher';

require('should');
var fs = require('fs');

var fileWatcher = require('../lib');
before(function() {
	try {
		fs.mkdirSync(DEFAULT_DIR);
	}
	catch(e) {
		// Pass if error is "dir exists"
		if(e.toString().indexOf('EEXIST') === -1) {
			throw e;
		}
	}
});

describe('File watcher', function() {
	it('should ping callback on file added', function(done) {
		var watcher = fileWatcher(DEFAULT_DIR, function(event, filename) {
			console.log(event, filename);
			watcher.close();
			done();
		});

		// Create fake file
		fs.writeFileSync(DEFAULT_DIR + "/lol", "lol");
	});
});
