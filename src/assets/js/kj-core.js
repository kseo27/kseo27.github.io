/*!
 * Kseo27 Core with jQuery
 * dependencies: jquery, k-common.js
 */
( function( factory ) {
	// Browser globals
	if ( typeof window !== 'undefined' ) factory( window );

}( function( window ) { 'use strict';

var env = window.env = 'development';

var core = {},
	resources = {},
	inprogress = {},
	descriptors = {};

// Shorthand for removeChild
function _remove( node ) {
	if ( node.parentNode ) {
		node.parentNode.removeChild( node );
	}
}


if ( env === 'production' || typeof console !== 'object' ) {
	window.console = { error: noop, info: noop, log: noop, warn: noop };
}


var rerrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)?Error$/;

/**
 * Common exception hook @see jQuery.Deferred.exceptionHook
 * @param {string?} message
 * @param {object} error
 */
function exceptionHook( message, error ) {
	if ( typeof message === 'object' ) {
		error = message;
		message = undefined;
	}
	if ( error && rerrorNames.test( error.name ) ) {
		console.error( message ? message + '\n' : '$exception', error );
	}
}


var rjs = /[^\\/]\.js$/i,
	rcss = /[^\\/]\.css$/i,
	rstack = /^\n*[^\n]+(\n[^\n]+)/;

/**
 * Import resources as HTML documents
 * @param {String} url
 * @param {object} props Properties(attributes) to set on a node
 */
function $import( url, props ) {
	var node, prop, absurl, warning, holded, done, timeout;

	try {
		absurl = normalizeURL( url );

		if ( resources[ absurl ] ) {
			warning = '$import: The resource has already been imported ';
		} else if ( inprogress[ absurl ] ) {
			warning = '$import: The resource import is in progress ';
		}

		if ( warning ) {
			if ( env === 'production' ) return;
			( node = new Error() ).name = '';
			node = rstack.exec( node.stack );
			console.warn( warning + "'" + url + "'" + ( node && node[ 1 ] || '' ) );
			return node = undefined;
		}

		if ( rjs.test( absurl ) ) {
			node = document.createElement( 'script' );
			node.src = url;

		} else if ( rcss.test( absurl ) ) {
			node = document.createElement( 'link' );
			node.rel = 'stylesheet';
			node.href = url;

		} else {
			throw new URIError( "Invalid URI '" + url + "'" );
		}

		if ( isPlainObject( props ) ) {
			for ( prop in props ) {
				if ( node[ prop ] !== undefined &&
					( typeof node[ prop ] === typeof props[ prop ] )
				) {
					node[ prop ] = props[ prop ];
				}
			}
		}

		inprogress[ absurl ] = true;

		if ( node.src ) {
			$.holdReady( true );
			holded = true;
		}

		done = function( ev ) {
			var invalid;

			window.clearTimeout( timeout );
			node.onload = node.onerror = null;
			delete inprogress[ absurl ];
			holded && $.holdReady( false );

			if ( ev && ev.target.sheet ) {
				try { invalid = !ev.target.sheet.cssRules.length }
				catch( e ) { invalid = !( e instanceof DOMException ) }
			}

			if ( !ev || ev.type === 'error' || invalid ) {
				_remove( node );
				exceptionHook( '$import exception: ' + absurl,
					new URIError( "Failed to import '" + url + "'" ) );
			} else {
				resources[ absurl ] = true;
			}

			// Do not remove stylesheet
			if ( env === 'production' && node.src ) _remove( node );
			node = done = null;
		};

		timeout = window.setTimeout( done, 30000 );
		node.onload = node.onerror = done;

		( document.body || document.head ).appendChild( node );

	} catch ( err ) {
		exceptionHook( '$import exception: ' + ( absurl || url ), err );
		if ( absurl ) delete inprogress[ absurl ];
		holded && $.holdReady( false );
		node = done = null;
	}
}


var rjson = /[^\\/]\.json([#?]|$)/i,
	rbrace = /^(?:\{[\S\s]*\}|\[[\S\s]*\])$/,
	rsuccess = /^(?:0|2\d\d|304)$/;

/**
 * Instant synchronous import request
 * @param {String} url
 * @returns {String|Object} Returns string or JSON object data
 */
function $importGet( url ) {
	var response,
		xhr = new window.XMLHttpRequest();
	xhr.open( 'GET', url, false );
	xhr.send();
	response = xhr.responseText;
	return rsuccess.test( xhr.status ) ? ( ( rjson.test( url ) ||
		/\bjson\b/.test( xhr.getResponseHeader( 'Content-Type' ) ) ) ?
			( rbrace.test( response ) ? JSON.parse( response ) : null ) :
		response ) : '';
}

/**
 * ? Experiment: Such as module import
 * @param {String} url
 * @returns {*} Returns the result of the executed script
 */
function $importFrom( url ) {
	var response, absurl;
	try {
		absurl = normalizeURL( url );
		response = $importGet( url );
		if ( !response || !( response = Function( response )() ) ) {
			throw new URIError( "Failed to import '" + url + "'" );
		}
		return response;
	} catch ( err ) {
		if ( err.name === 'SyntaxError' ) {
			err.message = 'Failed to parse. ' + err.message;
		}
		exceptionHook( '$import.from exception: ' + ( absurl || url ), err );
	}
}

// Define in the `$import`
defineProps( true, $import, { get: $importGet, from: $importFrom } );


var rscriptType = /^$|^module$|\/(?:java|ecma)script/i;

core.initResources = function( doc ) {
	var node, name, url, i = 0,
		nodes = doc.querySelectorAll( 'script[src], link[rel=stylesheet]' );

	while ( ( node = nodes[ i++ ] ) ) {

		// ? If URL normalization is required
		// url = node.src || node.href;
		// if ( !url || resources[ ( url = normalizeURL( url ) ) ] ) continue;

		url = cleanPath( node.src || node.href || '' );
		if ( !url || resources[ url ] ) continue;

		name = node.nodeName.toLowerCase();
		if ( name == 'link' || rscriptType.test( node.type || '' ) ) {
			resources[ url ] = true;
		}
	}

	// release the core object
	for ( name in core ) delete core[ name ];
	core = undefined;
}

core.parseDocument = function( html ) {
	var parser, docImp, base;

	try {
		parser = new DOMParser();
		docImp = parser.parseFromString( html, 'text/html' );
	} catch ( e ) {
		try {
			docImp = document.implementation.createHTMLDocument( '' );
			docImp.body.innerHTML = html;
		} catch ( err ) {
			exceptionHook( 'kj-core exception: Failed to parse Document', err );
			docImp = undefined;
			return false;
		}
	} finally {
		if ( docImp ) {
			base = docImp.createElement( 'base' );
			base.href = document.location.href;
			docImp.head.appendChild( base );
			core.initResources( docImp );

			docImp.head.textContent = '';
			docImp.body.textContent = '';
		}
		parser = docImp = base = null;
	}
}

// Get index.html data
core.indexHtml = $importGet( '/' );

if ( core.parseDocument( core.indexHtml ) === false ) {

	// * Referred to jQuery (jQuery.ready)
	// The ready event handler and self cleanup method
	core.completed = function() {
		document.removeEventListener( "DOMContentLoaded", core.completed );
		window.removeEventListener( "load", core.completed );
		core.initResources( document );
	}

	// Catch cases where DOM is loaded
	// after the browser event has already occurred.
	// Support: IE <=9 - 10 only
	// Older IE sometimes signals "interactive" too soon
	if ( document.readyState === "complete" ||
		( document.readyState !== "loading" && !document.documentElement.doScroll ) ) {

		// Handle it asynchronously to allow scripts the opportunity to delay ready
		window.setTimeout( core.completed );

	} else {

		// Use the handy event callback
		document.addEventListener( "DOMContentLoaded", core.completed );

		// A fallback to window.onload, that will always work
		window.addEventListener( "load", core.completed );
	}
}



// @[polyfill] getOwnPropertyDescriptors IE 9-15
if ( !Object.getOwnPropertyDescriptors ) {
	Object.defineProperty( Object, 'getOwnPropertyDescriptors', {
		enumerable: false, configurable: true, writable: true,
		value: function( obj ) {
			var name, names, i = 0, dtors = {};
			try {
				names = Object.getOwnPropertyNames( obj );
				while ( ( name = names[ i++ ] ) ) {
					dtors[ name ] = Object.getOwnPropertyDescriptor( obj, name );
				}
				return dtors;
			} finally {
				names = dtors = null;
			}
		}
	} );
}

// Save original global property descriptors on load
$( window ).one( 'load.storeGlobals', function() {
	descriptors = Object.getOwnPropertyDescriptors( window );

	// ![test] restore
	$restoreGlobals();
} );

function $restoreGlobals() {
	var name, origDtor, curDtor, getter, setter,
		curDtors = Object.getOwnPropertyDescriptors( window );

	for ( name in curDtors ) {
		if ( name === '__proto__' ) continue;
		try {
			if ( descriptors.hasOwnProperty( name ) ) {
				origDtor = descriptors[ name ];
				if ( !origDtor.writable ) continue;

				curDtor = curDtors[ name ];
				getter = curDtor.get ? 'get' : 'value';
				setter = curDtor.get ? 'set' : null;

				if ( origDtor[ getter ] !== curDtor[ getter ] ||
					( setter && origDtor[ setter ] !== curDtor[ setter ] )
				) {
					Object.defineProperty( window, name, origDtor );
				}
			} else {
				delete window[ name ];
			}
		} catch ( err ) {
			exceptionHook( '$restoreGlobals exception:', err );
		}
	}
	origDtor = curDtor = curDtors = null;


	// ![test] log
	if ( env === 'development' ) {
		console.log( 'Set Globals: ' +
			Object.keys( Object.getOwnPropertyDescriptors( window ) ).length +
			' / ' + Object.keys( descriptors ).length );
	}
}


// Define mutable properties globally
defineProps( {
	exceptionHook: exceptionHook
} );

// Define immutable properties globally
defineProps( true, {
	$import: $import,
	$restoreGlobals: $restoreGlobals
} );



} ) );