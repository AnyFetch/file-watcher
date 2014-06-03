"use strict";
var fs = require('fs');

module.exports = function fileWatcher(dirname, cb) {
	return fs.watch(dirname, cb);
};
