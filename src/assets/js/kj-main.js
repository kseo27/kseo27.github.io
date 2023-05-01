// * kj-main.js process

( function() { 'use strict';

// Check for legacy browsers
var modern;
try { modern = Function( 'let a = [ true ]; for ( let m of a ) return m;' )() }
catch(e) { modern = false }

$import('https://cdn.jsdelivr.net/npm/jquery-ui@1.13.2/dist/jquery-ui.min.js', { defer: true });

if ( modern ) {
	$import('https://cdn.jsdelivr.net/npm/tabulator-tables@5.4.4/dist/css/tabulator_bootstrap4.min.css');
	$import('https://cdn.jsdelivr.net/npm/billboard.js@3.8.0/dist/theme/datalab.min.css');
	$import('https://cdn.jsdelivr.net/npm/tabulator-tables@5.4.4/dist/js/tabulator.min.js', { defer: true });
	$import('https://cdn.jsdelivr.net/npm/billboard.js@3.8.0/dist/billboard.pkgd.min.js', { defer: true });
} else {
	$import('https://cdn.jsdelivr.net/npm/tabulator-tables@4.9.3/dist/css/bootstrap/tabulator_bootstrap4.min.css');
	$import('https://cdn.jsdelivr.net/npm/billboard.js@2.2.9/dist/theme/datalab.min.css');
	$import('https://cdn.jsdelivr.net/npm/tabulator-tables@4.9.3/dist/js/tabulator.min.js', { defer: true });
	$import('https://cdn.jsdelivr.net/npm/d3@5.16.0/dist/d3.min.js');
	$import('https://cdn.jsdelivr.net/npm/billboard.js@2.1.4/dist/billboard.min.js', { defer: true });
}

if ( !isNative( 'Promise' ) ) {
	$import('https://www.promisejs.org/polyfills/promise-6.1.0.min.js');
	// $import('/src/vendor/promise/promise-6.1.0.min.js');
}

$import('/src/assets/js/template-filter.js');
$import('/src/assets/js/k-router.js');


// ![test] html2canvas
$import('/temp/canvas-download.js');
$import('/src/assets/js/modules/k-clipboard.js');


// $import( '/src/assets/js/kj-store.js' );


$import( '/src/assets/css/asdf.csss' );
// $import( '/src/assets/css/asdf.js', '/src/assets/js/eval-test.js' );
$import( '/src/assets/js/kj-main.js' );

// $import( '/src/assets/js/kj-menu.js', { defer: true } );
$import( '/src/assets/js/kj-menu.js' );


$import.from( '/src/assets/css/staging.css' );
// console.log( $import.from( '/src/assets/js/k-menu.js' ) );



$( function() {

	var wsp = '[\\x20\\t\\r\\n\\f]';
	var rbrkt = '\\([,\\w\\s]*\\)';

	var rexWrapped = new RegExp( '^' + wsp + '*(?:!|\\$' + wsp + '*\\()' + wsp
			+ '*(?:function(?:' + wsp + '+\\w+|' + wsp + '*)' + rbrkt +'|' + rbrkt + wsp + '*=>)' + wsp
			+ '*\\{' + wsp + '*(?:(\'|")use strict\\1;?)?' + wsp + '*([\\S\\s]*?)' + wsp + '*\\}' + wsp
			+ '*\\)?(?:' + wsp + '*' + rbrkt + ')?' + wsp + '*\\)[\\x20\\t\\r\\n\\f;]*$' );

	var rwrapped = /^\s*(?:!|\$\s*\()\s*(?:function(?:\s+\w+|\s*)\([,\w\s]*\)|\([,\w\s]*\)\s*=>)\s*\{\s*('|")use strict\1[\s;]*([\S\s]*?)\s*\}\s*\)?(?:\s*\(\s*\))?\s*\)[\s;]*$/i;

	// console.log(rexWrapped);
	var routerjs = $import.get( '/src/assets/js/k-router.js' );
	var match = routerjs.match( rwrapped );
	// console.log(match);

	var rcr = /\r/g;
	var rtab = /\t/g;

	// Clear carriage return
	var res = ( match[ 2 ] || '' ).replace( rcr, '' );

		var cssPrefixes = [ "Webkit", "Moz", "ms" ],
			emptyStyle = document.createElement( "div" ).style,
			vendorProps = {};

		// Return a vendor-prefixed property or undefined
		function cssPropName( name ) {

			// Check for vendor prefixed names
			var capName = name[ 0 ].toUpperCase() + name.slice( 1 ),
				i = cssPrefixes.length;

			if ( name in emptyStyle ) return name;

			while ( i-- ) {
				name = cssPrefixes[ i ] + capName;
				if ( name in emptyStyle ) {
					return name;
				}
			}
		}

	var tabSize = cssPropName( 'tabSize' );

	if ( !tabSize ) {
		res = res.replace( rtab, '    ' );
	}

	$( 'pre.code' ).text( res );

} );

} )();