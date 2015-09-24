'use strict';

var svApi = require('sv-api');
var docs = svApi.documents;
var isirs = svApi.isirs;

var logger = require('./logger');
var oauth = require('oauth-wrap');
var config = require('./config');
var promise = require('promise');

svApi.logger = logger;

var validate = function(startDate, endDate) {
	try {
		if (!startDate || !endDate) {
			return false;
		}		
		var start = new Date(startDate);
		var end = new Date(endDate);

		if (start > end) return false;
		return true;

	} catch (error) {		
		logger.error(errorMessage + '; error: ' + error.stack);	
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

var get = function(startDate, endDate) {

	if (!validate(startDate, endDate)) {
		logger.error('Invalid date(s) detected.');
		// allow logger to write to log before exit
		setTimeout(function(){process.exit(1);}, 3000);
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
				config.targetDir)	
				.then(function(files) {
					logger.debug('files: ', files);
					if (files.length > 0) {
						logger.info(files.length, 'ISIR correction files were successfully retrieved:');
						for (var i = 0; i < files.length; i++) {
							logger.info('File Name: ', files[i].name);
						}
					} else {
						logger.info('No ISIR corrections found.');
					}
				})
				.catch(function(error) {
					logger.error('error retrieving ISIR corrections: ', error.stack);
					// allow logger to write to log before exit
					setTimeout(process.exit(1), 3000);				
				});
		})
		.catch(function(error) {
			logger.error('error retrieving authorization: ', error.stack);
			// allow logger to write to log before exit
			setTimeout(process.exit(1), 3000);				
		});
}

var startDate = process.argv[2];
var endDate = process.argv[3];
get(startDate, endDate);