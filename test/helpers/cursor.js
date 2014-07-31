"use strict";

require('should');

var fs = require('fs');
var async = require('async');

var cursor = require('../../lib/helpers/cursor');

describe('getCursor()', function() {
  var dir = __dirname;

  it('should get the cursor', function(done) {

    var fakeCursor = {
      '/txt1.txt': fs.statSync(__dirname + '/../sample-directory/txt1.txt').mtime.getTime(),
      '/txt2.txt': fs.statSync(__dirname + '/../sample-directory/txt2.txt').mtime.getTime(),
      '/test/txt1.doc': fs.statSync(__dirname + '/../sample-directory/test/txt1.doc').mtime.getTime() - 500,
    };


    async.waterfall([
      function createCursor(cb) {
        cursor.saveCursor(dir, fakeCursor, cb);
      },
      function getUpdate(cb) {
        cursor.getCursor(dir, cb);
      },
      function checkValidity(newCursor, cb) {
        newCursor.should.eql(fakeCursor);
        cb();
      }
    ], done);
  });

  after(function() {
    // Clean cursor
    try {
      fs.unlinkSync(cursor.getCursorPath(dir));
    }
    catch(e) {}
  });

});

describe('addOrUpdateFile()', function() {
  var dir = __dirname;

  it('should add the file', function(done) {
    var fakeCursor = {
      '/txt1.txt': fs.statSync(__dirname + '/../sample-directory/txt1.txt').mtime.getTime(),
      '/txt2.txt': fs.statSync(__dirname + '/../sample-directory/txt2.txt').mtime.getTime(),
      '/test/txt1.doc': fs.statSync(__dirname + '/../sample-directory/test/txt1.doc').mtime.getTime() - 500,
    };

    async.waterfall([
      function createCursor(cb) {
        cursor.saveCursor(dir, fakeCursor, cb);
      },
      function addFile(cb) {
        cursor.addOrUpdateFiles(dir, {"/afile.txt": "aRandomDate"}, cb);
      },
      function getNewCursor(cb) {
        cursor.getCursor(dir, cb);
      },
      function checkCursor(newCursor, cb) {
        fakeCursor['/afile.txt'] = "aRandomDate";
        newCursor.should.eql(fakeCursor);
        cb();
      }
    ], done);
  });

  after(function() {
    // Clean cursor
    try {
      fs.unlinkSync(cursor.getCursorPath(dir));
    }
    catch(e) {}
  });

});

describe('removeFile()', function() {

  var dir = __dirname;

  it('should add the file', function(done) {
    var fakeCursor = {
      '/txt1.txt': fs.statSync(__dirname + '/../sample-directory/txt1.txt').mtime.getTime(),
      '/txt2.txt': fs.statSync(__dirname + '/../sample-directory/txt2.txt').mtime.getTime(),
      '/test/txt1.doc': fs.statSync(__dirname + '/../sample-directory/test/txt1.doc').mtime.getTime() - 500,
    };

    async.waterfall([
      function createCursor(cb) {
        cursor.saveCursor(dir, fakeCursor, cb);
      },
      function removeAFile(cb) {
        cursor.removeFiles(dir, ["/txt1.txt"], cb);
      },
      function getNewCursor(cb) {
        cursor.getCursor(dir, cb);
      },
      function checkCursor(newCursor, cb) {
        delete fakeCursor['/txt1.txt'];
        newCursor.should.eql(fakeCursor);
        cb();
      }
    ], done);
  });

  after(function() {
    // Clean cursor
    try {
      fs.unlinkSync(cursor.getCursorPath(dir));
    }
    catch(e) {}
  });
});

describe('incrementialSave()', function() {

  var dir = __dirname;

  it('should not save at first files', function(done) {
    var file = { "/afile.test": "aRandomDate"};

    var fakeCursor = {
      '/txt1.txt': fs.statSync(__dirname + '/../sample-directory/txt1.txt').mtime.getTime(),
      '/txt2.txt': fs.statSync(__dirname + '/../sample-directory/txt2.txt').mtime.getTime(),
      '/test/txt1.doc': fs.statSync(__dirname + '/../sample-directory/test/txt1.doc').mtime.getTime() - 500,
    };

    async.waterfall([
      function createCursor(cb) {
        cursor.saveCursor(dir, fakeCursor, cb);
      },
      function saveFile(cb) {
        cursor.incrementialSave(dir, file, cursor.ADD, cb);
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
            cursor.incrementialSave(dir, file, cursor.ADD, cb);
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
      fs.unlinkSync(cursor.getCursorPath(dir));
    }
    catch(e) {}
  });
});

describe('savePendingFiles()', function() {

  var dir = __dirname;

  it('should force save', function(done) {
    var file = { "/afile.test": "aRandomDate"};

    var fakeCursor = {
      '/txt1.txt': fs.statSync(__dirname + '/../sample-directory/txt1.txt').mtime.getTime(),
      '/txt2.txt': fs.statSync(__dirname + '/../sample-directory/txt2.txt').mtime.getTime(),
      '/test/txt1.doc': fs.statSync(__dirname + '/../sample-directory/test/txt1.doc').mtime.getTime() - 500,
    };

    async.waterfall([
      function createCursor(cb) {
        cursor.saveCursor(dir, fakeCursor, cb);
      },
      function saveFile(cb) {
        cursor.incrementialSave(dir, file, cursor.ADD, cb);
      },
      function checkNoSave(cb) {
        cursor.incrementialSave.files.length.should.eql(1);
        cb();
      },
      function forceSave(cb) {
        cursor.savePendingFiles(dir);
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
      fs.unlinkSync(cursor.getCursorPath(dir));
    }
    catch(e) {}
  });
});
