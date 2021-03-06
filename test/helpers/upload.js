'use strict';

require('should');
var Anyfetch = require('anyfetch');
var path = require('path');

var uploadFile = require('../../lib/helpers/upload').uploadFile;
var deleteFile = require('../../lib/helpers/upload').deleteFile;
var init = require('../init');
var save = require("../../lib/helpers/save");

describe('API Calls', function() {
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

  before(function(done) {
    // Create a fake HTTP server
    apiServer = Anyfetch.createMockServer();
    apiServer.override("delete", "/documents/identifier/:identifier", deleteDocument);
    apiServer.override("post", "/documents/:id/file", uploadFileMock);
    apiServer.listen(port, function() {
      Anyfetch.setApiUrl(apiUrl);
    });
    init("randomAccessToken", path.resolve(__dirname + "../../sample-directory"), done);
  });

  after(function(done){
    save.saveSync();
    apiServer.close();
    init.clean(done);
  });

  it('should upload the file', function(done) {
    uploadFile("/txt1.txt", "randomBaseIdentifier", "RandomDate", function(err) {
      if(err) {
        throw err;
      }
      countUploadedDocumendAndFile.should.eql(1);
      done();
    });
  });

  it('should delete the document', function(done) {
    deleteFile("/txt1.txt", "randomBaseIdentifier", function(err) {
      if(err) {
        throw err;
      }
      uploadDocumentAndFile.should.eql(1);
      done();
    });
  });
});
