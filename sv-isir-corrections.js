/**
*
* @module sv-isir-corrections
* @description Supports a function to retrieve batched ISIR corrections from the StudentVerification API.
****
*### Environment Requirements:
*
** Internet access (port 80 and SSL over port 5443).
** Node.js installed.
*
*### Installing directly from github:
*
*Clone or download as zip to local machine. For the later, unzip to desired location.
*In a command prompt at the root installation directory, execute the following command
* to install all module dependencies:
*
*		>npm install
*
*### Configuration:
*
*All configuration is contained within the config.json file.
*
***Logging:** The module is configured to log to a _logs_ folder within the root directory of the application.
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
***StudentVerification API:** Defines the root URL of the StudentVerification API.
*
*       "svApi" : { "rootUrl" : "root_url" }
*
***Target Directory:** Defines the directory/path to which batched ISIR correction files will be written to.
*This value is defaulted to a target directory in the root installation directory.
*
*       "targetDir" : "./target"
*
*###Running sv-isir-corrections:
*
*Execute manually by opening a command prompt at the installation root directory:
*
*		node sv-isir-corrections.js [YYYY-MM-DD] [YYYY-MM-DD]
*		
*		ex. node al-file-upload.js '2015-09-21' '2015-09-22'
*
*The command accepts two date parameters. The second parameter cannot be less than the first parameter.
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