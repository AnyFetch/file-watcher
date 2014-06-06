"use strict";

require('should');

var fs = require("fs");
var path = require("path");
var listFiles = require('../../lib/helpers/list-files');
var getCursorFromDirectory = listFiles.getCursorFromDirectory;
var retrieveFiles = listFiles.retrieveFiles;


describe("getCursorFromDirectory()", function() {
  it("should list the files inside the sample directory", function(done) {
    getCursorFromDirectory(path.resolve("test/sample-directory"), function(err, res) {
      if(err) {
        throw err;
      }
      Object.keys(res).should.include('/txt1.txt');
      Object.keys(res).should.include('/txt2.txt');
      Object.keys(res).should.include('/txt3.txt');
      Object.keys(res).should.include('/test/txt1.doc');
      Object.keys(res).should.include('/test/txt2.txt');
      Object.keys(res).should.have.lengthOf(5);
      done();
    });
  });
});

describe("Retrieve file", function () {
  it("should return the new file that are updated", function(done) {
    var cursor = {
      '/txt1.txt': fs.statSync(__dirname + '/../sample-directory/txt1.txt').mtime.getTime(),
      '/txt2.txt': fs.statSync(__dirname + '/../sample-directory/txt2.txt').mtime.getTime(),
      '/test/txt1.doc': fs.statSync(__dirname + '/../sample-directory/test/txt1.doc').mtime.getTime() - 500,
    };
    retrieveFiles(path.resolve("test/sample-directory"), cursor, function(err, filesToUpload) {
      if(err) {
        throw err;
      }

      // Should contain new files and updated files
      filesToUpload.should.have.property('/txt3.txt');
      filesToUpload.should.have.property('/test/txt1.doc');
      filesToUpload.should.have.property('/test/txt2.txt');
      Object.keys(filesToUpload).should.have.lengthOf(3);
      done();
    });
  });
});
