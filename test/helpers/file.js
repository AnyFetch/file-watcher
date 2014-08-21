"use strict";

require('should');
var fs = require("fs");
var async = require("async");
var path = require("path");

var file = require('../../lib/helpers/file.js');

describe('file.js', function() {
  GLOBAL.WATCHED_DIR = __dirname;

  it('should get the cursor', function(done) {

    var fakeCursor = {
      '/txt1.txt': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/txt1.txt')).mtime.getTime(),
      '/txt2.txt': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/txt2.txt')).mtime.getTime(),
      '/test/txt1.doc': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/test/txt1.doc')).mtime.getTime() - 500,
    };

    GLOBAL.CURSOR = JSON.stringify(fakeCursor);
    GLOBAL.CURSOR = JSON.parse(GLOBAL.CURSOR);

    async.waterfall([
      function createCursor(cb) {
        file.save(cb);
      },
      function getUpdate(cb) {
        file.load(cb);
      },
      function checkValidity(cb) {
        fakeCursor.should.eql(GLOBAL.CURSOR);
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