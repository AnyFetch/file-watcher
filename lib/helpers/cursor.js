"use strict";
var fs = require("fs");
var async = require('async');

var getCursorPath = function(dir) {
  var homeDir = process.env.HOMEPATH || process.env.HOME;
  if(!getCursorPath.hasMkdir) {
    try {
      fs.mkdirSync(homeDir + "/.anyfetch-file-watcher/");
    }
    catch(err) {}
    getCursorPath.hasMkdir = true;
  }
  return homeDir + "/.anyfetch-file-watcher/" + dir.trim().replace(/(\/|\\)/g, '');
};
getCursorPath.hasMkdir = false;


var saveCursor = function(dir, newCursor, cb) {
  fs.writeFile(getCursorPath(dir), JSON.stringify(newCursor), cb);
};


var getCursor = function(dir, cb) {
  fs.readFile(getCursorPath(dir), function(err, cursor) {
    if(err && err.code !== 'ENOENT') {
      cb(err);
    }
    else if(err && err.code === 'ENOENT') {
      cb(null, {});
    }
    else {
      cb(null, JSON.parse(cursor.toString()));
    }
  });
};

var addOrUpdateFileToCursor = function(dir, file, time, cb) {
  async.waterfall([
    function getOldCursor(cb) {
      getCursor(dir, cb);
    },
    function addFile(oldCursor, cb) {
      oldCursor.file = time;
      cb(null, oldCursor);
    },
    function save(newCursor, cb) {
      saveCursor(dir, newCursor, cb);
    }
  ], cb);
};


var removeFileInCursor = function(dir, file, cb) {
  async.waterfall([
    function getOldCursor(cb) {
      getCursor(dir, cb);
    },
    function removeFile(oldCursor, cb) {
      delete oldCursor.file;
      cb(null, oldCursor);
    },
    function save(newCursor, cb) {
      saveCursor(dir, newCursor, cb);
    }
  ], cb);

};

module.exports.getCursorPath = getCursorPath;

module.exports.saveCursor = saveCursor;
module.exports.getCursor = getCursor;

module.exports.addOrUpdateFileToCursor = addOrUpdateFileToCursor;
module.exports.removeFileInCursor = removeFileInCursor;
