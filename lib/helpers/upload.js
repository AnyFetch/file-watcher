"use strict";

var AnyfetchClient = require('anyfetch');
var fs = require('fs');
var path = require('path');
var async = require('async');

var uploadFile = function(dir, filePath, accessToken, baseIdentifier, cb) {
  var anyfetch = new AnyfetchClient();
  anyfetch.setAccessToken(accessToken);

  // Send a document to anyFetch
  var document = {
    'identifier': baseIdentifier + filePath,
  };

  var fileConfig = function() {
    // Wrap this in a function to avoid creating the stream before reading it.
    return {
      file: fs.createReadStream(dir + filePath),
      filename: path.basename(dir + filePath),
    };
  };

  anyfetch.sendDocumentAndFile(document, fileConfig, function(err) {
    console.log("UPPING,", path.basename(dir + filePath));
    cb(err);
  });
};

var queue = async.queue(function worker(task, cb) {
  uploadFile(task.dir, task.filePath, task.accessToken, task.baseIdentifier, cb);
}, 4);

module.exports = function pushInQueue(task) {
  queue.push(task);
};

module.exports.uploadFile = uploadFile;
