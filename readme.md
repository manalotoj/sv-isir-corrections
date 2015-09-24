<a name="module_al-file-upload"></a>
## al-file-upload
Supports a function to upload an input file to the AwardLetter Files API.***### Environment Requirements:* Internet access (port 80 and SSL over port 5443).* Node.js installed.### Installing directly from github:Clone or download as zip to local machine. For the later, unzip to desired location.In a command prompt at the root installation directory, execute *>npm install* to install the followingall module dependencies.### Configuration:All configuration is contained within the config.json file.**Logging:** The module is configured to log to a _logs_ folder within the root directory of the application.Standard log entries will be written to a file named alfilesystemwatcher.log while unhandled exceptions willbe logged to a file named alfilesystemwatchererrors.log.      "logging" : { "directory" : "./logs" }**Authorization:** The upload process requires an authorization token from a secure token service(STS).      "oauthWrapRequest" : { "url":"sts_url", "creds":{"uid":"userid", "pwd":"password"}, "wrapScope":"scope" }The following values must be provided in order to invoke the STS and acquire an authorization token:JSON Element | Description-------------|--------------------------------------------------------------------------url | The STS URLcreds.userid | User Idcreds.pwd | User passwordwrapScope | The resource that will be accessed using the authorization token.**StudentVerification API:** Defines the root URL of the StudentVerification API.      "svApi" : { "rootUrl" : "root_url" }###Running sv-isir-corrections:Execute manually by opening a command prompt at the installation root directory:		node sv-isir-corrections.js [YYYY-MM-DD] [YYYY-MM-DD]				ex. node al-file-upload.js '2015-09-21' '2015-09-22'The command accepts two date parameters. The second parameter cannot be less than the first parameter.All correction files that were batched during this time period will be returned. The dates are inclusive.

