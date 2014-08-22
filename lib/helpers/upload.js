"use strict";

var Anyfetch = require('anyfetch');

var path = require('path');
var nodeDomain = require("domain");
var async = require('async');

var save = require('./save');

Anyfetch.setApiUrl(require('../../config.js').apiUrl);

var uploadFile = function(filePath, baseIdentifier, creationDate, cb) {
  var absolutePath = filePath;
  if(filePath.indexOf(GLOBAL.WATCHED_DIR) === -1) {
    //if the file path is relative
    absolutePath = GLOBAL.WATCHED_DIR + filePath;
  }

  async.waterfall([
    function sendFile(cb) {
      var anyfetch = new Anyfetch(GLOBAL.ACCESS_TOKEN);

      var title = path.basename(filePath, path.extname(filePath));
      title = title.replace(/(_|-|\.)/g, ' ');
      title = title.charAt(0).toUpperCase() + title.slice(1);

      // Send a document to anyFetch
      var document = {
        identifier: baseIdentifier + filePath,
        document_type: 'file',
        creation_date: creationDate,
        metadata: {
          title: title
        }
      };

      var fileConfig = {
        file: absolutePath,
        filename: path.basename(filePath),
      };
      var domain = nodeDomain.create();

      var cleaner = function() {
        if(!cleaner.called) {
          cleaner.called = true;
          domain.exit();
          domain.dispose();
          cb();
        }
      };
      cleaner.called = false;

      domain.on('error', function(err) {
        console.warn('Unable to upload file:', fileConfig.file, err);
        cleaner();
      });

      domain.run(function() {
        anyfetch.sendDocumentAndFile(document, fileConfig, function() {
          cleaner();
        });
      });
    },
    function savingInCursor(cb) {
      console.log("UPPING ", filePath);
      GLOBAL.CURSOR[filePath] = creationDate;
      save(cb);
    },
  ], function(err) {
    if(err) {
      console.warn('Error while upping', filePath, ': ', err);
    }
    cb();
  });
};

var deleteFile = function(filePath, baseIdentifier, cb) {
  if(filePath.indexOf(GLOBAL.WATCHED_DIR) !== -1) {
    //if the file path is absolute
    filePath = "/" + path.relative(GLOBAL.WATCHED_DIR, filePath);
  }

  async.waterfall([
    function deleteFile(cb) {
      var anyfetch = new Anyfetch(GLOBAL.ACCESS_TOKEN);
      anyfetch.deleteDocumentByIdentifier(baseIdentifier + filePath, function(err, res) {
        if(err && res.statusCode === 404) {
          err = null;
        }
        cb(err);
      });
    },
    function savingInCursor(cb) {
      console.log("DELETING", filePath);
      delete GLOBAL.CURSOR[filePath];
      save(cb);
    },
  ], cb);
};

module.exports.uploadQueue = async.queue(function worker(task, cb) {
  uploadFile(task.filePath, task.baseIdentifier, task.creationDate, cb);
}, 4);

module.exports.deleteQueue = async.queue(function worker(task, cb) {
  deleteFile(task.filePath, task.baseIdentifier, cb);
}, 4);

module.exports.uploadFile = uploadFile;
module.exports.deleteFile = deleteFile;
