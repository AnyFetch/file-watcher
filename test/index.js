'use strict';

require('should');

var path = require('path');
var Anyfetch = require('anyfetch');
var fs = require('fs');

var sendToAnyFetch = require('../lib/').sendToAnyFetch;
var getCursorPath = require('../lib/helpers/cursor').getCursorPath;


describe('sendToAnyFetch() function', function() {

  GLOBAL.WATCHER_DIR = path.resolve(__dirname + "/../test/sample-directory");

  var port = 1338;
  var apiUrl = 'http://localhost:' + port;

  var countFile = 0;
  var uploadFile = function(req, res ,next){
    countFile += 1;
    res.send(204);
    next();
  };

  var apiServer;
  before(function() {
    // Create a fake HTTP server
    apiServer = Anyfetch.createMockServer();
    apiServer.override("post", "/documents/:id/file", uploadFile);
    apiServer.listen(port, function() {
      Anyfetch.setApiUrl(apiUrl);
    });
  });

  after(function(){
    apiServer.close();
    // Clean cursor
    try {
      fs.unlinkSync(getCursorPath());
    }
    catch(e) {}
  });

  it('should update account', function(done) {
    console.log(GLOBAL.WATCHER_DIR)
    sendToAnyFetch("randomAccessToken", function(err) {
      if(err) {
        throw err;
      }
      setTimeout(function() {
        countFile.should.eql(5);
        done();
      }, 300);
    });

  });
});
