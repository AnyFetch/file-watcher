'use strict';

require('should');
var Anyfetch = require('anyfetch');
var path = require('path');

var uploadFile = require('../../lib/helpers/upload.js').uploadFile;

describe('uploadFile', function() {

  process.env.ANYFETCH_API_URL = 'http://localhost:1338';
  var countFile = 0;
  var mockServerHandler = function(url){
    if (url.indexOf("/file") !== -1) {
      countFile += 1;
    }
  };
  var apiServer;

  before(function() {
    // Create a fake HTTP server
    apiServer = Anyfetch.debug.createTestApiServer(mockServerHandler);
    apiServer.listen(1338);
  });

  after(function(){
    apiServer.close();
  });

  it('should upload the file', function(done) {

    uploadFile(path.resolve(__dirname + "/.."), "/sample-directory/txt1.txt", "randomAccessToken", "randomBaseIdentifier", "RandomDate", function(err) {
      if(err) {
        throw err;
      }
      countFile.should.be.eql(1);
      done();
    });

  });
});
