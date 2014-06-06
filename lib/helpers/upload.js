"use strict";

var AnyfetchClient = require('anyfetch');
var fs = require('fs');
var path = require('path');
var async = require('async');

var uploadFile = function(dir, filePath, accessToken, baseIdentifier, creationDate, cb) {
  var anyfetch = new AnyfetchClient();
  anyfetch.setAccessToken(accessToken);

  // Send a document to anyFetch
  var document = {
    identifier: baseIdentifier + filePath,
    document_type: 'file',
    creation_date: creationDate
  };

  var fileConfig = function() {
    // Wrap this in a function to avoid creating the stream before reading it.
    return {
      file: fs.createReadStream(dir + filePath),
      filename: path.basename(dir + filePath),
    };
  };

  anyfetch.sendDocumentAndFile(document, fileConfig, function(err) {
    console.log("UPPING ", dir + filePath);
    if(err) {
      console.warn(err);
      process.exit(1);
    }
    cb();
  });
};

var deleteFile = function(filePath, accessToken, baseIdentifier, cb) {
  var anyfetch = new AnyfetchClient();
  anyfetch.setAccessToken(accessToken);

  anyfetch.deleteDocument(baseIdentifier + filePath, function(err) {
    console.log("DELETING", filePath);
    console.warn(err);
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