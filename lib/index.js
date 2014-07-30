"use strict";

var async = require('async');
var os = require('os');
var Anyfetch = require('anyfetch');

var retrieveFiles = require('./helpers/list-files').retrieveFiles;
var queues = require('./helpers/upload');
var pushToUploadQueue = queues.pushToUploadQueue;
var pushToDeleteQueue = queues.pushToDeleteQueue;
var getCursor = require('./helpers/cursor').getCursor;
var watcher = require('./watcher');
var config = require('../config.js');

Anyfetch.setApiUrl(config.apiUrl);

var sendToAnyFetch = function(dir, accessToken, cb) {
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

module.exports = function start(dir, token, cb) {
  async.waterfall([
    function checkToken(cb) {
      var anyfetch = new Anyfetch(token);
      anyfetch.getIndex(function(err, res) {
        if(err && res.statusCode === 401) {
          console.log("Invalid token !");
          console.log(token);
        }
        if(!err) {
          console.log("Sending file to " + res.body.user_email);
        }
        cb(err);
      });
    },
    function sendLocalFiles(cb) {
      // Check the modifications in the directory at start
      sendToAnyFetch(dir, token, cb);
    },
    function watchlocalfiles(cb) {
      // Watch in real time modifications
      watcher(dir, token);
      cb();
    }
  ], cb);
};
