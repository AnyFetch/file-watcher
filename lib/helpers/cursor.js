"use strict";
var fs = require('fs');
var async = require('async');
var os = require('os');

var retrieveFiles = require('./list-files').retrieveFiles;
var pushInQueue = require('./upload');

var hasMkdir = false;

var getSavePath = function(dir) {
  var homedir = (process.platform === 'win32' || process.platform === 'win64') ? process.env.HOMEPATH : process.env.HOME;
  if(!hasMkdir) {
    try {
      fs.mkdirSync(homedir + "/.anyfetch-file-watcher/");
    }
    catch(err) {}
    hasMkdir = true;
  }
  return homedir + "/.anyfetch-file-watcher/" + dir.trim().replace(/\//g, '').replace(/\\/g, '');
};

module.exports = function update(dir, accessToken, cb) {
  async.waterfall([
    function getOldCursor(cb) {
      fs.readFile(getSavePath(dir), function(err) {
        if(err && err.code !== 'ENOENT') {
          cb(err);
        }
        else {
          cb(null, null);
        }
      });
    },
    function updateCursor(oldCursor, cb) {
      retrieveFiles(dir, oldCursor, cb);
    },
    function deleteOldCursor(filesToUpload, newCursor, cb) {
      if(fs.exists(getSavePath(dir))) {
        fs.unlink(getSavePath(dir), function(err) {
          cb(err, filesToUpload, newCursor);
        });
      }
      else {
        cb(null, filesToUpload, newCursor);
      }

    },
    function saveNewCursor(filesToUpload, newCursor, cb) {
      fs.writeFile(getSavePath(dir), JSON.stringify(newCursor), function(err) {
        cb(err, filesToUpload);
      });
    },
    function uploadFiles(files, cb) {
      Object.keys(files).forEach(function(key) {
        var task = {
          'filePath': key,
          'accessToken': accessToken,
          'baseIdentifier': os.hostname()
        };
        pushInQueue(task);
      });
      cb();
    }
  ], cb);
};