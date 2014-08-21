"use strict";

var async = require('async');
var path = require("path");
var fs = require("fs");

var print = function(string) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write("Listing files : ");
  process.stdout.write(string);
};

var getDeletedFiles = function(oldCursor, newCursor) {
  var filesToDelete = [];

  for(var file in oldCursor) {
    if(!newCursor[file]) {
      filesToDelete.push(file);
    }
  }

  return filesToDelete;
};

var getCursorFromDirectory = function(cb) {
  // Generate an object with files of the watched directory
  // {
  //    '/a/file/somewhere': lastUpdateOfThisFile,
  //    '/another/file/somewhere': anotherDate
  // }
  var cursor = {};

  var queue = async.queue(function(task, cb) {
    async.waterfall([
      function readDir(cb) {
        fs.readdir(task.dir, cb);
      },
      function findFiles(files, cb) {
        async.map(files, function(nameOfFile, cb) {
          var file = path.join(task.dir, nameOfFile);
          // Recursive call for directory
          fs.lstat(file, function(err, res) {
            if(res.isDirectory()) {
              queue.push({'dir' : file, 'base' : task.base + nameOfFile + '/'});
              return cb(err);
            }
            else {
              fs.stat(file, function(err, stats) {
                if(err) {
                  return cb(err);
                }

                // Skip empty files
                if(stats.size !== 0) {
                  cursor[task.base + nameOfFile] = stats.mtime.getTime();
                  print(nameOfFile);
                }

                cb();
              });
            }
          });
        }, function(err) {
          process.stdout.clearLine();
          process.stdout.cursorTo(0);
          cb(err);
        });
      }
    ], cb);
  }, 3);

  // Push first item to start pseudo-recursion
  queue.push({'dir' : GLOBAL.WATCHED_DIR, 'base' : '/'});

  queue.drain = function() {
    cb(null, cursor);
  };
};

module.exports.retrieveFiles = function retrieveFiles(cb) {
  // Update documents from provider
  // Compare cursor and the file on the disk
  // If the files has been updated we add the file in the files to upload

  var filesToUpload = {};

  getCursorFromDirectory(function(err, filesOnDisk) {
    if(err) {
      return cb(err);
    }

    for(var file in filesOnDisk) {
      if(!GLOBAL.CURSOR[file]) {
        // File was added since last run
        filesToUpload[file] = filesOnDisk[file];
      }
      else if(GLOBAL.CURSOR[file] < filesOnDisk[file]) {
        // File updated since last run
        filesToUpload[file] = filesOnDisk[file];
      }
    }
    var filesToDelete = getDeletedFiles(GLOBAL.CURSOR, filesOnDisk);
    cb(null, filesToUpload, filesToDelete);
  });
};

module.exports.getCursorFromDirectory = getCursorFromDirectory;
