"use strict";

var Anyfetch = require('anyfetch');

var path = require('path');
var async = require('async');

var incrementialSave = require('./cursor').incrementialSave;

if(process.env.API_URL) {
  Anyfetch.setApiUrl(process.env.API_URL);
}

var uploadFile = function(dir, filePath, accessToken, baseIdentifier, creationDate, cb) {
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
        file: dir + filePath,
        filename: path.basename(dir + filePath),
      };
      anyfetch.sendDocumentAndFile(document, fileConfig, cb);
    },
    function log(document, cb) {
      console.log("UPPING ", dir + filePath);
      cb();
    },
    function save(cb) {
      var file = {};
      file[filePath] = creationDate;
      incrementialSave(dir, file, cb);
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
  var anyfetch = new Anyfetch(accessToken);

  anyfetch.deleteDocumentByIdentifier(baseIdentifier + filePath, function(err) {
    console.log("DELETING", filePath);
    if(err) {
      console.warn(err);
      process.exit(1);
    }
    cb();
  });
};

var uploadQueue = async.queue(function worker(task, cb) {
  uploadFile(task.dir || "", task.filePath, task.accessToken, task.baseIdentifier, task.creationDate, cb);
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
