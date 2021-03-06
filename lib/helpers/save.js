"use strict";

var fs = require("fs");
var async = require("async");

var nodeZip = require('node-zip');

var incrementialSave = function(cb) {
  incrementialSave.count += 1;
  if(incrementialSave.count === incrementialSave.size) {
    incrementialSave.count = 0;
    return module.exports.save(cb);
  }
  cb();
};
incrementialSave.size = process.env.BULK_SAVE || 20;
incrementialSave.count = 0;

module.exports = incrementialSave;

module.exports.save = function(cb) {
  console.log("Saving...");
  async.waterfall([
    function zipFile(cb) {
      var ziper = new nodeZip();
      ziper.file(GLOBAL.CURSOR_PATH, JSON.stringify(GLOBAL.CURSOR));
      cb(null, ziper.generate({base64: false, compression: 'DEFLATE'}));
    },
    function writeFile(zippedData, cb) {
      fs.writeFile(GLOBAL.CURSOR_PATH, zippedData, 'binary', cb);
    },
    function resetSaveCount(cb) {
      incrementialSave.count = 0;
      cb();
    }
  ], cb);
};



// If we want to save on a ctrl+c or shutdown, we can't use async functions
module.exports.saveSync = function() {
  console.log("Saving...");
  var ziper = new nodeZip();
  ziper.file(GLOBAL.CURSOR_PATH, JSON.stringify(GLOBAL.CURSOR));
  var zippedData = ziper.generate({base64: false, compression: 'DEFLATE'});
  fs.writeFileSync(GLOBAL.CURSOR_PATH, zippedData, 'binary');
  incrementialSave.count = 0;
};

module.exports.load = function(cb) {
  fs.readFile(GLOBAL.CURSOR_PATH, function(err, cursor) {
    if(err && err.code !== 'ENOENT') {
      cb(err);
    }
    else if(err && err.code === 'ENOENT') {
      // If their is no previous cursor, we send an empty cursor
      GLOBAL.CURSOR = {};
      //console.log(cb)
      cb(null);
    }
    else {
      var ziper = new nodeZip();
      ziper.load(cursor, {base64: false, checkCRC32: true});
      GLOBAL.CURSOR = JSON.parse(ziper.files[GLOBAL.CURSOR_PATH]._data);
      cb(null);
    }
  });
};

process.on('SIGINT', function() {
  module.exports.saveSync();
  process.exit(0);
});

process.on('SIGTERM', function() {
  module.exports.saveSync();
  process.exit(0);
});
