"use strict";

var async = require('async');
var path = require("path");
var fs = require("fs");

module.exports = function getCursorFromDirectory(dir, cb) {
  var cursor = {};

  var queue = async.queue(function(task, cb) {
    fs.readdir(task.dir, function(err, files) {
      if(err) {
        return cb(err);
      }

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
              }

              cb();
            });
          }
        });
      }, cb);
    });
  }, 3);

  // Push first item to start pseudo-recursion
  queue.push({'dir' : dir, 'base' : '/'});

  queue.drain = function() {
    cb(null, cursor);
  };
};
