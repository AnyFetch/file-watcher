"use strict";
var fs = require("fs");
var async = require('async');
var path = require('path');

var ADD = "add";
var DELETION = "deletion";

var getCursorPath = function(watchedDir) {
  var homeDir = process.env.HOMEPATH || process.env.HOME;
  if(!getCursorPath.hasMkdir) {
    if(!fs.existsSync(homeDir + "/.anyfetch-file-watcher/")) {
      fs.mkdirSync(homeDir + "/.anyfetch-file-watcher/");
    }
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

var incrementialSave = function(cursorDir, file, action, cb) {
  incrementialSave.files.push({
    file: file,
    action: action
  });

  if(incrementialSave.files.length >= incrementialSave.size) {
    // Generate save diffs
    var filesToAdd = {};
    var filesToDelete = [];
    incrementialSave.files.forEach(function(file) {
      if(file.action === DELETION) {
        filesToDelete.push(Object.keys(file.file)[0]);
      }
      else {
        filesToAdd[Object.keys(file.file)[0]] = file[Object.keys(file.file)[0]];
      }
    });
    async.series([
      function deleteFiles(cb) {
        removeFiles(cursorDir, filesToDelete, cb);
      },
      function addFiles(cb) {
        addOrUpdateFiles(cursorDir, filesToAdd, cb);
      },
      function resetQueue(cb) {
        incrementialSave.files = [];
        cb();
      }
    ], cb);
  }
  else {
    cb();
  }
};
incrementialSave.size = 20;
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
    if(file.action === DELETION) {
      delete cursor[file.file];
    }
    else {
      cursor[Object.keys(file.file)[0]] = Object.keys(file.file)[0];
    }
  });
  incrementialSave.files = [];
  fs.writeFileSync(getCursorPath(cursorDir), JSON.stringify(cursor));
};

module.exports = {
  getCursorPath: getCursorPath,
  saveCursor: saveCursor,
  getCursor: getCursor,
  addOrUpdateFiles: addOrUpdateFiles,
  removeFiles: removeFiles,
  incrementialSave: incrementialSave,
  savePendingFiles: savePendingFiles,
  DELETION: DELETION,
  ADD: ADD
};
