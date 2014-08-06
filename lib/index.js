"use strict";

var async = require('async');
var os = require('os');
var Anyfetch = require('anyfetch');

var retrieveFiles = require('./helpers/list-files').retrieveFiles;
var queues = require('./helpers/upload');
var pushToUploadQueue = queues.pushToUploadQueue;
var pushToDeleteQueue = queues.pushToDeleteQueue;
var cursor = require('./helpers/cursor');
var getCursor = cursor.getCursor;
var watcher = require('./watcher');
var config = require('../config.js');

Anyfetch.setApiUrl(config.apiUrl);

var sendToAnyFetch = function(accessToken, cb) {
  async.waterfall([
    function getOldCursor(cb) {
      getCursor(cb);
    },
    function updateCursor(oldCursor, cb) {
      retrieveFiles(oldCursor, cb);
    },
    function populateFilesToUpload(filesToUpload, filesToDelete, cb) {
      var tasks = [];
      Object.keys(filesToUpload).forEach(function(filePath) {
        var task = {
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

var start = function start(dir, token, cb) {
  async.waterfall([
    function checkToken(cb) {
      var anyfetch = new Anyfetch(token);
      anyfetch.getIndex(function(err, res) {
        if(err && res.statusCode === 401) {
          console.warn("Invalid token !");
        }
        if(!err) {
          console.log("Sending file to " + res.body.user_email);
          GLOBAL.ACCOUNT = res.body.user_email;
          GLOBAL.WATCHED_DIR = dir;
        }
        cb(err);
      });
    },
    function sendLocalFiles(cb) {
      // Check the modifications in the directory at start
      sendToAnyFetch(token, cb);
    },
    function watchlocalfiles(cb) {
      // Watch in real time modifications
      watcher(token);
      cb();
    }
  ], cb);
};

module.exports = start;

module.exports.sendToAnyFetch = sendToAnyFetch;
