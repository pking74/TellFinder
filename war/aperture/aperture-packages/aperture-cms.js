/**
 * Copyright (c) 2013-2015 Uncharted Software Inc. 
 * http://uncharted.software/
 * 
 * Released under the MIT License.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*
 * Aperture
 */
aperture = (function(aperture){

/**
 * Source: store.js
 * Copyright (c) 2013-2015 Uncharted Software Inc.
 * @fileOverview Aperture Content Service API
 */

/**
 * @namespace Functions used to store, get, and delete documents in a content store.
 * @requires an Aperture CMS service
 * @requires jQuery
 */
aperture.store = (function() {


	return {
		/**
		 * Store a data item in the CMS.
		 * @param {String|Object} data the data item to store.  Can be a string or a javascript object.
		 * If a string it will be stored as is.  If an object, it will be converted to JSON
		 * and stored.
		 *
		 * @param {Object} [descriptor] an optional descriptor object that specifies the cms
		 * store, document id, and document revision.
		 * @param {String} [descriptor.store] the name of the content store in which to store the
		 * document.  If not provided, the default will be used.
		 * @param {String} [descriptor.id] the id of the document to store.  If this is a new document
		 * this will try and use this id for the document when storing.  If this is an existing document
		 * being updated this id specifies the id of the document to update.
		 * @param {String} [descriptor.rev] the revision of the document to store.  If updating a document
		 * this must be set to the current revision to be allowed to perform the update.  This prevents
		 * updating a document with out of date information.
		 *
		 * @param {Function(descriptor)} [callback] a function to be called after the store command completes on the server.  The
		 * callback will be given a descriptor object in the same format as the descriptor to the store function
		 * on success.  The descriptor describes the successfully stored document.
		 */
		store : function(data, descriptor, callback) {
			var innerCallback = callback && function( result, info ) {
				if( info.success ) {
					var location = info.xhr && info.xhr.getResponseHeader && info.xhr.getResponseHeader("Location");
					// Call the callback with a hash that describes the stored document
					// and provides a URL to it
					callback( {
							id: result.id,
							rev: result.rev,
							store: result.store,
							url: location
						});
				} else {
					// Failure
					// TODO Provide reason why?
					callback( null );
				}
			};

			// Extend descriptor defaults
			descriptor = aperture.util.extend({
				// TODO Get from config
				store: 'aperture'
				// id: none
				// rev: none
			}, descriptor);

			// Use the given content type or try to detect
			var contentType = descriptor.contentType ||
				// String data
				(aperture.util.isString(data) && 'text/plain') ||
				// JS Object, use JSON
				'application/json';

			// TODO URI pattern from config service?
			// Construct the uri
			var uri = '/cms/'+descriptor.store;
			// Have a given id?  Use it
			if( descriptor.id ) {
				uri += '/'+descriptor.id;
			}
			// Have a rev?  Use it
			if( descriptor.rev ) {
				uri += '?rev='+descriptor.rev;
			}

			// Make the call
			aperture.io.rest(uri, "POST", innerCallback, {
				postData: data,
				contentType: contentType
			});
		},

		/**
		 * Gets the url of a document in the store given a descriptor.
		 *
		 * @param {Object} descriptor an object describing the document to get
		 * @param {String} [descriptor.store] the name of the content store to use.  If not
		 * provided the default will be used.
		 * @param {String} descriptor.id the id of the document to get
		 * @param {String} [descriptor.rev] the revision of the document to get.  If not
		 * provided, the most recent revision will be retrieved.
		 */
		getURL : function(descriptor) {
			if( !descriptor || descriptor.id == null || descriptor.id === '' ) {
				aperture.log.error('get from store must specify an id');
				return;
			}

			// TODO Get from config
			descriptor.store = descriptor.store || 'aperture';

			// Construct the url
			var url = '/cms/'+descriptor.store+'/'+descriptor.id;
			// Have a rev?  Use it
			if( descriptor.rev ) {
				url += '?rev='+descriptor.rev;
			}

			return url;
		},
		
		/**
		 * Gets a document from the server given a descriptor.
		 *
		 * @param {Object} descriptor an object describing the document to get
		 * @param {String} [descriptor.store] the name of the content store to use.  If not
		 * provided the default will be used.
		 * @param {String} descriptor.id the id of the document to get
		 * @param {String} [descriptor.rev] the revision of the document to get.  If not
		 * provided, the most recent revision will be retrieved.
		 *
		 * @param {Function(data,descriptor)} [callback] a callback to be called when the document
		 * data is available.  The callback will be provided with the data and a hash of the
		 * document descriptor.
		 */
		get : function(descriptor, callback) {
			var url = getURL(descriptor);
			
			if (url) {
				var innerCallback = callback && function( result, info ) {
					if( info.success ) {
						// Call user's callback with the document data
						// TODO Get the latest revision via ETAG
						callback( result, descriptor );
					} else {
						// TODO Better error handling?
						callback(null, descriptor);
					}
				};

				// Make the call
				aperture.io.rest(uri, "GET", innerCallback);
				
			} else {
				callback(null, descriptor);
			}
		}
	};

}());

return aperture;
}(aperture || {}));