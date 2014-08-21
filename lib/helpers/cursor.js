"use strict";

var events = require('events');
var path = require('path');

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

var incrementialSave = function(cb) {
  incrementialSave.count += 1;
  if(incrementialSave.count === incrementialSave.size) {
    incrementialSave.count = 0;
    return require('./file').save(cb);
  }
  cb();
};
incrementialSave.size = process.env.BULK_SAVE || 20;
incrementialSave.count = 0;

incrementialSave.save = new events.EventEmitter();
incrementialSave.save.on('saving', function() {
  incrementialSave.count = 0;
});

module.exports = {
  addOrUpdateFiles: addOrUpdateFiles,
  removeFiles: removeFiles,
  incrementialSave: incrementialSave,
};
