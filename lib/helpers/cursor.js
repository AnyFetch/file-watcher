"use strict";

var async = require('async');
var path = require('path');

var file = require('./file');

var ADD = "add";
var DELETION = "deletion";

GLOBAL.CURSOR = {};

var addOrUpdateFiles = function(files) {
  // Remove absolute path of the files
  Object.keys(files).forEach(function(filePath) {
    if(filePath.indexOf(GLOBAL.WATCHED_DIR) !== -1) {
      //if the file path is absolute
      files["/" + path.relative(GLOBAL.WATCHED_DIR, filePath)] = files[filePath];
      delete files[filePath];
    }
  });

  Object.keys(files).forEach(function(filePath) {
    GLOBAL.CURSOR[filePath] = files[filePath];
  });
};

var removeFiles = function(files) {
  if(typeof files === "string") {
    // If we provide only 1 file
    files = [files];
  }
  // Remove absolute path of the files
  files = files.map(function(file) {
    if(file.indexOf(GLOBAL.WATCHED_DIR) !== -1) {
      // If the file path is absolute
      return "/" + path.relative(GLOBAL.WATCHED_DIR, file);
    }
    return file;
  });

  files.forEach(function(file) {
    delete GLOBAL.CURSOR[file];
  });
};

//TODO : find a way to limit one call at the same time
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
        filesToDelete.push(file.file);
      }
      else {
        filesToAdd[Object.keys(file.file)[0]] = file.file[Object.keys(file.file)[0]].date;
      }
    });
    // TODO without 2 saves
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
incrementialSave.size = process.env.BULK_SAVE || 20;
incrementialSave.files = [];

var savePendingFiles = function() {
  var cursor;
  try {
    file.loadSync();
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
  file.saveSync(cursor);
};

module.exports = {
  addOrUpdateFiles: addOrUpdateFiles,
  removeFiles: removeFiles,
  incrementialSave: incrementialSave,
  savePendingFiles: savePendingFiles,
  DELETION: DELETION,
  ADD: ADD,
};
