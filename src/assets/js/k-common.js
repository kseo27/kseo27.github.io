/*!
 * Kseo27 Common JavaScript
 * @author: kseo27 - 2022-12-27
 */
( function( factory ) {
	// Browser globals
	if ( typeof window !== 'undefined' ) factory( window );

}( function( global ) { 'use strict';

/* Golbal Properties
============================================================*/

// helpers for global properties
var toString = Object.prototype.toString,
	// for RexKo
	hanStd = 0xAC00, hanEnd = 0xD7A3,
	hanC = [0x3131, 0x3132, 0x3134, 0x3137, 0x3138, 0x3139, 0x3141, 0x3142, 0x3143, 0x3145, 0x3146, 0x3147, 0x3148, 0x3149, 0x314A, 0x314B, 0x314C, 0x314D, 0x314E];

Object.defineProperties( global, {
	getKeys: {
		value: Object.keys
	},
	getValues: {
		value: Object.values || function values( obj ) {
			return getKeys( obj ).map(function( key ) {
				return obj[ key ];
			})
		}
	},
	isArray: {
		value: Array.isArray
	},
	isPlainObject: {
		value: function isPlainObject( obj ) {
			return toString.call( obj ) === '[object Object]';
		}
	},
	isNumeric: {
		value: function isNumeric( num ) {
			// return isFinite( num ) && !isNaN( parseInt( num ) ); // old: allow array number
			return !/object|symbol/.test( typeof num ) && isFinite( parseInt(num) && +num ); // fix: not allow array number
		}
	},

	/**
	 * Returns wheather the object contains valid content.
	 * @param  {String|Array|Object} obj
	 * @return {Boolean}
	 */
	isEmpty: {
		value: function isEmpty( obj ) {
			if ( obj != null && typeof obj === 'object' && !isArray( obj ) ) {
				if ( isPlainObject( obj ) ) {
					for ( var key in obj ) break;
					return !key;
				} else return 'N/A';
			}
			return !isNumeric( obj ) && ( !obj || +obj === 0 );
		}
	},

	/**
	 * Returns a valid number with commas inserted.
	 * @param  {String|Number} num
	 * @return {String}
	 */
	commify: {
		value: function commify( num ) {
			if ( !isNumeric( num ) ) return num;
			var parts = String( num ).split( '.' );
			parts[ 0 ] = parts[ 0 ].replace( /\B(?=(\d{3})+(?!\d))/g, ',' );
			return parts.join( '.' );
		}
	},

	/**
	 * Cast as the type
	 */
	castNum: {
		value: function castNum( num ) {
			num = typeof num === 'string' ? num.replace( /\,/g, '' ) : num;
			return isNumeric( num ) ? +num : NaN;
		}
	},

	/**
	 * Returns regular expression for Korean
	 * @param  {String} str
	 * @param  {String} mod
	 * @return {RegExp}
	 */
	RexKo: {
		value: function RegExpKOREAN( str, mod ) {
			if ( isEmpty( str ) ) return;
			var ucode, result = '';
			for ( var i = 0; i < str.length; i++ ) {
				ucode = str.charCodeAt( i );
				if ( ucode >= 0x3131 && ucode <= 0x314E ) {
					ucode = 0xAC00 + hanC.indexOf( ucode ) * 588;
					result += '[\\u' + ( ucode ).toString( 16 ) + '-\\u' + ( ucode + 587 ).toString( 16 ) + ']';
				} else if ( ucode >= 0xAC00 && ucode <= 0xD7A3 && ( ucode - 0xAC00 ) % 28 === 0 ) {
					result += '[\\u' + ( ucode ).toString( 16 ) + '-\\u' + ( ucode + 27 ).toString( 16 ) + ']';
				} else {
					result += str.charAt( i ).replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
				}
			}
			return new RegExp( result, mod );
		}
	}
});



/* String Prototype
============================================================*/

// helpers for string prototype
var rcase = /(?:^|[-_\x20\t]+?)([a-z]|$)/gi;
var rkebab = /(?:^|[-_\x20\t]+?|\B(?=[A-Z]))([A-Za-z]|$)/g;
function fpascalCase( _all, match ) {
	return match.toUpperCase();
}
function fcamelCase( _all, match, index ) {
	return index ? match.toUpperCase() : match.toLowerCase();
}
function fkebabCase( _all, match, index ) {
	return match ? ( index ? '-' : '' ) + match.toLowerCase() : '';
}

// @:Ref - SNAKE_CASE 까지 변환해야할 경우
/* 
var rcase = /(?:^|[-_\x20\t]+?)([A-Za-z]|$)([A-Z\d]+(?![a-z])|)/g;
function fpascalCase( _all, match, tail ) {
	return match.toUpperCase() + tail.toLowerCase();
}
function fcamelCase( _all, match, tail, index ) {
	return ( index ? match.toUpperCase() : match.toLowerCase() ) + tail.toLowerCase();
}
 */

Object.defineProperties( String.prototype, {
	// String to camelCase
	toCamelCase: {
		value: function toCamelCase() {
			return this.replace( rcase, fcamelCase );
		}
	},
	// String to PascalCase
	toPascalCase: {
		value: function toPascalCase() {
			return this.replace( rcase, fpascalCase );
		}
	},
	// String to kebab-case
	toKebabCase: {
		value: function toKebabCase() {
			return this.replace( rkebab, fkebabCase );
		}
	},
});



/* Array Prototype
============================================================*/
// helpers for array prototype
var // for sortBy
	sortStd = function( a, b, o ) {
		a += '';
		b += '';
		return ( a > b ? 1 : a < b ? -1 : 0 ) * o;
	},
	sortIgn = function( a, b, o ) {
		a = ( a + '' ).toLowerCase();
		b = ( b + '' ).toLowerCase();
		return ( a > b ? 1 : a < b ? -1 : 0 ) * o;
	},
	sortNum = function( a, b, o ) {
		if ( isNaN( a = castNum( a ) ) ) return 1;
		if ( isNaN( b = castNum( b ) ) ) return -1;
		return ( a - b ) * o;
	},
	sortDate = function( a, b, o ) {
		return ( new Date( a ) - new Date( b ) ) * o;
	};

Object.defineProperties( Array.prototype, {
	sortBy: {
		value: function sortBy( opt, caseSensitive ) {
			var type = isPlainObject( opt ) || typeof opt,
				compare = sortStd,
				key, sortOrder;

			switch ( type ) {
			case true:
				key = typeof opt.key === 'string' && opt.key;
				type = opt.type;
				sortOrder = opt.order;
				break;
			case 'string':
				key = opt.replace( /^([\-\+]?\d*)(\w+)?(?:\:+(\w+))?/i, function( _all, m1, m2, m3 ) {
					if ( m1 === '-' || m1 < 0 ) sortOrder = -1;
					type = m3 && m3.toLowerCase();
					return m2 || '';
				});
				break;
			case 'number':
				if ( isNumeric( opt ) ) {
					sortOrder = opt;
					break;
				}
			case 'boolean':
				caseSensitive = opt;
				break;
			default:
				if ( opt != null ) {
					throw new TypeError('Invalid sort options in Array.sortBy method');
				}
			}

			sortOrder = sortOrder < 0 || /\bdesc\b/i.test( sortOrder ) ? -1 : 1;
			console.log('key:', key, '  type:', type, '  order:', sortOrder);
			if ( type === 'number' || typeof type === 'number' ) compare = sortNum;
			else if ( type === 'date' || type === Date ) compare = sortDate;
			else if ( caseSensitive !== true ) compare = sortIgn;

			return key
				? this.sort(function( a, b ) {
					return compare( a[key], b[key], sortOrder );
				})
				: this.sort(function( a, b ) {
					return compare( a, b, sortOrder );
				});
		}
	},
});


/* Global Project Object (sn)
============================================================*/
var $project = global.sn = function() {};
// Date control helpers
// Standard Time Stamp
// 1d = 86400000, 1H = 3600000, 1M = 60000, TZOffset = new Date().getTimezoneOffset() * 60000
var STD_1d = 86400000, TZOffset = new Date().getTimezoneOffset() * 60000,
	rexDt = /(([+-])?\d+)([HMSdmsy])\b/g,
	getDt = {y:'getFullYear', m:'getMonth', d:'getDate', H:'getHours', M:'getMinutes', S:'getSeconds', s:'getMilliseconds'},
	setDt = {y:'setFullYear', m:'setMonth', d:'setDate', H:'setHours', M:'setMinutes', S:'setSeconds', s:'setMilliseconds'};
function endTimeOfDay( date ) {
	var remainingTime = STD_1d - ( ( date.getTime() - TZOffset ) % STD_1d ) -1;
	return date.getTime() + remainingTime;
}
function controlDate( strDt ) {
	var date = new Date();
	if ( strDt == null ) return date;
	var stdMonth, stdTime, match, dtVal, oper, unit;
	while ( match = rexDt.exec( strDt ) ) {
		stdMonth = stdTime = null;
		dtVal = match[ 1 ];
		oper = match[ 2 ];
		unit = match[ 3 ];
		if ( oper ) dtVal = date[ getDt[ unit ] ]() + ( +dtVal );
		else if ( unit === 'm' ) dtVal = ( dtVal > 12 ? 12 : dtVal ) -1;
		else if ( unit === 'd' && dtVal > 31 ) dtVal = 31;

		if ( unit === 'm' ) stdMonth = ( dtVal < 0 ? 12 : 0 ) + ( dtVal % 12 );
		else if ( unit === 'y' || ( !oper && unit === 'd' ) ) stdMonth = date.getMonth();
		else if ( !oper ) stdTime = endTimeOfDay( date );

		date[ setDt[ unit ] ]( dtVal );

		if ( stdMonth !== null && stdMonth < date.getMonth() ) {
			date.setDate( 0 );
		} else if ( stdTime !== null && stdTime < date.getTime() ) {
			date.setTime( stdTime );
		}
	}
	return date;
}

// URL search params helpers
// for single value
var rexUrl = /[?&]+([^=&]+)=([^&]*)/gi;
function getURLParams() {
	var params ={};
	global.location.search.replace( rexUrl, function( _all, key, val ) {
		params[ decodeURIComponent( key ) ] = decodeURIComponent( val );
	});
	return params;
}

Object.defineProperties( $project, {
	UA: { value: global.navigator.userAgent.toLowerCase() },
	isIE: { get: function() {return this.UA && /mise|trident/.test(this.UA) && !this.isEdge} },
	isEdge: { get: function() {return this.UA && this.UA.indexOf('edge/') !== -1} },
	isChrome: { get: function() {return this.UA && /chrome\/\d+/.test(this.UA) && !this.isEdge} },
	date: { value: controlDate },
	param: { get: getURLParams },
	getCookie: {
		value: function( name ) {
			var aCookie = document.cookie.split( /\s*;\s*/ );
			for ( var i = 0; i < aCookie.length; i++ ) {
				var aCrumb = aCookie[ i ].split( /\s*=\s*/ );
				if ( name == decodeURIComponent( aCrumb[ 0 ] ) ) {
					return decodeURIComponent( aCrumb[ 1 ] );
				}
			}
			return '';
		}
	},
	setCookie: {
		value: function( name, val, exp ) {
			var d = new Date(), expires;
			d.setTime( d.getTime() + ( exp * 86400000 ) );
			expires = 'expires=' + d.toUTCString();
			document.cookie = encodeURIComponent( name ) + '=' + encodeURIComponent( val ) + ';' + expires + ';path=/';
		}
	},
	winpop: {
		value: function( url, options ) {
			var prop,
				name = options && options.name || 'newWin',
				boolToNum = function( b ){
					return typeof b === 'boolean' ? +b : b
				},
				controls = 'width=600,height=450,location=0,menubar=0,toolbar=0,status=0,scrollbars=1,resizable=1,fullscreen=0';
				//TODO: left? Top? 위치부정확

			//TODO: 동일한 팝업창이 존재하는지 closed check

			if ( isPlainObject( options ) ) {
				if ( options.fullscreen === 'yes' || options.fullscreen == 1 ) {
					options.width = screen.availWidth;
					options.height = screen.availHeight;
				}
				delete options.name;
				for ( prop in options ) {
					prop = prop.toLowerCase();
					controls = controls.replace( new RegExp( '\\b' + prop + '=\\w+|$' ), function( match ) {
						return ( match ? '' : "," ) + prop + '=' + boolToNum( options[ prop ] );
					});
				}
			}
			return window.open( url, name, controls, true );
			// async open
			// return setTimeout( function(){ window.open( url, name, controls, true) }, 0 );
		}
	},
});


} ) );