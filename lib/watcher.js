"use strict";

var watch = require('watch');
var os = require('os');

var queues = require('./helpers/upload');
var pushToUploadQueue = queues.pushToUploadQueue;
var pushToDeleteQueue = queues.pushToDeleteQueue;

var cursor = require('./helpers/cursor');


var watcher = function(accessToken) {
  console.log("WATCHING ", GLOBAL.WATCHED_DIR);

  watch.createMonitor(GLOBAL.WATCHED_DIR, {skipUnreadableDir: true}, function(monitor) {
    monitor.on("created", function(file, stat) {
      var task = {
        filePath: file,
        creationDate: stat.ctime.getTime(),
        modificationDate: stat.mtime.getTime(),
        accessToken: accessToken,
        baseIdentifier: os.hostname()
      };
      pushToUploadQueue(task);
      // TODO : do not use addOrUpdateFile (save cursor each file...)
      cursor.addOrUpdateFiles({file: stat.mtime.getTime()}, function(err){
        if(err) {
          console.warn(err);
        }
      });
    });
    monitor.on("changed", function(file, current) {
      var task = {
        filePath: file,
        creationDate: current.ctime.getTime(),
        modificationDate: current.mtime.getTime(),
        accessToken: accessToken,
        baseIdentifier: os.hostname()
      };
      pushToUploadQueue(task);
      cursor.addOrUpdateFiles({file: current.mtime.getTime()}, function(err){
        if(err) {
          console.warn(err);
        }
      });
    });
    monitor.on("removed", function(file) {
      var task = {
        filePath: file,
        accessToken: accessToken,
        baseIdentifier: os.hostname()
      };
      pushToDeleteQueue(task);
      cursor.removeFiles(file, function(err){
        if(err) {
          console.warn(err);
        }
      });
    });
  });
};

module.exports = watcher;
