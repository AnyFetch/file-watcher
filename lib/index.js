"use strict";

var os = require('os');
var fs = require("fs");
var async = require('async');
var Anyfetch = require('anyfetch');

var retrieveFiles = require('./helpers/list-files').retrieveFiles;
var queues = require('./helpers/upload');
var uploadQueue = queues.uploadQueue;
var deleteQueue = queues.deleteQueue;
var save = require('./helpers/save');
var watcher = require('./watcher');
var config = require('../config.js');

Anyfetch.setApiUrl(config.apiUrl);


module.exports = function init(accessToken, watched_dir, cb) {
  async.waterfall([
    function checkToken(cb) {
      var anyfetch = new Anyfetch(accessToken);
      anyfetch.getIndex(function(err, res) {
        //Not in waterfall to improve logging
        if(err && res && res.statusCode === 401) {
          console.warn("Invalid token !");
          process.exit(0);
        }
        if(!err) {
          GLOBAL.ACCOUNT = res.body.user_email;
          console.log("Sending files to " + GLOBAL.ACCOUNT);
        }
        cb(err);
      });
    },
    function initGlobals(cb) {
      GLOBAL.CURSOR = {};
      GLOBAL.ACCESS_TOKEN = accessToken;
      GLOBAL.WATCHED_DIR = watched_dir;
      var homeDir = process.env.HOMEPATH || process.env.HOME;
      if(!fs.existsSync(homeDir + "/.anyfetch-file-watcher/")) {
        fs.mkdirSync(homeDir + "/.anyfetch-file-watcher/");
      }
      GLOBAL.CURSOR_PATH = homeDir + "/.anyfetch-file-watcher/" + GLOBAL.WATCHED_DIR.trim().replace(/(\/|\\)/g, '') + '-' + GLOBAL.ACCOUNT;
      cb();
    },
    function loadCursor(cb) {
      save.load(cb);
    },
  ], cb);
};

module.exports.sendNewOrUpdatedFiles = function(cb) {
  async.waterfall([
    function updateCursor(cb) {
      retrieveFiles(cb);
    },
    function populateFilesToUpload(filesToUpload, filesToDelete, cb) {
      Object.keys(filesToUpload).forEach(function(filePath) {
        var task = {
          filePath: filePath,
          baseIdentifier: os.hostname(),
          creationDate: filesToUpload[filePath]
        };
        uploadQueue.push(task);
      });
      cb(null, filesToDelete);
    },
    function deleteFiles(filesToDelete, cb) {
      filesToDelete.forEach(function(file) {
        var task = {
          filePath: file,
          baseIdentifier: os.hostname()
        };
        deleteQueue.push(task);
      });
      cb();
    }
  ], cb);
};

module.exports.watch = watcher;
