'use strict';

require('should');

var path = require('path');
var Anyfetch = require('anyfetch');
var fs = require('fs');

var update = require('../lib/');
var getCursorPath = require('../lib/helpers/cursor').getCursorPath;


describe('update() function', function() {
  process.env.ANYFETCH_API_URL = 'http://localhost:1338';
  var countFile = 0;
  var mockServerHandler = function(url){
    if (url.indexOf("/file") !== -1) {
      countFile += 1;
    }
  };

  var apiServer;
  before(function createTestApiServer() {
    // Create a fake HTTP server
    apiServer = Anyfetch.debug.createTestApiServer(mockServerHandler);
    apiServer.listen(1338);
  });

  after(function closeTestApiServer(){
    apiServer.close();
  });

  after(function cleanTestFile(){
    // Clean cursor
    try {
      fs.unlinkSync(getCursorPath(path.resolve(__dirname + "/../test/sample-directory")));
    }
    catch(e) {}
  });


  it('should update account', function(done) {
    update(path.resolve(__dirname + "/../test/sample-directory"), "randomAccessToken", function(err) {
      if(err) {
        throw err;
      }
      setTimeout(function() {
        countFile.should.eql(5);
        done();
      }, 200);
    });

  });
});
