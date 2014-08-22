"use strict";

require('should');
var fs = require("fs");
var async = require("async");
var path = require("path");

var file = require('../../lib/helpers/file.js');
var init = require('../init');


describe('file.js', function() {

  before(function(done) {
    init("randomAccessToken", __dirname, done);
  });

  after(function(done) {
    init.clean(done);
  });

  it('should get the cursor', function(done) {

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


});
