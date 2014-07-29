'use strict';

require('should');
var Anyfetch = require('anyfetch');
var path = require('path');

var uploadFile = require('../../lib/helpers/upload').uploadFile;
var deleteFile = require('../../lib/helpers/upload').deleteFile;

describe('API Calls', function() {

  var port = 1338;
  var apiUrl = 'http://localhost:' + port;

  var countUploadedFile = 0;
  var countDeletedFile = 0;

  var deleteDocument = function(req, res ,next){
    countDeletedFile += 1;
    res.send(200);
    next();
  };
  var uploadDocument = function(req, res ,next){
    countUploadedFile += 1;
    res.send(200);
    next();
  };
  var apiServer;

  before(function() {
    // Create a fake HTTP server
    apiServer = Anyfetch.createMockServer();
    apiServer.override("delete", "/documents", deleteDocument);
    apiServer.override("post", "/documents", uploadDocument);
    apiServer.listen(port, function() {
      Anyfetch.setApiUrl(apiUrl);
    });
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
