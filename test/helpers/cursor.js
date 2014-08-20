"use strict";

require('should');

var fs = require('fs');
var path = require('path');
var async = require('async');

var cursor = require('../../lib/helpers/cursor');


describe('getCursor()', function() {
  GLOBAL.WATCHED_DIR = __dirname;

  it('should get the cursor', function(done) {

    var fakeCursor = {
      '/txt1.txt': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/txt1.txt')).mtime.getTime(),
      '/txt2.txt': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/txt2.txt')).mtime.getTime(),
      '/test/txt1.doc': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/test/txt1.doc')).mtime.getTime() - 500,
    };


    async.waterfall([
      function createCursor(cb) {
        cursor.saveCursor(fakeCursor, cb);
      },
      function getUpdate(cb) {
        cursor.getCursor(cb);
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
      fs.unlinkSync(cursor.getCursorPath());
    }
    catch(e) {}
  });

});

describe('addOrUpdateFile()', function() {
  GLOBAL.WATCHED_DIR = __dirname;

  it('should add the file', function(done) {
    var fakeCursor = {
      '/txt1.txt': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/txt1.txt')).mtime.getTime(),
      '/txt2.txt': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/txt2.txt')).mtime.getTime(),
      '/test/txt1.doc': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/test/txt1.doc')).mtime.getTime() - 500,
    };

    async.waterfall([
      function createCursor(cb) {
        cursor.saveCursor(fakeCursor, cb);
        console.log('cursor saved');
      },
      function addFile(cb) {
        cursor.addOrUpdateFiles({"/afile.txt": "aRandomDate"}, cb);
      },
      function getNewCursor(cb) {
        console.log("checking cursor for test");
        cursor.getCursor(cb);
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
      fs.unlinkSync(cursor.getCursorPath());
    }
    catch(e) {}
  });

});

describe('removeFile()', function() {

  GLOBAL.WATCHED_DIR = __dirname;

  it('should add the file', function(done) {
    var fakeCursor = {
      '/txt1.txt': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/txt1.txt')).mtime.getTime(),
      '/txt2.txt': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/txt2.txt')).mtime.getTime(),
      '/test/txt1.doc': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/test/txt1.doc')).mtime.getTime() - 500,
    };

    async.waterfall([
      function createCursor(cb) {
        cursor.saveCursor(fakeCursor, cb);
      },
      function removeAFile(cb) {
        cursor.removeFiles(["/txt1.txt"], cb);
      },
      function getNewCursor(cb) {
        cursor.getCursor(cb);
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
      fs.unlinkSync(cursor.getCursorPath());
    }
    catch(e) {}
  });
});

describe('incrementialSave()', function() {

  GLOBAL.WATCHED_DIR = __dirname;

  it('should not save at first files', function(done) {
    var file = { "/afile.test": "aRandomDate"};

    var fakeCursor = {
      '/txt1.txt': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/txt1.txt')).mtime.getTime(),
      '/txt2.txt': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/txt2.txt')).mtime.getTime(),
      '/test/txt1.doc': fs.statSync(path.resolve(GLOBAL.WATCHED_DIR + '/sample-directory/test/txt1.doc')).mtime.getTime() - 500,
    };

    async.waterfall([
      function createCursor(cb) {
        cursor.saveCursor(fakeCursor, cb);
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
      fs.unlinkSync(cursor.getCursorPath());
    }
    catch(e) {}
  });
});

describe('savePendingFiles()', function() {

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
        cursor.saveCursor(fakeCursor, cb);
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
      fs.unlinkSync(cursor.getCursorPath());
    }
    catch(e) {}
  });
});
