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

var addOrUpdateFiles = function(watchedDir, files, cb) {
  // Remove absolute path of the files
  Object.keys(files).forEach(function(filePath) {
    if(filePath.indexOf(watchedDir) !== -1) {
      //if the file path is absolute
      files["/" + path.relative(watchedDir, files[filePath])] = files[filePath];
      delete files[filePath];
    }
  });

  async.waterfall([
    function getOldCursor(cb) {
      getCursor(watchedDir, cb);
    },
    function addFile(oldCursor, cb) {
      Object.keys(files).forEach(function(filePath) {
        oldCursor[filePath] = files[filePath];
      });
      cb(null, oldCursor);
    },
    function save(newCursor, cb) {
      saveCursor(watchedDir, newCursor, cb);
    }
  ], cb);
};

var removeFiles = function(watchedDir, files, cb) {
  if(typeof files === "string") {
    // If we provide only 1 file
    files = [files];
  }
  // Remove absolute path of the files
  files = files.map(function(file) {
    if(file.indexOf(watchedDir) !== -1) {
      //if the file path is absolute
      return "/" + path.relative(watchedDir, file);
    }
    return file;
  });

  async.waterfall([
    function getOldCursor(cb) {
      getCursor(watchedDir, cb);
    },
    function removeFile(oldCursor, cb) {
      files.forEach(function(file) {
        delete oldCursor[file];
      });
      cb(null, oldCursor);
    },
    function save(newCursor, cb) {
      saveCursor(watchedDir, newCursor, cb);
    }
  ], cb);

};

var incrementialSave = function(cursorDir, file, cb) {
  incrementialSave.files.push(file);

  if(incrementialSave.files.length === incrementialSave.size) {
    // Generate save diffs
    var diffToSave = {};
    incrementialSave.files.forEach(function(file) {
      diffToSave[Object.keys(file)[0]] = file[Object.keys(file)[0]];
    });
    addOrUpdateFiles(cursorDir, diffToSave, cb);
    incrementialSave.files = [];
  }
  else {
    cb();
  }
};
incrementialSave.size = 10;
incrementialSave.files = [];

var savePendingFiles = function(cursorDir) {
  var cursor;
  try {
    cursor = JSON.parse(fs.readFileSync(getCursorPath(cursorDir)).toString());
  }
  catch(e) {
    cursor = {};
  }
  incrementialSave.files.forEach(function(file) {
    // There is a better way to do this ?
    cursor[Object.keys(file)[0]] = file[Object.keys(file)[0]];
  });
  incrementialSave.files = [];
  fs.writeFileSync(getCursorPath(cursorDir), JSON.stringify(cursor));
};


module.exports.getCursorPath = getCursorPath;

module.exports.saveCursor = saveCursor;
module.exports.getCursor = getCursor;

module.exports.addOrUpdateFiles = addOrUpdateFiles;
module.exports.removeFiles = removeFiles;

module.exports.incrementialSave = incrementialSave;
module.exports.savePendingFiles = savePendingFiles;
