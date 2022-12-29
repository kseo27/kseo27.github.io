
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


var ajaxQueue = {};

// ???
function clearAjaxQueue() {
	$.each( ajaxQueue, function( idx, xhr ) {
		xhr.abort( 'ignore' );
	});
	ajaxQueue = {};
}


// 모든 요청에 대한 Prefilter 추가 ( `*` filter 에 prepend 하기 위해 `+` 심볼 사용 )
$.ajaxPrefilter( '+', function( s, originalSettings, jqXHR ) {
	var requestId = s.type.toUpperCase() + ':' + s.url;

	if ( ajaxQueue[ requestId ] ) {
		jqXHR.abort( 'duplicated' );
		return;
	}

	// TODO: prefilter 내부에서 처리해도 되는지 테스트 필요 (시나리오1)
	// console.log('[prefilter]:context:', jqXHR.context);
	ajaxQueue[ requestId ] = jqXHR;

	jqXHR.always( function() {
		// console.log('[prefilter]:after:', requestId);
		ajaxQueue[ requestId ] = undefined;
		delete ajaxQueue[ requestId ];
	} );
} );


// TODO: prefilter 내부에서 처리하면 안된다면... (시나리오2)
/* 
$( document ).ajaxSend(function( ev, xhr, settings ) {
	if ( ajaxQueue.indexOf( xhr ) === -1 ) {
		ajaxQueue.push( xhr );
	}

	xhr.always(function( dataOrXhr, statusText ) {
		var idx = ajaxQueue.indexOf( xhr );
		if ( statusText !== 'ignore' && idx !== -1 ) {
			ajaxQueue.splice( idx, 1 );
		}
	})
});
*/



// TODO: 공통 예외 처리 테스트 중
// Log Colors: Red #EE0000, Green #00AA00, blue #0000AA, Orange #E98000, Brown #AA5500

$.ajaxSetup( {
	statusCode: {  // this === settings
		0: function( jqXHR, state, statusText ) {
			console.log( '%c[AJAX statusCode]:[0]', 'color:#E98000;', '['+state+']', this.type.toUpperCase() +':'+ this.url );
		},
		200: function( response, state, jqXHR ) {
			console.log( '%c[AJAX statusCode]:[200]', 'color:#00AA00;', '['+state+']', jqXHR.statusText, this.type +':'+ this.url );
		},
		404: function( jqXHR, state, statusText ) {
			console.log( '%c[AJAX statusCode]:[404]', 'color:#EE0000;', '['+state+']', statusText, this.type +':'+ this.url );
		},
	}
});

// TODO: 공통 예외 처리 테스트 중
/* 
$.ajaxSetup( {
	statusCode: {
		0: function( xhr, statusText, c ) {
			if ( statusText === 'ignore' ) return;
			console.log( 0, 'not cunnected' );
		},
		// 200: function( data, statusText, xhr ) {},
		400: function( xhr, statusText ) {
			// Invalid request
			// Request content was invalid
			// 요청 내용이 유효하지 않습니다
		},
		401: function( xhr, statusText ) {
			// Unauthorized access
			// You don't have access
			// 해당 서비스에 접근 권한이 없습니다
		},
		403: function( xhr, statusText ) {
			// Forbidden
			// Your access is forbidden
			// 해당 서비스에 접근이 거절되었습니다
		},
		404: function( xhr, statusText ) {
			// Not Found
			// The resource could not be found
			// 해당 리소스를 찾을 수 없습니다
		},
		500: function( xhr, statusText ) {
			// Internal Server Error
			// The server encountered an internal error.
			// Please contact the administrator if this problem persists.
			// 서버에 내부 오류가 발생했습니다
			// 문제가 지속된다면 관리자에게 문의 해주십시오
		},
		503: function( xhr, statusText ) {
			// Service Unavailable
			// The server is temporarily unable to service your request.
			// Please try again later.
			// 서버가 일시적으로 해당 서비스 요청을 처리할 수 없습니다.
			// 잠시 후 다시 시도 해주십시오.
		},

		// Extended error
		900: function( xhr, statusText ) {
			// Expired Session
			// Your session has expired. Please sign in again.
			// 세션이 만료되었습니다. 다시 로그인 해주십시오.
			clearAjaxQueue();
		},
	}
});
*/


// $( document ).ajaxStart(function( ev ) {});
// $( document ).ajaxStop(function( ev ) {});
// $( document ).ajaxSuccess(function( ev, xhr, settings ) {});
// $( document ).ajaxError(function( ev, xhr, settings ) {});

window.genLoader = function() {
	var loading = document.createElement( 'div' ),
		loader = loading.appendChild( document.createElement( 'div' ) );
	loading.className = 'k-loading';
	loader.className = 'k-preloader';
	return loading;
}

// .k-loading
$( window ).one( 'load', function( ev ) {
	if ( !$.active ) {
		return $( '.k-loading' ).remove();
	}
	$( document ).one( 'ajaxStop.load', function() {
		$( '.k-loading' ).remove();
	});
});



} );