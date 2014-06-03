"use strict";

var Anyfetch = require('anyfetch');
var fs = require('fs');
var path = require('path');

module.exports = function uploadFile(filePath, accessToken, baseIdentifier, cb) {
  var anyfetch = new Anyfetch();
  anyfetch.setAccessToken(accessToken);

  // Send a document to anyFetch
  var document = {
    'identifier': baseIdentifier + filePath,
  };

  var fileConfig = function() {
    // Wrap this in a function to avoid creating the stream before reading it.
    return {
      file: fs.createReadStream(filePath),
      filename: path.baseName(path),
    };
  };

  anyfetch.sendDocumentAndFile(document, fileConfig, cb);
};
