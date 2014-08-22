"use strict";

require('should');

var fs = require("fs");
var path = require("path");
var listFiles = require('../../lib/helpers/list-files');
var getCursorFromDirectory = listFiles.getCursorFromDirectory;
var retrieveFiles = listFiles.retrieveFiles;
var init = require('../init');

describe('list-files', function() {
  beforeEach(function(done) {
    init("randomAccessToken", path.resolve(__dirname + "../../../test/sample-directory"), done);
  });

  describe("getCursorFromDirectory()", function() {
    it("should list the files inside the sample directory", function(done) {
      getCursorFromDirectory(function(err, cursor) {
        if(err) {
          throw err;
        }
        Object.keys(cursor).should.include('/txt1.txt');
        Object.keys(cursor).should.include('/txt2.txt');
        Object.keys(cursor).should.include('/txt3.txt');
        Object.keys(cursor).should.include('/test/txt1.doc');
        Object.keys(cursor).should.include('/test/txt2.txt');
        Object.keys(cursor).should.have.lengthOf(5);
        done();
      });
    });
  });

  describe("Retrieve file", function () {
    it("should return the new file that are updated", function(done) {
      GLOBAL.CURSOR = {
        '/txt1.txt': fs.statSync(__dirname + '/../sample-directory/txt1.txt').mtime.getTime(),
        '/txt2.txt': fs.statSync(__dirname + '/../sample-directory/txt2.txt').mtime.getTime(),
        '/test/txt1.doc': fs.statSync(__dirname + '/../sample-directory/test/txt1.doc').mtime.getTime() - 500,
      };

      retrieveFiles(function(err, filesToUpload) {
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
});
