#!/usr/bin/env node --harmony

var program = require('commander');
var create = require('./editor').default;
var e = require('./editor');

program
    .version('0.0.2')
    .arguments('<targetFile> [sourceFile]')
    .option('-o, --overwrite <overwrite>', 'source nodes in the target that may be overwritten')
    .action(function(targetFile, sourceFile) {
        console.log('validating files...');
        if (e.exists(targetFile) && e.exists(sourceFile)) {
            console.log('files exist');
            var o = program.overwrite.split(' ');
            var ow = o || [];
            create(targetFile, sourceFile, ow)
            process.exit(0);
        } else {
            console.warn('one or more of the specified files does not exist!');
        }
        process.exit(1);
    })
    .parse(process.argv);