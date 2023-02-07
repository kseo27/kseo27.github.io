$(function() { 'use strict';


// @:polyfill #getOwnPropertyDescriptors IE9 ~ Edge15
if ( !Object.getOwnPropertyDescriptors ) {
	Object.defineProperty( Object, 'getOwnPropertyDescriptors', {
		configurable: true, enumerable: false, writable: true,
		value: function( obj ) {
			var descriptors = {};
			Object.getOwnPropertyNames( obj ).forEach( function( prop ) {
				descriptors[ prop ] = Object.getOwnPropertyDescriptor( obj, prop );
			} );
			return descriptors;
		}
	} );
}


$( window ).on( 'load.setDescriptors', function() {
	$.origGlobalPropDescriptors = Object.getOwnPropertyDescriptors( window );

	console.log('::: Loaded Descriptors');

	$( '<button type="button" class="testbtn">Descriptors</button>' )
		.appendTo( 'body' )
		.on( 'click', checkDescriptors );

	$( window ).off( 'load.setDescriptors' );
} );

function checkDescriptors() {
	$.each( Object.getOwnPropertyDescriptors( window ), function( prop, descriptor ) {
		var accessor = descriptor.get ? 'get' : 'value';
		if ( $.origGlobalPropDescriptors.hasOwnProperty( prop ) ) {
			if ( !$.origGlobalPropDescriptors[ prop ].writable ) return;
			if ( descriptor[ accessor ] !== $.origGlobalPropDescriptors[ prop ][ accessor ] ) {
				// Object.defineProperty( window, prop, $.origGlobalPropDescriptors[ prop ] );
				console.log( 'Diff ' + prop, $.origGlobalPropDescriptors[ prop ], descriptor);
			}
		} else {
			// delete window[ prop ];
			console.log( 'New ' + prop, descriptor);
		}
	});
}

// TODO: ajaxPrefilter를 사용하여 요청 중 route가 바뀌면 모두 abort하도록 해야함
// $.ajaxPrefilter( '+', function( s, originalSettings, jqXHR ) {
// 	var requestId = s.type.toUpperCase() + ':' + s.url;

// 	if ( ajaxQueue[ requestId ] ) {
// 		jqXHR.abort( 'duplicated' );
// 		return;
// 	}

// 	// console.log('[prefilter]:context:', jqXHR.context);
// 	ajaxQueue[ requestId ] = jqXHR;

// 	jqXHR.always( function() {
// 		// console.log('[prefilter]:after:', requestId);
// 		ajaxQueue[ requestId ] = undefined;
// 		delete ajaxQueue[ requestId ];
// 	} );
// } );


var publicComponents = {
	'Sample': {
		template: '<div>Sample Component {{ myprop }}</div>',
		setup: function( thisObject ) {
			return { myprop: 'mypropValue' }
		},
		mounted: function( $rootOrParentElement ) {
			$rootOrParentElement.addClass( 'isMounted' );
		},
		unmount: function( $rootOrParentElement ) {
			$rootOrParentElement.removeClass( 'isMounted' );
		}
	},
	'MyComponent': {
		template: '<div>Sample My Component {{ myprop }}</div>',
		setup: function( thisObject ) {
			return { myprop: 'mypropValue' }
		},
		mounted: function( $rootOrParentElement ) {
			$rootOrParentElement.addClass( 'isMounted' );
		},
		unmount: function( $rootOrParentElement ) {
			$rootOrParentElement.removeClass( 'isMounted' );
		}
	}
};

$.hasComponent = function( name ) {
	return publicComponents.hasOwnProperty( name );
}

var rcompo = /\x3C([A-Z][A-Za-z]+|[a-z]+(?:(-)[a-z]+)*?)\b[^>]*?>/g;

var rcompo = /\x3C([A-Z][A-Za-z]+|[a-z]+(?:(-)[a-z]+)*)\b[^>]*?>/g;

templateFilter( document.body.innerHTML, function( text ) {
	var match, name, compo, compoMap = {};

	while ( ( match = rcompo.exec( text ) ) ) {
		name = match[ 1 ];
		if ( compoMap[ name ] ) continue;
		if ( $.hasComponent( compo = name )
			|| match[ 2 ] && $.hasComponent( compo = name.toPascalCase() ) ) {
			compoMap[ name ] = compo;
		}
	}

	// $.each( compoMap, function( name, compo ) {
	// 	// $( name )
	// 	console.log(  name, compo  );
	// 	setupComponent( name, compo );
	// } );

	compoMap = null;

	return text;
} );


// @:TODO $.fn.component 와 같은 기능, $.fn.component 로 대체
function setupComponent( name, compo ) {
	console.log( 'setupComponent' );
	var config = $.extend( {}, publicComponents[ compo ] ),
		props = typeof config.setup === 'function' && config.setup( config ) || {},
		template = config.template.replace( /\{\{\s*(\w+)\s*\}\}/g, function( m, prop ) {
			return ( prop = props[ prop ] ) == null ? '' : prop;
		} ),
		$component = $( template ),
		$root = $component.length === 1 ? $component : $( $component[ 0 ].parentNode );

	$( name ).replaceWith( $component );
	if ( typeof config.mounted === 'function' ) config.mounted( $root, props );

	$component.on( 'remove', function() {
		if ( typeof config.unmount === 'function' ) config.unmount( $root );
		config = props = $component = $root = undefined;
	} );
}

$.components = function( name, component ) {
	if ( typeof name === 'object' ) {
		component = name;
		for ( name in component ) {
			if ( typeof component[ name ] !== 'object' ) continue;

			// TODO: public components setup method
			publicComponents[ name ] = component[ name ];
		}
		return;
	}
	if ( typeof name !== 'string' || typeof component !== 'object' ) return;

	// TODO: public components setup method
	publicComponents[ name ] = component;
}


function Component( config ) {
	var url = config.url || '';
	Object.defineProperty
}

/**
 * Load a url into a page
 */
 jQuery.fn.component = function( url, config ) {
	if ( !arguments.length ) return this.data( 'component' );
	if ( publicComponents.hasOwnProperty( url ) ) {

	}

	var selector, type, response,
		self = this,
		off = url.indexOf( " " );

	if ( typeof url === 'object' ) {
		config = url;
		url = config.url;
		delete config.url;
	}

	config = $.extend( {}, config );
	Object.defineProperty( config, 'url', {
		configurable: false,
		enumerable: true,

	} );

	// If it's a function
	if ( isFunction( params ) ) {

		// We assume that it's the callback
		callback = params;
		params = undefined;

	// Otherwise, build a param string
	} else if ( params && typeof params === "object" ) {
		type = "POST";
	}

 }




var pathObj,
	location = window.location,
	history = window.history,
	origin = location.protocol + "//" + location.host,
	rorigin = new RegExp( '^' + $.escapeRegex( origin ) ),
	rpath = /^((?:\/[^#/?]+)*)(\/#((?:\/[^#/?]+)+|\/(?!\/)))?\/?(#[-\w]+)?(\?([^#]+))?(#[-\w]+)?/;

function parsePath( href ) {
	var match = href.replace( rorigin, '' ).match( rpath ),
		query = match[ 6 ] && Qs.parse( match[ 6 ], { ignoreQueryPrefix: true } );
	if ( query && query.redirect ) return parsePath( '/#' + query.redirect );
	return {
		path: match[ 1 ] || '/',
		hashPath: match[ 3 ],
		hash: match[ 4 ] || match[ 7 ],
		query: query,
		fullPath: ( match[ 1 ] + ( match[ 2 ] || '' ) || '/' )
			+ ( match[ 6 ] ? match[ 5 ] : '' )
	}
}

// window.parsePath = parsePath;

pathObj = parsePath( location.href );
console.log( 'Path onload:', pathObj );

$( window ).on( 'popstate', function( event, data ) {
	// event.preventDefault();
	console.log('%c[Global popstate]', 'color:#0000AA;', event, data);
	console.log(window.location.href);
	console.log(window.location.hash);

	// if (!this.isEditing) return console.log('isEditing');
	// event.originalEvent.preventDefault()
	// event.originalEvent.returnValue = ""
	// return '/';
	

	// originAnchor.protocol + "//" + originAnchor.host
	// return false;
});


$( document ).on( 'click', 'a[href]', function( event ) {
	var anchorOrigin = this.protocol + "//" + this.host;
	if ( origin !== anchorOrigin ) return;

	event.preventDefault();

	var onlyHash = /^#[-\w]+/.test( this.hash ),
		parsed = onlyHash || parsePath( this.href ),
		$target, origTabIndex;

	if ( onlyHash || pathObj.fullPath === parsed.fullPath ) {
		try { $target = $( onlyHash ? this.hash : parsed.hash ) } catch( e ) {};
		if ( $target && $target[ 0 ] ) {
			origTabIndex = $target[ 0 ].getAttribute( 'tabindex' );
			$target.attr( 'tabindex', 0 ).trigger( 'focus' ).attr( 'tabindex', origTabIndex );
		}
		onlyHash ? ( pathObj.hash = this.hash ) : ( pathObj = parsed );
		parsed = null;
		return;
	}

	if ( !history.pushState ) location.href = parsed.fullPath;
	else history.pushState( null, '', parsed.fullPath);

	// $( window ).trigger( 'popstate', parsed );
	$( window ).triggerHandler( 'popstate', parsed );

	// after trigger callback?
	console.log('triggerHandler: popstate');

	// Save new parsed path object
	pathObj = parsed;
	parsed = null;
} );




// @:ref get component method
$.noop( '/indicator.html', function( res, state, jqXHR ) {
	// console.log('load', res);
	// $('.container').html($.parseHTML(res, true));

	// var result = res.match( /<(head)\b[^>]*>(?:(['"`])(\\\2|[\S\s])*?\2|[\S\s])*?<\/\1>/ );
	// var result = res.match( /<(body)\b[^>]*>((?:(['"`])(\\\3|[\S\s])*?\3|[\S\s])*?)<\/\1>/ );
	// result = ( result && result[ 2 ] ) || res;
	// result = result.replace( /<(template)\b[^>]*>((?:(['"`])(\\\3|[\S\s])*?\3|[\S\s])*?)<\/\1>/g, '$2' );
	// console.log('load', result);

	var parsed = $.map( $.parseHTML( result, true ), function( node, i ) {

		// Remove empty text nodes
		if ( node.nodeType === 3 && !isNaN( node.nodeValue ) ) return;

		// if ( /^(?:title|meta|link)$/i.test( node.nodeName ) ) return;

		if ( /script/i.test( node.nodeName ) ) {
			// console.log( node.text );
		}

		return node;
	} );

	// console.log(parsed);

	$('.container').append(parsed);
} );



$(function() {

	// for router component
	$( window ).on( 'popstate.spec1', function( event, data ) {
		console.log('%c[popstate.spec1]', 'color:#0000AA;', event, data);
		$( window ).off( 'popstate.spec1' );
	});


	$( window ).triggerHandler( 'popstate', pathObj );
	// matched = null;
});

// $( document ).ajaxSuccess(function( ev, xhr, settings ) {});
// $( document ).ajaxError(function( ev, xhr, settings ) {});


Element.prototype.addEventProxy = function( type, listener, useCapture ) {
	this.addEventListener( type, listener, useCapture );
	$( this ).on( 'remove', function( event ) {
		event.currentTarget.removeEventListener( type, listener, useCapture );
	} );
}




var lastId = 0;

function uniqueId( prefix ) {
	return ( prefix || 'k-' ) + ( ++lastId ).toString( 36 );
}





/**
 * Load a url into a page
 */
 jQuery.fn.router = function( url, params, callback ) {
	var selector, type, response,
		self = this,
		off = url.indexOf( " " );

	if ( off > -1 ) {
		selector = stripAndCollapse( url.slice( off ) );
		url = url.slice( 0, off );
	}

	// If it's a function
	if ( isFunction( params ) ) {

		// We assume that it's the callback
		callback = params;
		params = undefined;

	// Otherwise, build a param string
	} else if ( params && typeof params === "object" ) {
		type = "POST";
	}


	var dataId = uniqueId(),
		popstateEvent = 'popstate.' + dataId;

	this[ 0 ].dataset.kId = dataId;
	$( this[ 0 ] ).on( 'remove', function() {
		$( window ).off( popstateEvent );
	} );

	$( window ).on( popstateEvent, function( event, data ) {
		// event.preventDefault();
		console.log('%c[' + dataId + 'popstate]', 'color:#0000AA;', event, data);


		// if (!this.isEditing) return console.log('isEditing');
		// event.originalEvent.preventDefault()
		// event.originalEvent.returnValue = ""
		// return '/';
		

		// originAnchor.protocol + "//" + originAnchor.host
		// return false;
	});

	// If we have elements to modify, make the request
	if ( self.length > 0 ) {
		jQuery.ajax( {
			url: url,

			// If "type" variable is undefined, then "GET" method will be used.
			// Make value of this field explicit since
			// user can override it through ajaxSetup method
			type: type || "GET",
			dataType: "html",
			data: params
		} ).done( function( responseText ) {

			// Save response for use in complete callback
			response = arguments;

			self.html( selector ?

				// If a selector was specified, locate the right elements in a dummy div
				// Exclude scripts to avoid IE 'Permission Denied' errors
				jQuery( "<div>" ).append( jQuery.parseHTML( responseText ) ).find( selector ) :

				// Otherwise use the full result
				responseText );

		// If the request succeeds, this function gets "data", "status", "jqXHR"
		// but they are ignored because response was set above.
		// If it fails, this function gets "jqXHR", "status", "error"
		} ).always( callback && function( jqXHR, status ) {
			self.each( function() {
				callback.apply( this, response || [ jqXHR.responseText, status, jqXHR ] );
			} );
		} );
	}

	return this;
};


} );