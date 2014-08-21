"use strict";

var watch = require('watch');
var os = require('os');

var queues = require('./helpers/upload');
var pushToUploadQueue = queues.pushToUploadQueue;
var pushToDeleteQueue = queues.pushToDeleteQueue;

var watcher = function() {
  console.log("WATCHING ", GLOBAL.WATCHED_DIR);

  watch.createMonitor(GLOBAL.WATCHED_DIR, {skipUnreadableDir: true}, function(monitor) {
    monitor.on("created", function(file, stat) {
      var task = {
        filePath: file,
        creationDate: stat.ctime.getTime(),
        modificationDate: stat.mtime.getTime(),
        baseIdentifier: os.hostname()
      };
      pushToUploadQueue(task);
    });
    monitor.on("changed", function(file, current) {
      var task = {
        filePath: file,
        creationDate: current.ctime.getTime(),
        modificationDate: current.mtime.getTime(),
        baseIdentifier: os.hostname()
      };
      pushToUploadQueue(task);
    });
    monitor.on("removed", function(file) {
      var task = {
        filePath: file,
        baseIdentifier: os.hostname()
      };
      pushToDeleteQueue(task);
    });
  });
};

module.exports = watcher;
