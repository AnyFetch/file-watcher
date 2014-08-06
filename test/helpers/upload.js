'use strict';

require('should');
var Anyfetch = require('anyfetch');
var path = require('path');

var uploadFile = require('../../lib/helpers/upload').uploadFile;
var deleteFile = require('../../lib/helpers/upload').deleteFile;

describe('API Calls', function() {

  GLOBAL.WATCHED_DIR = path.resolve(__dirname + "/..");

  var port = 1338;
  var apiUrl = 'http://localhost:' + port;

  var countUploadedDocumendAndFile = 0;
  var uploadDocumentAndFile = 0;

  var deleteDocument = function(req, res ,next){
    uploadDocumentAndFile += 1;
    res.send(204);
    next();
  };
  var uploadFileMock = function(req, res ,next){
    countUploadedDocumendAndFile += 1;
    res.send(204);
    next();
  };
  var apiServer;

  before(function() {
    // Create a fake HTTP server
    apiServer = Anyfetch.createMockServer();
    apiServer.override("delete", "/documents/identifier/:identifier", deleteDocument);
    apiServer.override("post", "/documents/:id/file", uploadFileMock);
    apiServer.listen(port, function() {
      Anyfetch.setApiUrl(apiUrl);
    });
  });

  after(function(){
    apiServer.close();
  });

  it('should upload the file', function(done) {
    uploadFile("/txt1.txt", "randomAccessToken", "randomBaseIdentifier", "RandomDate", function(err) {
      if(err) {
        throw err;
      }
      countUploadedDocumendAndFile.should.eql(1);
      done();
    });
  });

  it('should delete the document', function(done) {
    deleteFile("/txt1.txt", "randomAccessToken", "randomBaseIdentifier", function(err) {
      if(err) {
        throw err;
      }
      uploadDocumentAndFile.should.eql(1);
      done();
    });
  });
});
