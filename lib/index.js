"use strict";
var fs = require('fs');
var async = require('async');
var os = require('os');

var retrieveFiles = require('./helpers/list-files').retrieveFiles;
var queues = require('./helpers/upload');
var pushToUploadQueue = queues.pushToUploadQueue;
var pushToDeleteQueue = queues.pushToDeleteQueue;
var saveCursor = require('./helpers/save-path');
var getSavePath = saveCursor.getSavePath;


module.exports = function update(dir, accessToken, cb) {
  async.waterfall([
    function getOldCursor(cb) {
      fs.readFile(getSavePath(dir), function(err, cursor) {
        if(err && err.code !== 'ENOENT') {
          cb(err);
        }
        else if(err && err.code === 'ENOENT') {
          cb(null, null);
        }
        else {
          cb(null, JSON.parse(cursor.toString()));
        }
      });
    },
    function updateCursor(oldCursor, cb) {
      retrieveFiles(dir, oldCursor, cb);
    },
    function saveNewCursor(filesToUpload, filesToDelete, newCursor, cb) {
      saveCursor(dir, newCursor, function(err) {
        cb(err, filesToUpload, filesToDelete);
      });
    },
    function populateFilesToUpload(filesToUpload, filesToDelete, cb) {
      var tasks = [];
      async.each(filesToUpload, function(file, cb) {
        var task = {
          dir: dir,
          filePath: file,
          accessToken: accessToken,
          baseIdentifier: os.hostname()
        };
        fs.stat(dir + file, function(err, stat) {
          if(err) {
            return cb(err);
          }
          task.creationDate = stat.ctime;
          tasks.push(task);
          cb();
        });
      }, function uploadFiles(err) {
        if(err) {
          return cb(err);
        }
        pushToUploadQueue(tasks);
        cb(null, filesToDelete);
      });
    },
    function deleteFiles(filesToDelete, cb) {
      filesToDelete.forEach(function(file) {
        var task = {
          filePath: file,
          accessToken: accessToken,
          baseIdentifier: os.hostname()
        };
        pushToDeleteQueue(task);
      });
      cb();
    }
  ], cb);
};
