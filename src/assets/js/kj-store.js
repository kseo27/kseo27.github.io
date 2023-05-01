( function() {

var $store = { local: {}, session: {} },
	prefix = 'kj-',
	rprefix = new RegExp( '^' + prefix ),
	localStorage = window.localStorage,
	sessionStorage = window.sessionStorage;

var $store = function( keys, data ) {

	};
var _storage = {};

var rbrace = /^(?:\{[\S\s]*\}|\[[\S\s]*\])$/,
	rmultiDash = /[A-Z]/g;

function getData( data ) {
	if ( data === "true" ) return true;

	if ( data === "false" ) return false;

	if ( data === "null" ) return null;

	// Only convert to a number if it doesn't change the string
	if ( data === +data + "" ) return +data;

	if ( rbrace.test( data ) ) return JSON.parse( data );

	return data;
}
function setData( data ) {
	if ( typeof data === 'object' ) {
		return JSON.stringify( data )
	}
	return data;
}
function copyData( data ) {
	if ( !data || typeof data !== 'object' ) return data;
	return JSON.parse( JSON.stringify( data ) );
}
// function dataAttr( elem, key, data ) {
function access( storage, store, keys, data ) {
	var name, prev,
		length = arguments.length;

	try {
		keys = keys.split( /\s*\.\s*/ );
		name = prefix + keys.shift().replace( rmultiDash, "-$&" ).toLowerCase();
		prev = store[ name ];

		while ( ( name = keys.shift() ) ) {

		}

		// If nothing was found internally, try to fetch any
		// data from the HTML5 data-* attribute
		if ( data === undefined && elem.nodeType === 1 ) {
			name = "kj-" + key.replace( rmultiDash, "-$&" ).toLowerCase();
			data = elem.getAttribute( name );

			if ( typeof data === "string" ) {
				try {
					data = getData( data );
				} catch ( e ) {}

				// Make sure we set the data so it isn't changed later
				dataUser.set( elem, key, data );
			} else {
				data = undefined;
			}
		}
		return data;
	} catch ( err ) {
		exceptionHook( '$store exception: ' + keys, err );
	}
}


function storageSync( store, storage ) {
	var name, prop, i = 0, len = storage.length;
	for ( ; i < len; i++ ) {
		name = storage.key( i );
		if ( !rprefix.test( name ) ) continue;

		prop = getData( storage.getItem( name ) );
		console.log( i, name, prop );
		if ( prop === undefined ) continue;

		store[ name.replace( rprefix, '' ) ] = prop;
	}
}

storageSync( $store.local, localStorage );
console.log($store);

function _search( target, name ) {
	if ( typeof name !== 'string' ) return;

	var name = name.split( /\s*\.\s*/ ),
		len = name.length,
		prev =
		i = 1;
	// for ( ; i < len; i++ ) {
	// 	prev = target[ name[ i ] ];
	// 	if ( prev )
	// }
}



if ( localStorage ) {
	console.log(localStorage);

	localStorage.getItem;
	localStorage.setItem;
	localStorage.removeItem;
	localStorage.length;
	localStorage.key;
	localStorage.clear();

	localStorage.setItem( 'kj-test2', 'testValue' );
	localStorage.setItem( 'kj-testProp3', 123 );
	localStorage.setItem( 'kj-testProp4', true );
	localStorage.setItem( 'kj-test.Prop5', JSON.stringify( $store ) );
}

if ( sessionStorage ) {
	console.log(sessionStorage);

}


} )();