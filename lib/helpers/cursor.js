"use strict";
var fs = require('fs');
var async = require('async');
var os = require('os');

var retrieveFiles = require('./list-files').retrieveFiles;
var pushToQueue = require('./upload');


var getSavePath = function(dir) {
  var homeDir = process.env.HOMEPATH || process.env.HOME;
  if(!getSavePath.hasMkdir) {
    try {
      fs.mkdirSync(homeDir + "/.anyfetch-file-watcher/");
    }
    catch(err) {}
    getSavePath.hasMkdir = true;
  }
  return homeDir + "/.anyfetch-file-watcher/" + dir.trim().replace(/(\/|\\)/g, '');
};
getSavePath.hasMkdir = false;


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
      fs.writeFile(getSavePath(dir), JSON.stringify(newCursor), function(err) {
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
