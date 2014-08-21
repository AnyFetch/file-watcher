"use strict";

var watch = require('watch');
var os = require('os');

var queues = require('./helpers/upload');
var pushToUploadQueue = queues.pushToUploadQueue;
var pushToDeleteQueue = queues.pushToDeleteQueue;

var cursor = require('./helpers/cursor');


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
      //push to Queue shloud call himself addOrUpdate
      pushToUploadQueue(task);
      cursor.addOrUpdateFiles({file: stat.mtime.getTime()});
    });
    monitor.on("changed", function(file, current) {
      var task = {
        filePath: file,
        creationDate: current.ctime.getTime(),
        modificationDate: current.mtime.getTime(),
        baseIdentifier: os.hostname()
      };
      //push to Queue shloud call himself addOrUpdate
      pushToUploadQueue(task);
      cursor.addOrUpdateFiles({file: current.mtime.getTime()});
    });
    monitor.on("removed", function(file) {
      var task = {
        filePath: file,
        baseIdentifier: os.hostname()
      };
      pushToDeleteQueue(task);
      cursor.removeFiles(file);
    });
  });
};

module.exports = watcher;
