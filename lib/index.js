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
    function populateFilesToUpload(files, cb) {
      var tasks = [];
      async.forEach(Object.keys(files), function(key, cb) {
        var task = {
          'dir': dir,
          'filePath': files[key],
          'accessToken': accessToken,
          'baseIdentifier': os.hostname()
        };
        fs.stat(dir + files[key], function(err, stat) {
          if(err) {
            return cb(err);
          }
          task.creationDate = stat.ctime;
          tasks.push(task);
          cb();
        });
      }, function(err) {
        cb(err, tasks);
      });
    },
    function uploadFiles(tasks, cb) {
      pushToQueue(tasks, cb);
    }
  ], cb);
};