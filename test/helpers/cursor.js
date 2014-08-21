"use strict";

require('should');

var fs = require('fs');
var path = require('path');
var async = require('async');

var cursor = require('../../lib/helpers/cursor');
var init = require('../../lib/index.js').init;

describe("Cursor", function() {
  describe('addOrUpdateFile()', function() {
    it('should add the file', function(done) {
      init("randomAccessToken", __dirname, "test");

      GLOBAL.CURSOR = {
        '/txt1.txt': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/../sample-directory/txt1.txt')).mtime.getTime(),
        '/txt2.txt': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/../sample-directory/txt2.txt')).mtime.getTime(),
        '/test/txt1.doc': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/../sample-directory/test/txt1.doc')).mtime.getTime() - 500,
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
    init("randomAccessToken", __dirname, "test");

    it('should remove the file', function(done) {
      GLOBAL.CURSOR = {
        '/txt1.txt': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/../sample-directory/txt1.txt')).mtime.getTime(),
        '/txt2.txt': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/../sample-directory/txt2.txt')).mtime.getTime(),
        '/test/txt1.doc': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/../sample-directory/test/txt1.doc')).mtime.getTime() - 500,
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

  describe('incrementialSave()', function() {
    init("randomAccessToken", __dirname, "test");

    it('should not save at first files', function(done) {
      async.waterfall([
        function callIncrementialSave(cb) {
          cursor.incrementialSave(cb);
        },
        function checkNoSave(cb) {
          cursor.incrementialSave.count.should.eql(1);
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
              cursor.incrementialSave(cb);
            },
            cb
          );
        },
        function checkSave(cb) {
          cursor.incrementialSave.count.should.eql(0);
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
