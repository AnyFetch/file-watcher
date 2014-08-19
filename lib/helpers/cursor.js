"use strict";
var fs = require("fs");
var async = require('async');
var path = require('path');
var zip = require('./zip');

var ADD = "add";
var DELETION = "deletion";


var getCursorPath = function() {
  var homeDir = process.env.HOMEPATH || process.env.HOME;
  if(!getCursorPath.hasMkdir) {
    if(!fs.existsSync(homeDir + "/.anyfetch-file-watcher/")) {
      fs.mkdirSync(homeDir + "/.anyfetch-file-watcher/");
    }
    getCursorPath.hasMkdir = true;
  }
  return homeDir + "/.anyfetch-file-watcher/" + GLOBAL.WATCHED_DIR.trim().replace(/(\/|\\)/g, '') + '-' + GLOBAL.ACCOUNT;
};
//Save state to optimize synchrone IO with hard drive
getCursorPath.hasMkdir = false;


var saveCursor = function(newCursor, cb) {
  var zippedData = zip.zip(getCursorPath(), JSON.stringify(newCursor));
  fs.writeFile(getCursorPath(), zippedData, 'binary', cb);
};


var getCursor = function(cb) {
  fs.readFile(getCursorPath(), function(err, cursor) {
    if(err && err.code !== 'ENOENT') {
      cb(err);
    }
    else if(err && err.code === 'ENOENT') {
      // If their is no previous cursor, we send an empty cursor
      cb(null, {});
    }
    else {
      var unzippedCursor = zip.unzip(getCursorPath(), cursor);
      cb(null, JSON.parse(unzippedCursor));
    }
  });
};

var addOrUpdateFiles = function(files, cb) {
  // Remove absolute path of the files
  Object.keys(files).forEach(function(filePath) {
    if(filePath.indexOf(GLOBAL.WATCHED_DIR) !== -1) {
      //if the file path is absolute
      files["/" + path.relative(GLOBAL.WATCHED_DIR, files[filePath])] = files[filePath];
      delete files[filePath];
    }
  });

  async.waterfall([
    function getOldCursor(cb) {
      getCursor(cb);
    },
    function addFile(oldCursor, cb) {
      Object.keys(files).forEach(function(filePath) {
        oldCursor[filePath] = files[filePath];
      });
      cb(null, oldCursor);
    },
    function save(newCursor, cb) {
      saveCursor(newCursor, cb);
    }
  ], cb);
};

var removeFiles = function(files, cb) {
  if(typeof files === "string") {
    // If we provide only 1 file
    files = [files];
  }
  // Remove absolute path of the files
  files = files.map(function(file) {
    if(file.indexOf(GLOBAL.WATCHED_DIR) !== -1) {
      //if the file path is absolute
      return "/" + path.relative(GLOBAL.WATCHED_DIR, file);
    }
    return file;
  });
  async.waterfall([
    function getOldCursor(cb) {
      getCursor(cb);
    },
    function removeFile(oldCursor, cb) {
      files.forEach(function(file) {
        delete oldCursor[file];
      });
      cb(null, oldCursor);
    },
    function save(newCursor, cb) {
      saveCursor(newCursor, cb);
    }
  ], cb);
};

var incrementialSave = function(file, action, cb) {
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
        removeFiles(filesToDelete, cb);
      },
      function addFiles(cb) {
        addOrUpdateFiles(filesToAdd, cb);
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

var savePendingFiles = function() {
  var cursor;
  try {
    var unzippedCursor = zip.unzip(getCursorPath(), fs.readFileSync(getCursorPath()));
    cursor = JSON.parse(unzippedCursor);
  }
  catch(e) {
    cursor = {};
  }
  incrementialSave.files.forEach(function(file) {
    if(file.action === DELETION) {
      delete cursor[file.file];
    }
    else {
      cursor[Object.keys(file.file)[0]] = file.file[Object.keys(file.file)[0]].date;
    }
  });
  incrementialSave.files = [];
  var zippedData = zip.zip(getCursorPath(), JSON.stringify(cursor));
  fs.writeFileSync(getCursorPath(), zippedData, 'binary');
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
  ADD: ADD,
};
