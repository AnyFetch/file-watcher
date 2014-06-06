"use strict";
var fs = require("fs");
var async = require('async');
var path = require('path');

var getCursorPath = function(watchedDir) {
  var homeDir = process.env.HOMEPATH || process.env.HOME;
  if(!getCursorPath.hasMkdir) {
    try {
      fs.mkdirSync(homeDir + "/.anyfetch-file-watcher/");
    }
    catch(err) {}
    getCursorPath.hasMkdir = true;
  }
  return homeDir + "/.anyfetch-file-watcher/" + watchedDir.trim().replace(/(\/|\\)/g, '');
};
getCursorPath.hasMkdir = false;


var saveCursor = function(watchedDir, newCursor, cb) {
  fs.writeFile(getCursorPath(watchedDir), JSON.stringify(newCursor), cb);
};


var getCursor = function(watchedDir, cb) {
  fs.readFile(getCursorPath(watchedDir), function(err, cursor) {
    if(err && err.code !== 'ENOENT') {
      cb(err);
    }
    else if(err && err.code === 'ENOENT') {
      // If their is no previous cursor, we send an empty cursor
      cb(null, {});
    }
    else {
      cb(null, JSON.parse(cursor.toString()));
    }
  });
};

var addOrUpdateFile = function(watchedDir, file, modifiedTime, cb) {
  if(file.indexOf(watchedDir) !== -1) {
    //if the file path is absolute
    file = "/" + path.relative(watchedDir, file);
  }

  async.waterfall([
    function getOldCursor(cb) {
      getCursor(watchedDir, cb);
    },
    function addFile(oldCursor, cb) {
      oldCursor[file] = modifiedTime;
      cb(null, oldCursor);
    },
    function save(newCursor, cb) {
      saveCursor(watchedDir, newCursor, cb);
    }
  ], cb);
};


var removeFile = function(watchedDir, file, cb) {
  if(file.indexOf(watchedDir) !== -1) {
    //if the file path is absolute
    file = "/" + path.relative(watchedDir, file);
  }

  async.waterfall([
    function getOldCursor(cb) {
      getCursor(watchedDir, cb);
    },
    function removeFile(oldCursor, cb) {
      delete oldCursor[file];
      cb(null, oldCursor);
    },
    function save(newCursor, cb) {
      saveCursor(watchedDir, newCursor, cb);
    }
  ], cb);

};

module.exports.getCursorPath = getCursorPath;

module.exports.saveCursor = saveCursor;
module.exports.getCursor = getCursor;

module.exports.addOrUpdateFile = addOrUpdateFile;
module.exports.removeFile = removeFile;
