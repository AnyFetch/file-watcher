"use strict";

var Anyfetch = require('anyfetch');

var path = require('path');
var async = require('async');

var cursor = require('./cursor');
var incrementialSave = cursor.incrementialSave;

Anyfetch.setApiUrl(require('../../config.js').apiUrl);

var uploadFile = function(filePath, accessToken, baseIdentifier, creationDate, cb) {
  var WATCHED_DIR = GLOBAL.WATCHED_DIR;

  if(filePath.indexOf(WATCHED_DIR) === -1) {
    //if the file path is relative
    filePath = WATCHED_DIR + filePath;
  }

  async.waterfall([
    function sendFile(cb) {
      var anyfetch = new Anyfetch(accessToken);

      // Send a document to anyFetch
      var document = {
        identifier: baseIdentifier + filePath,
        document_type: 'file',
        creation_date: creationDate
      };

      var fileConfig = {
        file: filePath,
        filename: path.basename(filePath),
      };
      anyfetch.sendDocumentAndFile(document, fileConfig, cb);
    },
    function log(document, cb) {
      console.log("UPPING ", filePath);
      cb();
    },
    function save(cb) {
      var file = {};
      file[filePath] = creationDate;
      incrementialSave(file, cursor.ADD, cb);
    }
  ], function(err) {
    if(err) {
      console.warn(err);
      process.exit(1);
    }
    cb();
  });
};

var deleteFile = function(filePath, accessToken, baseIdentifier, cb) {
  async.waterfall([
    function deleteFile(cb) {
      var anyfetch = new Anyfetch(accessToken);
      anyfetch.deleteDocumentByIdentifier(baseIdentifier + filePath, function(err, res) {
        if(err && res.statusCode !== 404) {
          err = null;
        }
        cb(err);
      });
    },
    function log(cb) {
      console.log("DELETING", filePath);
      cb();
    },
    function save(cb) {
      incrementialSave(filePath, cursor.DELETION, cb);
    }
  ], cb);
};

var uploadQueue = async.queue(function worker(task, cb) {
  uploadFile(task.filePath, task.accessToken, task.baseIdentifier, task.creationDate, cb);
}, 4);

var deleteQueue = async.queue(function worker(task, cb) {
  deleteFile(task.filePath, task.accessToken, task.baseIdentifier, cb);
}, 4);

module.exports.pushToUploadQueue = function pushToUploadQueue(tasks) {
  uploadQueue.push(tasks);
};

module.exports.pushToDeleteQueue = function pushToDeleteQueue(tasks) {
  deleteQueue.push(tasks);
};

module.exports.uploadFile = uploadFile;
module.exports.deleteFile = deleteFile;
