#!/usr/bin/env node

"use strict";

var fs = require('fs');

var sendToAnyFetch = require('../lib/index');

console.log(process.argv);

if (process.argv.length !== 4) {
  console.log("You have to provide a directory and an access token");
  process.exit(1);
}

// Is it a directory?
if (!fs.lstatSync(process.argv[2]).isDirectory()) {
  console.log("The directory provided is invalid");
  process.exit(1);
}

sendToAnyFetch(process.argv[2], process.argv[3], function() {
});
