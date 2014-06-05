'use strict';

require('should');
var Anyfetch = require('anyfetch');
var path = require('path');

var uploadFile = require('../../lib/helpers/upload.js').uploadFile;
var deleteFile = require('../../lib/helpers/upload.js').deleteFile;

describe('uploadFile', function() {

  process.env.ANYFETCH_API_URL = 'http://localhost:1338';

  var countUploadedFile = 0;
  var countDeletedFile = 0;

  var mockServerHandler = function(url){
    if(url.indexOf("/file") !== -1) {
      countUploadedFile += 1;
    }
    if(url.indexOf("/file") === -1 && url.indexOf("/identifier") !== -1){
      countDeletedFile += 1;
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
      countUploadedFile.should.eql(1);
      done();
    });

  });

  it('should delete the file', function(done) {

    deleteFile("/sample-directory/txt1.txt", "randomAccessToken", "randomBaseIdentifier", function(err) {
      if(err) {
        throw err;
      }
      countDeletedFile.should.eql(1);
      done();
    });

  });
});
