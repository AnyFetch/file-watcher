"use strict";
var fs = require('fs');
var async = require('async');
var os = require('os');

var retrieveFiles = require('./helpers/list-files').retrieveFiles;
var pushToQueue = require('./helpers/upload');
var saveCursor = require('./helpers/save-path');
var getSavePath = saveCursor.getSavePath;


module.exports = function update(dir, accessToken, cb) {
  async.waterfall([
    function getOldCursor(cb) {
      fs.readFile(getSavePath(dir), function(err, cursor) {
        if(err && err.code !== 'ENOENT') {
          cb(err);
        }
        else {
          cb(null, cursor);
        }
      });
    },
    function updateCursor(oldCursor, cb) {
      retrieveFiles(dir, oldCursor, cb);
    },
    function saveNewCursor(filesToUpload, newCursor, cb) {
      saveCursor(dir, newCursor, function(err) {
        cb(err, filesToUpload);
      });
    },
    function uploadFiles(files, cb) {
      files.forEach(function(key) {
        var task = {
          'dir': dir,
          'filePath': key,
          'accessToken': accessToken,
          'baseIdentifier': os.hostname()
        };
        pushToQueue(task);
      });
      cb();
    }
  ], cb);
};
