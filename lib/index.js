"use strict";

var async = require('async');
var os = require('os');
var fs = require("fs");
var Anyfetch = require('anyfetch');

var retrieveFiles = require('./helpers/list-files').retrieveFiles;
var queues = require('./helpers/upload');
var pushToUploadQueue = queues.pushToUploadQueue;
var pushToDeleteQueue = queues.pushToDeleteQueue;
var file = require('./helpers/file');
var watcher = require('./watcher');
var config = require('../config.js');

Anyfetch.setApiUrl(config.apiUrl);


var getCursorPath = function() {
  var homeDir = process.env.HOMEPATH || process.env.HOME;
  if(!fs.existsSync(homeDir + "/.anyfetch-file-watcher/")) {
    fs.mkdirSync(homeDir + "/.anyfetch-file-watcher/");
  }
  return homeDir + "/.anyfetch-file-watcher/" + GLOBAL.WATCHED_DIR.trim().replace(/(\/|\\)/g, '') + '-' + GLOBAL.ACCOUNT;
};

var init = function(accessToken, watched_dir, account) {
  GLOBAL.ACCESS_TOKEN = accessToken;
  GLOBAL.ACCOUNT = account;
  GLOBAL.WATCHED_DIR = watched_dir;
  GLOBAL.CURSOR_PATH = getCursorPath();
};

var sendToAnyFetch = function(cb) {
  async.waterfall([
    function getOldCursor(cb) {
      file.load(cb);
    },
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

var start = function(dir, token, cb) {
  async.waterfall([
    function checkToken(cb) {
      var anyfetch = new Anyfetch(token);
      anyfetch.getIndex(function(err, res) {
        //Not in waterfall cause to better log
        if(err && res.statusCode === 401) {
          console.warn("Invalid token !");
        }
        if(!err) {
          init(token, dir, res.body.user_email);
          console.log("Sending file to " + GLOBAL.ACCOUNT);
        }
        cb(err);
      });
    },
    function sendLocalFiles(cb) {
      // Check the modifications in the directory at start
      sendToAnyFetch(cb);
    },
    function watchlocalfiles(cb) {
      // Watch in real time modifications
      watcher();
      cb();
    }
  ], cb);
};

module.exports = start;
module.exports.init = init;

module.exports.sendToAnyFetch = sendToAnyFetch;
module.exports.getCursorPath = getCursorPath;
