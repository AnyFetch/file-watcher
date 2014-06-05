"use strict";

var watch = require('watch');
var os = require('os');

var queues = require('./helpers/upload');
var pushToUploadQueue = queues.pushToUploadQueue;
var pushToDeleteQueue = queues.pushToDeleteQueue;

var cursor = require('./helpers/cursor');


var watcher = function(dir, accessToken) {
  console.log("WATCHING ",dir);
  watch.createMonitor(dir, function (monitor) {
    monitor.on("created", function (file, stat) {
      var task = {
        filePath: file,
        creationDate: stat.ctime,
        accessToken: accessToken,
        baseIdentifier: os.hostname()
      };
      pushToUploadQueue(task);

      cursor.addOrUpdateFile(dir, file, stat.mtime, function() {});
    });
    monitor.on("changed", function (file, current, previous) {
      var task = {
        filePath: file,
        accessToken: accessToken,
        baseIdentifier: os.hostname()
      };
      pushToUploadQueue(task);
      cursor.addOrUpdateFile(dir, file, previous.mtime, function() {});
    });
    monitor.on("removed", function (file) {
      var task = {
        filePath: file,
        accessToken: accessToken,
        baseIdentifier: os.hostname()
      };
      pushToDeleteQueue(task);
      cursor.removeFile(dir, file, function() {});
    });
  });
};

module.exports = watcher;
