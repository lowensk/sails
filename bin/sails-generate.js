#!/usr/bin/env node


/**
 * Module dependencies
 */

var _ = require('lodash');
var util = require('util');
var async = require('async');
var reportback = require('reportback')();
var sailsgen = require('sails-generate');
var package = require('../package.json');
var rconf = require('../lib/app/configuration/rc');
var _generateAPI = require('./_generate-api');


/**
 * `sails generate`
 *
 * Generate module(s) for the app in our working directory.
 * Internally, uses ejs for rendering the various module templates.
 */

module.exports = function() {

  // Build initial scope
  var scope = {
    rootPath: process.cwd(),
    modules: {},
    sailsPackageJSON: package,
  };

  // Mix-in rc config
  _.merge(scope, rconf.generators);

  // TODO: just do a top-level merge and reference
  // `scope.generators.modules` as needed (simpler)
  _.merge(scope, rconf);


  // Pass the original CLI arguments down to the generator
  // (but first, remove commander's extra argument)
  // (also peel off the `generatorType` arg)
  var cliArguments = Array.prototype.slice.call(arguments);
  cliArguments.pop();
  scope.generatorType = cliArguments.shift();
  scope.args = cliArguments;

  // Create a new reportback
  var cb = reportback.extend();

  // Show usage if no generator type is defined
  if (!scope.generatorType) {
    return cb.log.error('Usage: sails generate [something]');
  }

  // Set the "invalid" exit to forward to "error"
  cb.error = function(msg) {
    var log = this.log || cb.log;
    log.error(msg);
    process.exit(1);
  };

  cb.invalid = 'error';

  // If the generator type is "api", we currently treat it as a special case.
  // (todo: pull this out into a simple generator)
  if (scope.generatorType === 'api') {
    if (scope.args.length === 0) {
      return cb.error('Usage: sails generate api [api name]');
    }
    _generateAPI(scope, cb);
  }

  // Otherwise just run whichever generator was requested.
  else {
    cb.success = function() {

      // Infer the `outputPath` if necessary/possible.
      if (!scope.outputPath && scope.filename && scope.destDir) {
        scope.outputPath = scope.destDir + scope.filename;
      }

      // Humanize the output path
      var humanizedPath;
      if (scope.outputPath) {
        humanizedPath = ' at ' + scope.outputPath;
      }
      else if (scope.destDir) {
        humanizedPath = ' in ' + scope.destDir;
      }
      else {
        humanizedPath = '';
      }

      // Humanize the module identity
      var humanizedId;
      if (scope.id) {
        humanizedId = util.format(' ("%s")',scope.id);
      }
      else humanizedId = '';

      cb.log.info(util.format(
        'Created a new %s%s%s!',
        scope.generatorType, humanizedId, humanizedPath
      ));
    };

    //
    return sailsgen(scope, cb);
  }

};
