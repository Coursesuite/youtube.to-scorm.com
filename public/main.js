/*
 * Check the user input, load a zip, do some simple string replacements, hand the zip to the user... that's all
 */

var zip = undefined;
var filename = "";
var title = "";

// check the user has entered the url properly
function processUrl() {
	var url = document.getElementById('url').value.trim();

	fetch(location.protocol + '//noembed.com/embed?url=' + encodeURIComponent(url))
		.then(function(response) {
			return response.json()
		})
		.then(function(json) {
			if (json.error) throw 'URL was not understood or supported';
			document.getElementById('url').value = json.url;
			var re = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|(?:embed|v)\/))([^\?&"'>]+)/;
			var video = re.exec(json.url)[1];
			process(video, json.title);
		})
		.catch(function(message) {
			alert(message);
		});
}

// user has entered a valid YOUTUBE url, so ...
function process(video, name) {

	title = name.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
	filename = name.replace(/\s/g,'_').replace(/[^a-z0-9_-]/gi,'');

	// load the zip package
	fetch('package.zip')

		// then get the array buffer
		.then(function(response) {
			return response.arrayBuffer();
		})

		// then load the zip
		.then(function(ab) {
			return zip.loadAsync(ab);
		})

		// make sure we don't have the __MACOS folder
		.then(function(obj) {
			return obj.remove("__MACOSX");
		})

		// then find files we need to update
		.then(function(package) {
			var fixes = [];
			package.forEach(function(relativePath,file) {
				switch(relativePath) {
					case "imsmanifest.xml":
					case "index.html":

						// create a promise that we will be processing this file
						fixes.push(new Promise(function(resolve,reject) {

							// extract the file directly from within the zip
							file
								.async("string")
								.then(function(content) {

									// do some simple string replacements
									return content
												.replaceAll('@@timestamp@@', (new Date().getTime()).toString(36))
												.replaceAll('@@title@@', title)
												.replaceAll('@@media@@', video);
								})

								// put it back into the zip
								.then(function(content) {
									package.file(relativePath, content);

									// mark this promise as resolved
									resolve();
								});
						}));
				}
			})

			// all the promises need to resolve in order to continue
			return Promise.all(fixes);
		})

		// then download the package
		.then(download);
}

// set up any objects
function main(event) {
	zip = new JSZip();
	document.querySelector('button').addEventListener('click', processUrl);
}

// download the package
function download(package) {
	zip.generateAsync({type:"blob"})
	.then(function (blob) {
	    saveAs(blob, filename + "-to-scorm.zip");
	    document.getElementById('url').value = '';
	});
}

// event listeners
document.addEventListener('DOMContentLoaded', main);

// um, yeah, that's the whole app.