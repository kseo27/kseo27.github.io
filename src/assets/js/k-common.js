/*!
 * Kseo27 Common JavaScript
 */
( function( factory ) {
	// Browser globals
	if ( typeof window !== 'undefined' ) factory( window );

}( function( window ) { 'use strict';
// *--- Category ----------------------------------


/* Golbal Properties
============================================================*/

// helpers for global properties
var ObjCtor = Object,
	getProto = Object.getPrototypeOf,
	noop = function() {},
	common = {},
	toString = common.toString,
	hasOwn = common.hasOwnProperty,
	arr = 'Boolean Number String Function Array Date RegExp Object Error Symbol Blob File'.split( ' ' );

function defineProps( freeze, target, props ) {
	var prop, name, dtors = {};
	props = props || target || freeze;

	if ( typeof freeze !== 'boolean' ) {
		target = freeze;
		freeze = false;
	}

	if ( target === props ) target = window;
	freeze = !freeze;

	for ( name in props ) {
		prop = props[ name ];

		if ( name === '__proto__' || target === prop ) {
			continue;
		}

		dtors[ name ] = {
			enumerable: true,
			configurable: freeze,
			writable: freeze,
			value: prop
		}
	}

	Object.defineProperties( target, dtors );
	prop = dtors = null;
}


( function( t ) {
	while ( ( t = arr.pop() ) ) {
		common[ '[object ' + t + ']' ] = t.toLowerCase();
	}
} )();

// * Referred to jQuery (jQuery.type)
function typeis( obj, type ) {
	var len = arguments.length,
		otype = obj == null ? obj + '' :

		// Support: Android <=2.3 only (functionish RegExp)
		typeof obj === 'object' || typeof obj === 'function' ?
			common[ toString.call( obj ) ] || 'untyped' : typeof obj;

	if ( len < 2 ) return otype;

	var ret = false,
		i = 1;

	for ( ; i < len; i++ ) {
		type = arguments[ i ];

		if ( obj === type || otype === type ||
			( typeof type === 'function' && obj instanceof type )
		) {
			ret = true;
			break;
		}
	}

	type = null;
	return ret;
}


var rhashQuery = /[#?].*$/;

function cleanPath( url ) {
	try {
		return url.replace( rhashQuery, '' );
	} catch ( e ) {
		throw new URIError( "Invalid URI '" + url + "'" );
	}
}

// * Referred to jQuery (jQuery.ajax)
// Normalize to absolute path without hashes or queries
function normalizeURL( url ) {
	var urlAnchor;
	url = cleanPath( url );

	// Support: IE <=8 - 11, Edge 12 - 15
	// IE throws exception on accessing the href property if url is malformed,
	// e.g. http://example.com:80x/
	try {
		urlAnchor = document.createElement( 'a' );
		urlAnchor.href = url;

		// Support: IE <=8 - 11 only
		// Anchor's host property isn't correctly set when s.url is relative
		urlAnchor.href = urlAnchor.href;
		url = urlAnchor.href;
	} catch ( e ) {}

	urlAnchor = null;

	return url;
}


var rnative = /^[^{]+\{\s*\[native \w/;

// * Referred to jQuery (Check support)
function isNative( fn ) {
	return rnative.test( typeof fn == 'string' ? window[ fn ] : fn );
}


// * Referred to jQuery (jQuery.isPlainObject)
function isPlainObject( obj ) {
	var proto, ctor;

	if ( toString.call( obj ) !== '[object Object]' ) return false;

	// Objects with no prototype (e.g., `Object.create( null )`) are plain
	if ( !( proto = getProto( obj ) ) ) return true;

	// Objects with prototype are plain if they were constructed by a global Object function
	ctor = hasOwn.call( proto, 'constructor' ) && proto.constructor;
	return ctor === ObjCtor;
}


/**
 * *--- Regular Expression ------------------------
 * @see https://www3.ntu.edu.sg/home/ehchua/programming/howto/Regexe.html
 */

var // Special Regex Characters
	rspecial = /[.*+?^${}()|[\]\\]/g,

	// Korean(Hangul) start(standard) / end
	hangulStd = 0xAC00,
	hangulEnd = 0xD7A3,

	// Korean(Hangul) consonants (자음)
	hangulC = [ 0x3131, 0x3132, 0x3134, 0x3137, 0x3138, 0x3139, 0x3141, 0x3142, 0x3143,
		0x3145, 0x3146, 0x3147, 0x3148, 0x3149, 0x314A, 0x314B, 0x314C, 0x314D, 0x314E ],

	// Pattern identifier
	rpattern = /([\x20\t\r\n\f]+)|([\u3131-\u314E])|([\uAC00-\uD7A3])|\S/g;


function escapeRegex( pattern ) {
	return pattern.replace( rspecial, '\\$&' );
}

/**
 * Returns regular expression for Korean
 * @param {String|String[]} patterns
 * @param {String} flags
 * @return {RegExp}
 */
function regexKR( patterns, flags ) {
	var pattern, match, ucode,
		i = 0,
		len = patterns.length,
		result = '';

	if ( !Array.isArray( patterns ) ) {
		return regexKR( [ patterns ], flags );
	}

	// * Labeled statement: Can be used with break or continue statements
	patternsLoop: for ( ; i < len; i++ ) {
		if ( typeof patterns[ i ] != 'string' || !( pattern = patterns[ i ].trim() ) ) {
			continue patternsLoop;
		}

		if ( result ) result += '|';

		patternIdentifierLoop:
		while ( ( match = rpattern.exec( pattern ) ) ) {
			ucode = match[ 0 ].charCodeAt( 0 );

			// Match whitespace
			if ( match[ 1 ] ) {
				result += '[\\x20\\t\\r\\n\\f]+';
				continue patternIdentifierLoop;
			}

			// Match Hangul consonants (자음 일치)
			if ( match[ 2 ] ) {
				ucode = 0xAC00 + hangulC.indexOf( ucode ) * 588;
				result += '[\\u' + ucode.toString( 16 ) + '-\\u' + ( ucode + 587 ).toString( 16 ) + ']';

			// Match Hangul with vowels (모음까지 일치)
			} else if ( match[ 3 ] && ( ucode - 0xAC00 ) % 28 === 0 ) {
				result += '[\\u' + ucode.toString( 16 ) + '-\\u' + ( ucode + 27 ).toString( 16 ) + ']';

			// All other characters
			} else {
				result += escapeRegex( match[ 0 ] );
			}
		}
	}

	return new RegExp( result || '[^\\S\\s]', flags || undefined );
}


defineProps( {
	noop: noop,
	defineProps: defineProps,
	typeis: typeis,
	cleanPath: cleanPath,
	normalizeURL: normalizeURL,
	isNative: isNative,
	isPlainObject: isPlainObject,
} );

defineProps( true, {
	escapeRegex: escapeRegex,
	regexKR: regexKR
} );


} ) );