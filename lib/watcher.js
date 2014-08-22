"use strict";

var watch = require('watch');
var os = require('os');

var queues = require('./helpers/upload');
var uploadQueue = queues.uploadQueue;
var deleteQueue = queues.deleteQueue;

module.exports = function watcher() {
  console.log("WATCHING ", GLOBAL.WATCHED_DIR);

  watch.createMonitor(GLOBAL.WATCHED_DIR, {skipUnreadableDir: true}, function(monitor) {
    monitor.on("created", function(file, stat) {
      var task = {
        filePath: file,
        creationDate: stat.ctime.getTime(),
        modificationDate: stat.mtime.getTime(),
        baseIdentifier: os.hostname()
      };
      uploadQueue.push(task);
    });
    monitor.on("changed", function(file, current) {
      var task = {
        filePath: file,
        creationDate: current.ctime.getTime(),
        modificationDate: current.mtime.getTime(),
        baseIdentifier: os.hostname()
      };
      uploadQueue.push(task);
    });
    monitor.on("removed", function(file) {
      var task = {
        filePath: file,
        baseIdentifier: os.hostname()
      };
      deleteQueue.push(task);
    });
  });
};
