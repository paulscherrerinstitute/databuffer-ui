////////////////////////////////////////////////////////////////////////
//
// This is the local development configuration.
//
// This should never be used outside of a development setup.
// But you can use this as a template for setting up a new deployment.
//
// INSTRUCTIONS:
//
// 1.  Copy this file to a location outside of the root of the app.
//
// 2.  Configure the web server to serve the copied file when
//     URL /config/databuffer-ui.config.js is requested.
//
// 3.  Edit the copied file and adjust the settings as appropirate.
//
// 4.  Remove everything below the line marked with `----8<----`.
//     Of course, you can delete this instructional comment, too.
//
// 4.  Access the deployed app and verify there are NO ERROR MESSAGES
//     in the browser's console.
//
////////////////////////////////////////////////////////////////////////
window.DatabufferUi = {
	QUERY_API: 'http://localhost:8080',
	DISPATCHER_API: 'http://localhost:8081',
}

// ----8<--------8<--------8<--------8<--------8<--------8<--------8<----

//
// This block acts as a safeguard to detect, when this config is used
// outside of the local development environment.
//
switch (window.location.hostname) {
	case '127.0.0.1':
	case '::1':
	case 'localhost':
		// these are all local, that's fine.
		console.info('Loaded local development configuration')
		break

	default:
		console.error('App databuffer-ui has not been configured properly!')
}
