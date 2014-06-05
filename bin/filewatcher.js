#!/bin/env node

"use strict";

var fs = require('fs');

var sendToAnyFetch = require('../lib/index');

if (process.argv.length > 3) {
  console.log("You have to provide a directory and an access token");
  process.exit(1);
}

// Is it a directory?
if (!fs.lstatSync(process.argv[1]).isDirectory()) {
  console.log("The directory provided is invalid");
  process.exit(1);
}

sendToAnyFetch(process.argv[1], process.argv[2], function() {
  console.log("Everything has been sent");
});