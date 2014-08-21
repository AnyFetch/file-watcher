"use strict";

require('should');

var fs = require('fs');
var path = require('path');
var async = require('async');

var cursor = require('../../lib/helpers/cursor');
var files = require('../../lib/helpers/file');
var getCursorPath = require('../../lib/index.js').getCursorPath;

describe("Cursor", function() {

  GLOBAL.WATCHED_DIR = __dirname;
  GLOBAL.CURSOR_PATH = getCursorPath();

  describe('addOrUpdateFile()', function() {

    it('should add the file', function(done) {
      GLOBAL.CURSOR = {
        '/txt1.txt': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/txt1.txt')).mtime.getTime(),
        '/txt2.txt': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/txt2.txt')).mtime.getTime(),
        '/test/txt1.doc': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/test/txt1.doc')).mtime.getTime() - 500,
      };
      cursor.addOrUpdateFiles({"/afile.txt": "aRandomDate"});

      GLOBAL.CURSOR.should.containDeep({"/afile.txt": "aRandomDate"});
      done();

    });

    after(function() {
      // Clean cursor
      try {
        fs.unlinkSync(GLOBAL.CURSOR_PATH);
      }
      catch(e) {}
    });

  });

  describe('removeFile()', function() {

    GLOBAL.WATCHED_DIR = __dirname;

    it('should remove the file', function(done) {
      GLOBAL.CURSOR = {
        '/txt1.txt': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/txt1.txt')).mtime.getTime(),
        '/txt2.txt': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/txt2.txt')).mtime.getTime(),
        '/test/txt1.doc': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/test/txt1.doc')).mtime.getTime() - 500,
      };

      cursor.removeFiles(["/txt1.txt"]);

      GLOBAL.CURSOR.should.not.containDeep('/txt1.txt');
      done();
    });

    after(function() {
      // Clean cursor
      try {
        fs.unlinkSync(GLOBAL.CURSOR_PATH);
      }
      catch(e) {}
    });
  });

  describe.skip('incrementialSave()', function() {

    GLOBAL.WATCHED_DIR = __dirname;

    it('should not save at first files', function(done) {
      var file = { "/afile.test": "aRandomDate"};

      GLOBAL.CURSOR = {
        '/txt1.txt': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/txt1.txt')).mtime.getTime(),
        '/txt2.txt': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/txt2.txt')).mtime.getTime(),
        '/test/txt1.doc': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/test/txt1.doc')).mtime.getTime() - 500,
      };

      async.waterfall([
        function createCursor(cb) {
          files.save(cb);
        },
        function saveFile(cb) {
          cursor.incrementialSave(file, cursor.ADD, cb);
        },
        function checkNoSave(cb) {
          cursor.incrementialSave.files.length.should.eql(1);
          cb();
        },
        function sendMoreFiles(cb) {
          var count = 0;
          async.whilst(
            function() {
              return count < cursor.incrementialSave.size - 1;
            },
            function(cb) {
              count += 1;
              cursor.incrementialSave(file, cursor.ADD, cb);
            },
            cb
          );
        },
        function checkSave(cb) {
          cursor.incrementialSave.files.length.should.eql(0);
          cb();
        }
      ], done);
    });

    after(function() {
      // Clean cursor
      try {
        fs.unlinkSync(GLOBAL.CURSOR_PATH);
      }
      catch(e) {}
    });
  });

  describe.skip('savePendingFiles()', function() {

    GLOBAL.WATCHED_DIR = __dirname;

    it('should force save', function(done) {
      var file = { "/afile.test": "aRandomDate"};

      var fakeCursor = {
        '/txt1.txt': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/txt1.txt')).mtime.getTime(),
        '/txt2.txt': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/txt2.txt')).mtime.getTime(),
        '/test/txt1.doc': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/test/txt1.doc')).mtime.getTime() - 500,
      };

      async.waterfall([
        function createCursor(cb) {
          files.save(fakeCursor, cb);
        },
        function saveFile(cb) {
          cursor.incrementialSave(file, cursor.ADD, cb);
        },
        function checkNoSave(cb) {
          cursor.incrementialSave.files.length.should.eql(1);
          cb();
        },
        function forceSave(cb) {
          cursor.savePendingFiles();
          cb();
        },
        function checkSave(cb) {
          cursor.incrementialSave.files.length.should.eql(0);
          cb();
        }
      ], done);
    });

    after(function() {
      // Clean cursor
      try {
        fs.unlinkSync(GLOBAL.CURSOR_PATH);
      }
      catch(e) {}
    });
  });
});
