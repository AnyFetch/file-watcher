"use strict";

var os = require('os');
var fs = require("fs");
var async = require('async');
var Anyfetch = require('anyfetch');

var retrieveFiles = require('./helpers/list-files').retrieveFiles;
var queues = require('./helpers/upload');
var pushToUploadQueue = queues.pushToUploadQueue;
var pushToDeleteQueue = queues.pushToDeleteQueue;
var file = require('./helpers/file');
var watcher = require('./watcher');
var config = require('../config.js');

Anyfetch.setApiUrl(config.apiUrl);


var init = function(accessToken, watched_dir, cb) {
  async.waterfall([
    function initGlabals(cb) {
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
    function checkToken(cb) {
      var anyfetch = new Anyfetch(GLOBAL.ACCESS_TOKEN);
      anyfetch.getIndex(function(err, res) {
        //Not in waterfall cause to better logs
        if(err && res.statusCode === 401) {
          console.warn("Invalid token !");
        }
        if(!err) {
          GLOBAL.ACCOUNT = res.body.user_email;
          console.log("Sending file to " + GLOBAL.ACCOUNT);
        }
        cb(err);
      });
    },
    function loadCursor(cb) {
      file.load(cb);
    },
  ], cb);
};

var sendToAnyFetch = function(cb) {
  async.waterfall([
    function updateCursor(cb) {
      retrieveFiles(cb);
    },
    function populateFilesToUpload(filesToUpload, filesToDelete, cb) {
      var tasks = [];
      Object.keys(filesToUpload).forEach(function(filePath) {
        var task = {
          filePath: filePath,
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
          baseIdentifier: os.hostname()
        };
        pushToDeleteQueue(task);
      });
      cb();
    }
  ], cb);
};

module.exports = init;

module.exports.watch = watcher;
module.exports.sendToAnyFetch = sendToAnyFetch;
