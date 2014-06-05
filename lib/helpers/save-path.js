"use strict";
var fs = require("fs");

var getSavePath = function(dir) {
  var homeDir = process.env.HOMEPATH || process.env.HOME;
  if(!getSavePath.hasMkdir) {
    try {
      fs.mkdirSync(homeDir + "/.anyfetch-file-watcher/");
    }
    catch(err) {}
    getSavePath.hasMkdir = true;
  }
  return homeDir + "/.anyfetch-file-watcher/" + dir.trim().replace(/(\/|\\)/g, '');
};
getSavePath.hasMkdir = false;

module.exports = getSavePath;
