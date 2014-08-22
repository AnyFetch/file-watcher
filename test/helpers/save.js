"use strict";

require('should');
var fs = require("fs");
var async = require("async");
var path = require("path");

var save = require('../../lib/helpers/save.js');
var init = require('../init');


describe('save.js', function() {
  before(function(done) {
    init("randomAccessToken", __dirname, done);
  });

  after(function(done) {
    init.clean(done);
  });

  it('should zip and unzip the cursor', function(done) {
    var fakeCursor = {
      '/txt1.txt': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/../sample-directory/txt1.txt')).mtime.getTime(),
      '/txt2.txt': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/../sample-directory/txt2.txt')).mtime.getTime(),
      '/test/txt1.doc': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/../sample-directory/test/txt1.doc')).mtime.getTime() - 500,
    };
    // trick to copy initial value
    GLOBAL.CURSOR = JSON.stringify(fakeCursor);
    GLOBAL.CURSOR = JSON.parse(GLOBAL.CURSOR);

    async.waterfall([
      function createCursor(cb) {
        save.save(cb);
      },
      function getUpdate(cb) {
        save.load(cb);
      },
      function checkValidity(cb) {
        fakeCursor.should.eql(GLOBAL.CURSOR);
        cb();
      }
    ], done);
  });

  it('should not save at first files', function(done) {
    async.waterfall([
      function callIncrementialSave(cb) {
        save(cb);
      },
      function checkNoSave(cb) {
        save.count.should.eql(1);
        cb();
      },
      function sendMoreFiles(cb) {
        var count = 0;
        async.whilst(
          function() {
            return count < save.size - 1;
          },
          function(cb) {
            count += 1;
            save(cb);
          },
          cb
        );
      },
      function checkSave(cb) {
        save.count.should.eql(0);
        cb();
      }
    ], done);
  });
});
