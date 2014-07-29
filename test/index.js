'use strict';

require('should');

var fs = require('fs');
var path = require('path');
var Anyfetch = require('anyfetch');

var update = require('../lib/');
var getCursorPath = require('../lib/helpers/cursor').getCursorPath;


describe('update() function', function() {

  var port = 1338;
  var apiUrl = 'http://localhost:' + port;


  var countFile = 0;
  var uploadFile = function(req, res ,next){
    countFile += 1;
    res.send(200);
    next();
  };

  var apiServer;
  before(function() {
    // Create a fake HTTP server
    apiServer = Anyfetch.createMockServer();
    apiServer.override("post", "/documents", uploadFile);
    apiServer.listen(port, function() {
      Anyfetch.setApiUrl(apiUrl);
    });
  });

  after(function(){
    apiServer.close();
    // Clean cursor
    try {
      fs.unlinkSync(getCursorPath(path.resolve(__dirname + "/../test/sample-directory")));
    }
    catch(e) {}
  });

  it('should update account', function(done) {
    update(path.resolve(__dirname + "/../test/sample-directory"), "randomAccessToken", function(err) {
      if(err) {
        throw err;
      }
      setTimeout(function() {
        countFile.should.eql(5);
        done();
      }, 200);
    });

  });
});
