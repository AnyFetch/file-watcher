'use strict';

require('should');

var path = require('path');
var Anyfetch = require('anyfetch');
var fs = require('fs');

var sendToAnyFetch = require('../lib/').sendToAnyFetch;
var init = require('../lib/').init;

describe('sendToAnyFetch() function', function() {
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
    // Clean cursor
    try {
      fs.unlinkSync(GLOBAL.CURSOR_PATH);
    }
    catch(e) {}
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
      fs.unlinkSync(GLOBAL.CURSOR_PATH);
    }
    catch(e) {}
  });

  it('should update account', function(done) {

    init("randomAccessToken", path.resolve(__dirname + "../../test/sample-directory"), "test");

    sendToAnyFetch(function(err) {
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
