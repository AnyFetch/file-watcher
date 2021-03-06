'use strict';

require('should');
var Anyfetch = require('anyfetch');
var path = require('path');

var sendNewOrUpdatedFiles = require('../lib/').sendNewOrUpdatedFiles;
var init = require('./init');

describe('sendNewOrUpdatedFiles() function', function() {
  var port = 1338;
  var apiUrl = 'http://localhost:' + port;

  var countFile = 0;
  var uploadFile = function(req, res ,next){
    countFile += 1;
    res.send(204);
    next();
  };

  var apiServer;
  before(function(done) {
    apiServer = Anyfetch.createMockServer();
    apiServer.override("post", "/documents/:id/file", uploadFile);
    apiServer.listen(port, function() {
      Anyfetch.setApiUrl(apiUrl);
    });
    init("randomAccessToken", path.resolve(__dirname + "../../test/sample-directory"),  done);
  });

  after(function(done){
    apiServer.close();
    init.clean(done);
  });

  it('should update account', function(done) {
    sendNewOrUpdatedFiles(function(err) {
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
