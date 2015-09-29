#!/usr/bin/env node
/**
* 
* @module sv-isir-corrections
* @description Retrieve batched ISIR corrections for a given date range.
=======
*
* @module sv-isir-corrections
* @description Supports a function to retrieve batched ISIR corrections from the StudentVerification API.
****
*### Environment Requirements:
*
** Internet access (port 80 and SSL over port 5443).
** Node.js installed.
*
*### Installation:
*
*Execute the following from a command prompt:
*
*		npm install -g sv-isir-corrections
=======
*### Configuration:
*
*All configuration is contained within the config.json file.
*
***Logging:** The module is configured to log to a _logs_ folder within the directory that the application is executed from.
*Standard log entries will be written to a file named alfilesystemwatcher.log while unhandled exceptions will
*be logged to a file named alfilesystemwatchererrors.log.
*
*       "logging" : { "directory" : "./logs" }
*
***Authorization:** The upload process requires an authorization token from a secure token service(STS).
*
*       "oauthWrapRequest" : { "url":"sts_url", "creds":{"uid":"userid", "pwd":"password"}, "wrapScope":"scope" }
*
*The following values must be provided in order to invoke the STS and acquire an authorization token:
*
*JSON Element | Description
*-------------|--------------------------------------------------------------------------
*url | The STS URL
*creds.userid | User Id
*creds.pwd | User password
*wrapScope | The resource that will be accessed using the authorization token.
*
***StudentVerification API:** Defines the root URL of the StudentVerification API. A valid value must be specified.
*
*       "svApi" : { "rootUrl" : "root_url" }
*
*###Running sv-isir-corrections:
*
*Execute manually by opening a command prompt:
*
*		sv-isir-corrections --startDate=[YYYY-MM-DD] --endDate=[YYYY-MM-DD] --outputDir=[path]
*		
*		sv-isir-corrections --startDate=2015-09-21 --endDate=2015-09-22 --outputDir=c:\temp\isirs
*
*All parameters must be specified. StartDate must chronologically preceed or equal endDate.
*It is best to provide an absolute path for outputDir; relative paths will be based on the directy in which
*the command is executed. Any path provided must already exist.
*All correction files that were batched during this time period will be returned. The dates are inclusive.
**/

'use strict';

var svApi = require('sv-api');
var docs = svApi.documents;
var isirs = svApi.isirs;

var logger = require('./logger');
var oauth = require('oauth-wrap');
var config = require('./config');
var promise = require('promise');
var args = require('optimist').argv;
var fs = require( 'fs' );

svApi.logger = logger;

var validate = function(startDate, endDate) {
	try {
		if (!startDate || !endDate) {
			return false;
		}		
		var start = new Date(startDate);
		var end = new Date(endDate);		
		var startISO = start.toISOString();
		var endISO = end.toISOString();
		logger.debug('start: ', startISO);		
		logger.debug('end: ', endISO);
		if (start > end) return false;
		return true;

	} catch (error) {		
		logger.debug(error.stack);	
	}
	return false;
}

var pad = function(text) {
	var temp = '0' + text.toString();
	return temp.substring(temp.length - 2);
}

var formatDate = function(dateString) {
	var date = new Date(dateString);
	return pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + '-' + date.getFullYear();
}

var get = function(startDate, endDate, outputDir) {

	if (!outputDir || !fs.existsSync(outputDir)) {
		logger.error('outputDir does not exist.');
		return;
	}

	if (!validate(startDate, endDate)) {
		logger.error('Invalid date(s) detected.');
		// allow logger to write to log before exit
		return;
	}

	var oauthRequest = config.oauthWrapRequest;

	oauth.getAuthHeader(oauthRequest.url,
            oauthRequest.creds.uid,
            oauthRequest.creds.pwd,
            oauthRequest.wrapScope)
		.then(function(authorization) {
			isirs.getCorrections(config.svApi.rootUrl, 
				authorization, 
				formatDate(startDate), 
				formatDate(endDate), 
				outputDir)	
				.then(function(files) {
					logger.debug('files: ', files);
					if (files.length > 0) {
						logger.info(files.length + ' ISIR correction files were successfully retrieved.');
						for (var i = 0; i < files.length; i++) {
							logger.info('File Name: ' + files[i].name);
						}
					} else {
						logger.info('No ISIR corrections found.');
					}
				})
				.catch(function(error) {
					logger.error('error retrieving ISIR corrections: ', error.stack);
					return;										
				});
		})
		.catch(function(error) {
			logger.error('error retrieving authorization: ', error.stack);
			return;
		});
}

var startDate = args.startDate;
var endDate = args.endDate;
var outputDir = args.outputDir;

// allow logger to write to log before exit
setTimeout(get(startDate, endDate, outputDir), 2000);
