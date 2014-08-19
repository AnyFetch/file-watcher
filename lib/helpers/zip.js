"use strict";

var nodeZip = require('node-zip');

module.exports.zip = function(path, data) {
  var ziper = new nodeZip();
  ziper.file(path, data);
  return ziper.generate({base64: false, compression: 'DEFLATE'});
};


module.exports.unzip = function(path, data) {
  var ziper = new nodeZip();
  ziper.load(data, {base64: false, checkCRC32: true});
  return ziper.files[path]._data;
};
