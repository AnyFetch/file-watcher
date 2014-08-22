"use strict";

var async = require("async");
var fs = require("fs");
var file = require('../lib/helpers/file.js');

module.exports = function initialization(accessToken, dir, cb) {
  async.waterfall([
    function initalisation(cb) {
      GLOBAL.CURSOR = {};
      GLOBAL.ACCESS_TOKEN = accessToken;
      GLOBAL.WATCHED_DIR = dir;
      var homeDir = process.env.HOMEPATH || process.env.HOME;
      if(!fs.existsSync(homeDir + "/.anyfetch-file-watcher/")) {
        fs.mkdirSync(homeDir + "/.anyfetch-file-watcher/");
      }
      GLOBAL.CURSOR_PATH = homeDir + "/.anyfetch-file-watcher/" + GLOBAL.WATCHED_DIR.trim().replace(/(\/|\\)/g, '') + '-' + GLOBAL.ACCOUNT;
      GLOBAL.ACCOUNT = "test";
      file.load(cb);
    },
    function cleanCursorcb(cb) {
      fs.unlink(GLOBAL.CURSOR_PATH, function() {
        // Skip errors
        cb();
      });
    }
  ], cb);
};

module.exports.clean = function(cb) {
  fs.unlink(GLOBAL.CURSOR_PATH, function() {
    // Skip errors
    cb();
  });
};
