"use strict";

require('should');

var fs = require('fs');
var async = require('async');

var addOrUpdateFiles = require('../../lib/helpers/cursor').addOrUpdateFiles;
var removeFiles = require('../../lib/helpers/cursor').removeFiles;
var saveCursor = require('../../lib/helpers/cursor').saveCursor;
var getCursor = require('../../lib/helpers/cursor').getCursor;
var getCursorPath = require('../../lib/helpers/cursor').getCursorPath;


describe('getCursor()', function() {
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
    try {
      fs.unlinkSync(getCursorPath(dir));
    }
    catch(e) {}
  });

});

describe('addOrUpdateFile()', function() {
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
        addOrUpdateFiles(dir, {"/afile.txt": "aRandomDate"}, cb);
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
    try {
      fs.unlinkSync(getCursorPath(dir));
    }
    catch(e) {}
  });

});

describe('removeFile()', function() {

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
        removeFiles(dir, ["/txt1.txt"], cb);
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
    try {
      fs.unlinkSync(getCursorPath(dir));
    }
    catch(e) {}
  });
});
