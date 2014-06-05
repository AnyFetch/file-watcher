'use strict';

require('should');

var uploadFile = require('../../lib/helpers/upload.js').uploadFile;
var Anyfetch = require('anyfetch');

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

    uploadFile(__dirname + "/..", "/sample-directory/txt1.txt", "randomAccessToken", "randomBaseIdentifier", function(err) {
      if(err) {
        throw err;
      }
      countFile.should.be.eql(1);
      done();
    });

  });
});
