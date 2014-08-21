"use strict";

var fs = require("fs");
var async = require("async");

var nodeZip = require('node-zip');
var incrementialSave = require('./cursor').incrementialSave;


module.exports.save = function(cb) {
  async.waterfall([
    function zipFile(cb) {
      var ziper = new nodeZip();
      ziper.file(GLOBAL.CURSOR_PATH, JSON.stringify(GLOBAL.CURSOR));
      cb(null, ziper.generate({base64: false, compression: 'DEFLATE'}));
    },
    function writeFile(zippedData, cb) {
      fs.writeFile(GLOBAL.CURSOR_PATH, zippedData, 'binary', cb);
    },
    function emitSavingEvent(cb) {
      incrementialSave.save.emit('saving');
      cb();
    }
  ], cb);
};

module.exports.saveSync = function() {
  var ziper = new nodeZip();
  ziper.file(GLOBAL.CURSOR_PATH, JSON.stringify(GLOBAL.CURSOR));
  var zippedData = ziper.generate({base64: false, compression: 'DEFLATE'});
  fs.writeFileSync(GLOBAL.CURSOR_PATH, zippedData, 'binary');
  incrementialSave.save.emit('saving');
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
