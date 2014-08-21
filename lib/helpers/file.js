"use strict";

var fs = require("fs");

var nodeZip = require('node-zip');



module.exports.save = function(data, cb) {
  var ziper = new nodeZip();
  ziper.file(GLOBAL.CURSOR_PATH, JSON.stringify(data));
  var zippedData = ziper.generate({base64: false, compression: 'DEFLATE'});
  fs.writeFile(GLOBAL.CURSOR_PATH, zippedData, 'binary', cb);
};

module.exports.saveSync = function(data) {
  var ziper = new nodeZip();
  ziper.file(GLOBAL.CURSOR_PATH, JSON.stringify(data));
  var zippedData = ziper.generate({base64: false, compression: 'DEFLATE'});
  fs.writeFileSync(GLOBAL.CURSOR_PATH, zippedData, 'binary');
};

module.exports.load = function(cb) {
  fs.readFile(GLOBAL.CURSOR_PATH, function(err, cursor) {
    if(err && err.code !== 'ENOENT') {
      cb(err);
    }
    else if(err && err.code === 'ENOENT') {
      // If their is no previous cursor, we send an empty cursor
      cb(null, {});
    }
    else {
      var ziper = new nodeZip();
      ziper.load(cursor, {base64: false, checkCRC32: true});
      cb(null, JSON.parse(ziper.files[GLOBAL.CURSOR_PATH]._data));
    }
  });
};

module.exports.loadSync = function() {
  var zipped = fs.readFile(GLOBAL.CURSOR_PATH);
  var ziper = new nodeZip();
  ziper.load(zipped, {base64: false, checkCRC32: true});
  return JSON.parse(ziper.files[GLOBAL.CURSOR_PATH]._data);
};
