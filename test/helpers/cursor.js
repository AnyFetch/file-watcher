'use strict';

require('should');

var path = require('path');
var update = require('../../lib/helpers/cursor.js');
var Anyfetch = require('anyfetch');


describe('update() function', function() {

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

  it('should update account', function(done) {
    update(path.resolve(__dirname + "/../sample-directory"), "randomAccessToken", function(err) {
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
