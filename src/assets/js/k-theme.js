( function() { 'use strict';
/*

@[ref] matchMedia / prefers-color-scheme

* [css]
  @media (prefers-color-scheme: dark) { ... }

* [js]
  if ( !window.matchMedia ) return;
  var mql = window.matchMedia( '(prefers-color-scheme: dark)' );
  ? return MediaQueryList {media: '(prefers-color-scheme: dark)', matches: true, onchange: null}

  if ( mql.addEventListener ) {
    mql.addEventListener( 'change', handler ) // if possible, you should use this
  } else {
    mql.addListener( handler ) // for backward compatibility
  }

  function handler( e ) {
	if ( e.matches ) {
	  //...
	}
  }

 */

var theme,
	currentTheme,
	setTheme,
	rthemes = [],

	// for matchMedia process
	mqlDark,
	watchMediaDark,

	rnotws = /[^\x20\t\r\n\f]+/g, // not whitespace
	rosdef = /os[-\x20]?def(ault)?/i, // for testing os-default
	supportStore = typeof localStorage !== 'undefined',
	themes = {
		'os-def': 'OS Default',
		'light': 'Light',
		'dark': 'Dark'
	};

function setDocTheme( theme ) {
	var classes = document.documentElement.className;
	if ( !theme || ~( classes.match( rnotws ) || [] ).indexOf( theme ) ) return;

	classes = classes.replace( rthemes, '' ).match( rnotws ) || [];
	classes.push( theme );
	document.documentElement.className = classes.join( ' ' );
}

function themeData( value ) {
	if ( !supportStore ) return;

	var current = localStorage.getItem( 'theme' );

	if ( value === undefined ) {
		return current;

	} else if ( current !== value ) {
		localStorage.setItem( 'theme', value );
		return currentTheme = value;
	}
}


// * If the OS default theme is supported
if ( window.matchMedia &&
	( ( mqlDark = window.matchMedia( '(prefers-color-scheme: dark)' ) ).matches ||
	window.matchMedia( '(prefers-color-scheme: light)' ).matches )
) {
	setTheme = function( theme ) {
		if ( rosdef.test( theme ) ) {
			if ( !watchMediaDark ) {
				watchMediaDark = function( e ) {
					setDocTheme( e.matches ? 'dark' : 'light' );
				}

				if ( mqlDark.addEventListener ) {
					mqlDark.addEventListener( 'change', watchMediaDark );
				} else {
					mqlDark.addListener( watchMediaDark );
				}
			}
			watchMediaDark( mqlDark );
		} else {
			if ( watchMediaDark ) {
				if ( mqlDark.removeEventListener ) {
					mqlDark.removeEventListener( 'change', watchMediaDark );
				} else {
					mqlDark.removeListener( watchMediaDark );
				}
				watchMediaDark = null;
			}
			setDocTheme( theme );
		}

		themeData( theme );
	}

} else {
	mqlDark = null;
	delete themes[ 'os-def' ];

	setTheme = function( theme ) {
		setDocTheme( theme );
		themeData( theme );
	}
}


// * Initialize the theme with localStorage data
// 스토리지에 저장된 테마가 없을경우, 지정된 themes의 첫번째를 Default로 지정
currentTheme = themeData();

// documentElement의 테마 클래스 제거용으로 사용될 정규표현식 생성
for ( theme in themes ) {
	if ( theme === '__proto__' ) continue;
	if ( !currentTheme ) currentTheme = theme;
	if ( !rosdef.test( theme ) ) rthemes.push( theme );
}

rthemes = new RegExp( '(^| )(' + ( rthemes.join( '|' ) || '[^\\S\\s]' ) + ')(?= |$)', 'g' );

setTheme( currentTheme );



// *--- Document ready state
// The ready event handler and self cleanup method
var setupThemeElement = function() {

	document.removeEventListener( 'DOMContentLoaded', setupThemeElement );
	window.removeEventListener( "load", setupThemeElement );
	setupThemeElement = null;

	var duration = 250, // duration (ms)
		transitionStyle = '*{transition: color ' + duration + 'ms ease-out, background-color '
			+ duration + 'ms ease-out, border-color ' + duration + 'ms ease-out !important;}';

	// Set theme element with jQuery
	$( '#theme' )
		.append( $.map( themes, function( value, index ) {
			return $( '<option>', { value: index, text: value } );
		} ) )
		.on( 'change', function( ev ) {
			var style = document.head.appendChild( document.createElement('style') );
			style.textContent = transitionStyle;
			setTimeout( function() { document.head.removeChild( style ) }, duration );
			setTheme( ev.target.value );
		} )
		.val( currentTheme );
}

document.addEventListener( 'DOMContentLoaded', setupThemeElement );
window.addEventListener( "load", setupThemeElement );


} )();