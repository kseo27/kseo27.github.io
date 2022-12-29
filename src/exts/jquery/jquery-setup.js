
( function( factory ) { 'use strict';
	if ( typeof define === 'function' && define.amd ) {

		// AMD. Register as an anonymous module.
		define( [ 'jquery' ], factory );
	} else if ( typeof module !== 'undefined' && module.exports ) {

		// Node/CommonJS style for Browserify
		module.exports = factory( require( 'jquery' ) );
	} else {

		// Browser globals
		factory( jQuery );
	}
} )( function( $ ) { 'use strict';

// Utils
if ( String.prototype.trim ) $.trim = function( text ) {
	return text == null ? "" : ( text + "" ).trim();
};

$.escapeRegex = function( value ) {
	return value.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
}


} );