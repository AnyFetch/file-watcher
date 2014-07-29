"use strict";

require('should');

var fs = require('fs');
var Anyfetch = require('anyfetch');

var watcher = require('../lib/watcher');
var getCursorPath = require('../lib/helpers/cursor').getCursorPath;


describe('watcher', function() {
  var dir = __dirname;
  watcher(dir, "randomToken");

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

  after(function() {
    // Clean cursor
    try {
      fs.unlinkSync(getCursorPath(dir));
    }
    catch(e) {}
  });

  it('should send file on create', function(done) {
    fs.writeFile(dir + '/file.test', "some content", function() {
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
    fs.writeFile(dir + '/file.test', "some content", function() {
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

  it('should send file on delete', function(done) {
    fs.unlinkSync(dir + '/file.test', "some content");
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
