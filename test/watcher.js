"use strict";

require('should');

var fs = require('fs');
var Anyfetch = require('anyfetch');

var watcher = require('../lib/watcher');
var init = require('./init');


describe('watcher', function() {
  init("randomAccessToken", __dirname, watcher);

  var port = 1338;
  var apiUrl = 'http://localhost:' + port;

  var countUploadedFile = 0;
  var countDeletedFile = 0;

  var deleteDocument = function(req, res ,next){
    countDeletedFile += 1;
    res.send(204);
    next();
  };
  var uploadDocumentAndFile = function(req, res ,next){
    countUploadedFile += 1;
    res.send(204);
    next();
  };

  var apiServer;

  before(function() {
    // Create a fake HTTP server
    apiServer = Anyfetch.createMockServer();
    apiServer.override("delete", "/documents/identifier/:identifier", deleteDocument);
    apiServer.override("post", "/documents/:id/file", uploadDocumentAndFile);
    apiServer.listen(port, function() {
      Anyfetch.setApiUrl(apiUrl);
    });
  });

  beforeEach(function(done) {
    init("randomAccessToken", __dirname, done);
  });

  after(function(done){
    apiServer.close();
    init.clean(done);
  });

  it('should send file on creation', function(done) {
    fs.writeFile(GLOBAL.WATCHED_DIR + '/file.test', "some content", function() {
      function checkHydration() {
        if(countUploadedFile === 1) {
          done();
        }
        else {
          // Let's try again
          setTimeout(checkHydration, 500);
        }
      }
      setTimeout(checkHydration, 500);
    });
  });

  it('should send file on update', function(done) {
    fs.writeFile(GLOBAL.WATCHED_DIR + '/file.test', "some content", function() {
      function checkHydration() {
        if(countUploadedFile === 2) {
          done();
        }
        else {
          // Let's try again
          setTimeout(checkHydration, 500);
        }
      }
      setTimeout(checkHydration, 500);
    });
  });

  it('should delete file on deletions', function(done) {
    fs.unlinkSync(GLOBAL.WATCHED_DIR + '/file.test', "some content");
    function checkHydration() {
      if(countDeletedFile === 1) {
        done();
      }
      else {
        // Let's try again
        setTimeout(checkHydration, 500);
      }
    }
    setTimeout(checkHydration, 500);
  });
});
