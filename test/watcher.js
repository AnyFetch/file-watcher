"use strict";

require('should');

var fs = require('fs');
var Anyfetch = require('anyfetch');

var watcher = require('../lib/watcher');
var getCursorPath = require('../lib/helpers/cursor').getCursorPath;


describe('watcher', function() {
  var dir = __dirname;
  watcher(dir, "randomToken");

  process.env.ANYFETCH_API_URL = 'http://localhost:1338';

  var countUploadedFile = 0;
  var countDeletedFile = 0;

  var mockServerHandler = function(url){
    if(url.indexOf("/file") !== -1) {
      countUploadedFile += 1;
    }
    if(url.indexOf("/file") === -1 && url.indexOf("/identifier") !== -1){
      countDeletedFile += 1;
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

  after(function(){
    fs.unlinkSync(getCursorPath(dir));
  });

  it('should send file on create', function(done) {
    fs.writeFile(dir + '/file.test', "some content", function() {
      setTimeout(function() {
          countUploadedFile.should.eql(1);
          done();
        }, 7000);
    });
  });

  it('should send file on update', function(done) {
    fs.writeFile(dir + '/file.test', "some content", function() {
      setTimeout(function() {
          countUploadedFile.should.eql(2);
          done();
        }, 7000);
    });
  });

  it('should send file on delete', function(done) {
    fs.unlinkSync(dir + '/file.test', "some content");
    setTimeout(function() {
        countDeletedFile.should.eql(1);
        done();
      }, 7000);
  });


});
