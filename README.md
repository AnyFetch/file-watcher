AnyFetch File Watcher
======================

[![Build Status](https://travis-ci.org/AnyFetch/file-watcher.svg)](https://travis-ci.org/AnyFetch/file-watcher)[![Dependency Status](https://gemnasium.com/AnyFetch/file-watcher.svg)](https://gemnasium.com/AnyFetch/file-watcher)
[![Coverage Status](https://coveralls.io/repos/AnyFetch/file-watcher/badge.png?branch=master)](https://coveralls.io/r/AnyFetch/file-watcher?branch=master)
[![NPM version](https://badge.fury.io/js/anyfetch-file-watcher.png)](http://badge.fury.io/js/anyfetch-file-watcher)

## Setup
```sh
npm install -g anyfetch-file-watcher --production
```

## Usage
You need an access-token from AnyFetch. If you are not interested with OAuth, a simple authenticated call to `GET https://api.anyfetch.com/token` will retrieve one for you.

```sh
anyfetch-file-watcher $DIRECTORY_TO_WATCH $ACCESS_TOKEN
```

The command is long running, and will watch for file changes until the process dies.
> You can omit the `$ACCESS_TOKEN` and enter it interactively.

### Environment variables
You can define a BULK_SAVE variable to modify the number of files to save in the cursor at the same time. Default: 20

## Reset
Every time you run this command, a JSON file is stored in `~/.anyfetch-file-watcher/$STRIPPED_DIRECTORY.json` with cursor details. If you want to resend everything, remove this file.


## Known bugs
There is a bug in local files deletion detection if these files have non ascii character in their name.