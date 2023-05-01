(function() { 'use strict';

// String regex
var rstring  = /('|")(\\{2}|\\\1|.)*?(?:\1|(?=(\n|\r\n?|\f|$)))/g;
// var rtmpl = /`(?:\\{2}|\\`|\\$|\$(?!\{)|[^`$])*?(?:`|(\$\{))/g;
// var rexpr = /^(?:(`|)(?:\\{2}|\\`|\\$|\$(?!\{)|[^`$])*?\1)*?(?:(?:`|\})(?:\\{2}|\\`|\\$|\$(?!\{)|[^`$])*?(\$\{)|\}(?:\\{2}|\\`|\\$|\$(?!\{)|[^`$])*?`)/;

// Template literals regex
var nonExpr = '(?:\\\\{2}|\\\\`|\\\\$|\\$(?!\\{)|[^`$])';
var rtmplLi = new RegExp( '`' + nonExpr + '*?(?:`|(\\$\\{))', 'g' );
var rtmplExpr = new RegExp( '^(?:(`|)' + nonExpr + '*?\\1)*?(?:(?:`|\\})' + nonExpr + '*?(\\$\\{)|\\}' + nonExpr + '*?`)' );

var rbody = /\x3Cbody\b[^>]*?>(?:\s*?(?:\n|\r\n?))*([\S\s]*?)(?:\s*?(?:\n|\r\n?))*\x3C\/body>/i;
var rtemplate = /\x3Ctemplate\b[^>]*?>(?:\s*?(?:\n|\r\n?))*([\S\s]*?)(?:\s*?(?:\n|\r\n?))*\x3C\/template>/gi;


function pageFilter( html ) {
	return templateFilter( html, function( text ) {
		var match;
		if ( ( match = text.match( rbody ) ) ) {
			text = match[ 1 ];
		} else {
			text = text.replace( rtemplate, '$1' );
		}
		match = null;
		return text;
	} );
}

function templateFilter( text, interceptor ) {

	if ( !( text = $.trim( text ) ) ) return;

	// Remove Live server script
	var rliveServerScript = /\x3C!--+\s*Code injected by live-server\s*-+->\s*\x3Cscript>[\S\s]*?\x3C\/script>\s*/gi;
	text = text.replace( rliveServerScript, '' );

	// Set literals flag
	var flagMap = {},
		f = '$l',
		i = 0;

	while ( ~text.indexOf( f ) ) {
		f = f + ( i++ );
	}

	function saveMatches( li, flag ) {
		flagMap[ flag = f + ( i++ ) ] = li;
		return '"' + flag + '"';
	}
	function grepNestedExpr( tmpl, depth ) {
		var match, result = '';
		if ( depth === undefined ) depth = 1;

		while ( depth && ( match = tmpl.match( rtmplExpr ) ) ) {
console.log(depth, match);
// console.log(match[1], match[2]);
			tmpl = tmpl.substring( match[ 0 ].length );

			if ( match[ 2 ] ) {
				result += match[ 0 ] + ( match = grepNestedExpr( tmpl, depth + 1 ) );
				tmpl = tmpl.substring( match.length );

			} else if ( depth > 0 ) {
				result += match[ 0 ];
				depth--;
			}
		}
		return result;
	}

	// Extract string
	text = text.replace( rstring, function( match ) {
		return saveMatches( match );
	} );

	// Extract template literals
	var match, index, flag, matched = '';

	while ( ( match = rtmplLi.exec( text ) ) ) {
		index = match.index;
		matched += match[ 0 ];

		if ( match[ 1 ] ) {
			console.log( 0, match[0], match[1]);
			matched += grepNestedExpr( text.substring( rtmplLi.lastIndex ) );
		}

		text = text.substring( 0, index ) + ( flag = saveMatches( matched ) )
			+ text.substring( index + matched.length );
		rtmplLi.lastIndex = index + flag.length;
		matched = '';
	}

	if ( typeof interceptor === 'function' ) {
		text = interceptor( text );
	}

	// Restore text with flags
	var rflag = new RegExp( '"(' + $.escapeRegex( f ) + '\\d+' + ')"', 'g' );
	text = text.replace( rflag, function( m, flag ) {
		return flagMap[ flag ];
	} )
	.replace( rflag, function( m, flag ) {
		return flagMap[ flag ];
	} );

	flagMap = null;

	return text;
};


Object.defineProperties( window, {
	pageFilter: {
		value: pageFilter
	},
	templateFilter: {
		value: templateFilter
	}
} );

// Object.defineProperty( window, 'pageFilter', {
// 	value: pageFilter,
// 	configurable: false,
// 	enumerable: false,
// 	writable: false
// } );

// Object.defineProperty( window, 'templateFilter', {
// 	value: templateFilter,
// 	configurable: false,
// 	enumerable: false,
// 	writable: false
// } );


})();