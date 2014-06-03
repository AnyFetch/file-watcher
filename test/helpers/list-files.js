"use strict";

var path = require("path");
var getCursorFromDirectory = require('../../lib/helpers/list-files.js');

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
