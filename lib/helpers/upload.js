"use strict";

var Anyfetch = require('anyfetch');

var path = require('path');
var async = require('async');

var cursor = require('./cursor');
var incrementialSave = cursor.incrementialSave;

Anyfetch.setApiUrl(require('../../config.js').apiUrl);

var uploadFile = function(filePath, baseIdentifier, creationDate, cb) {

  var absolutePath = filePath;
  if(filePath.indexOf(GLOBAL.WATCHED_DIR) === -1) {
    //if the file path is relative
    absolutePath = GLOBAL.WATCHED_DIR + filePath;
  }

  async.waterfall([
    function sendFile(cb) {
      var anyfetch = new Anyfetch(GLOBAL.ACCESS_TOKEN);

      var title = path.basename(filePath, path.extname(filePath));
      title = title.replace(/(_|-|\.)/g, ' ');
      title = title.charAt(0).toUpperCase() + title.slice(1);

      // Send a document to anyFetch
      var document = {
        identifier: baseIdentifier + filePath,
        document_type: 'file',
        creation_date: creationDate,
        metadata: {
          title: title
        }
      };

      var fileConfig = {
        file: absolutePath,
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
      file[filePath] = {date: creationDate};
      incrementialSave(file, cursor.ADD, cb);
    }
  ], function(err) {
    if(err) {
      console.warn('Error while upping', filePath, ': ', err);
    }
    cb();
  });
};

var deleteFile = function(filePath, baseIdentifier, cb) {
  if(filePath.indexOf(GLOBAL.WATCHED_DIR) !== -1) {
    //if the file path is absolute
    filePath = "/" + path.relative(GLOBAL.WATCHED_DIR, filePath);
  }

  async.waterfall([
    function deleteFile(cb) {
      var anyfetch = new Anyfetch(GLOBAL.ACCESS_TOKEN);
      anyfetch.deleteDocumentByIdentifier(baseIdentifier + filePath, function(err, res) {
        if(err && res.statusCode === 404) {
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
  uploadFile(task.filePath, task.baseIdentifier, task.creationDate, cb);
}, 4);

var deleteQueue = async.queue(function worker(task, cb) {
  deleteFile(task.filePath, task.baseIdentifier, cb);
}, 4);

// usefull ?
module.exports.pushToUploadQueue = function pushToUploadQueue(tasks) {
  uploadQueue.push(tasks);
};

module.exports.pushToDeleteQueue = function pushToDeleteQueue(tasks) {
  deleteQueue.push(tasks);
};

module.exports.uploadFile = uploadFile;
module.exports.deleteFile = deleteFile;
