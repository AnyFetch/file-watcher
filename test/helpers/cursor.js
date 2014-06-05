"use strict";

require('should');

var fs = require('fs');
var async = require('async');

var addOrUpdateFile = require('../../lib/helpers/cursor').addOrUpdateFile;
var removeFile = require('../../lib/helpers/cursor').removeFile;
var saveCursor = require('../../lib/helpers/cursor').saveCursor;
var getCursor = require('../../lib/helpers/cursor').getCursor;
var getCursorPath = require('../../lib/helpers/cursor').getCursorPath;


describe('getCursor', function() {
  var dir = __dirname;

  it('should get the cursor', function(done) {

    var cursor = {
      '/txt1.txt': fs.statSync(__dirname + '/../sample-directory/txt1.txt').mtime.getTime(),
      '/txt2.txt': fs.statSync(__dirname + '/../sample-directory/txt2.txt').mtime.getTime(),
      '/test/txt1.doc': fs.statSync(__dirname + '/../sample-directory/test/txt1.doc').mtime.getTime() - 500,
    };


    async.waterfall([
      function createCursor(cb) {
        saveCursor(dir, cursor, cb);
      },
      function getUpdate(cb) {
        getCursor(dir, cb);
      },
      function checkValidity(newCursor, cb) {
        newCursor.should.eql(cursor);
        cb();
      }
    ], done);
  });

  after(function() {
    // Clean cursor
    fs.unlinkSync(getCursorPath(dir));
  });

});

describe('addOrUpdateFile', function() {
  var dir = __dirname;

  it('should add the file', function(done) {
    var cursor = {
      '/txt1.txt': fs.statSync(__dirname + '/../sample-directory/txt1.txt').mtime.getTime(),
      '/txt2.txt': fs.statSync(__dirname + '/../sample-directory/txt2.txt').mtime.getTime(),
      '/test/txt1.doc': fs.statSync(__dirname + '/../sample-directory/test/txt1.doc').mtime.getTime() - 500,
    };

    async.waterfall([
      function createCursor(cb) {
        saveCursor(dir, cursor, cb);
      },
      function addFile(cb) {
        addOrUpdateFile(dir, "/afile.txt", "aRandomDate", cb);
      },
      function getNewCursor(cb) {
        getCursor(dir, cb);
      },
      function checkCursor(newCursor, cb) {
        cursor['/afile.txt'] = "aRandomDate";
        newCursor.should.eql(cursor);
        cb();
      }
    ], done);
  });

  after(function() {
    // Clean cursor
    fs.unlinkSync(getCursorPath(dir));
  });

});

describe('removeFile', function() {

  var dir = __dirname;

  it('should add the file', function(done) {
    var cursor = {
      '/txt1.txt': fs.statSync(__dirname + '/../sample-directory/txt1.txt').mtime.getTime(),
      '/txt2.txt': fs.statSync(__dirname + '/../sample-directory/txt2.txt').mtime.getTime(),
      '/test/txt1.doc': fs.statSync(__dirname + '/../sample-directory/test/txt1.doc').mtime.getTime() - 500,
    };

    async.waterfall([
      function createCursor(cb) {
        saveCursor(dir, cursor, cb);
      },
      function removeAFile(cb) {
        removeFile(dir, "/txt1.txt", cb);
      },
      function getNewCursor(cb) {
        getCursor(dir, cb);
      },
      function checkCursor(newCursor, cb) {
        delete cursor['/txt1.txt'];
        newCursor.should.eql(cursor);
        cb();
      }
    ], done);
  });

  after(function() {
    // Clean cursor
    fs.unlinkSync(getCursorPath(dir));
  });
});
