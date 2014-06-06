"use strict";

var async = require('async');
var os = require('os');

var retrieveFiles = require('./helpers/list-files').retrieveFiles;
var queues = require('./helpers/upload');
var pushToUploadQueue = queues.pushToUploadQueue;
var pushToDeleteQueue = queues.pushToDeleteQueue;
var getCursor = require('./helpers/cursor').getCursor;


module.exports = function update(dir, accessToken, cb) {
  async.waterfall([
    function getOldCursor(cb) {
      getCursor(dir, cb);
    },
    function updateCursor(oldCursor, cb) {
      retrieveFiles(dir, oldCursor, cb);
    },
    function populateFilesToUpload(filesToUpload, filesToDelete, cb) {
      var tasks = [];
      Object.keys(filesToUpload).forEach(function(filePath) {
        var task = {
          dir: dir,
          filePath: filePath,
          accessToken: accessToken,
          baseIdentifier: os.hostname(),
          creationDate: filesToUpload[filePath]
        };
        tasks.push(task);
      });
      pushToUploadQueue(tasks);
      cb(null, filesToDelete);
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
