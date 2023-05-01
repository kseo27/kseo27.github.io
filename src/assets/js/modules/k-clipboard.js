/*

@[Clipboard]  Chrome 42 | Firefox 41 | Opera 29 | Safari 10 | IE 6

* NOTE:
- @see https://developer.mozilla.org/en-US/docs/Web/Security/User_activation

* Usage:

	element.addEventListener( 'click', function( event ) {
		var textOrElement = 'The text or target element you want to insert';
		$copyToClipboard( event, textOrElement, function( error ) {
			if ( error ) {
				// If copy to Clipboard Fails or access is not supported,
				// fallback function can be added...
			} else {
				// If Successful, no error object is passed and the callback is executed.
			}
		} );
	} );

*/
( function() { 'use strict';

/**
 * Copy specific text to clipboard
 * @param {Event} event Event object dispatched by user interaction
 * @param {String|Element} text Text or element to copy to clipboard
 * @param {Function?} callback An error object is passed if copying to the clipboard fails
 */
var $copyToClipboard = navigator.clipboard ?

// * Navigator.clipboard (Asynchronous Clipboard API) : (writeText)
//   Chrome 66 | Firefox 63 | Opera 53 | Safari 13.1 | Edge 79
function( event, text, callback ) {
	if ( text && text.nodeType === 1 ) {
		text = text.value || text.textContent;
	}
	navigator.clipboard.writeText( text ).then( callback, callback )
		// ? always restore previous selections if needed
		// .then( restoreSelection )
		;
} :

( function() {
	var duplicated = false,

		// * Override copy event
		// - ClipboardEvent.clipboardData : (types: text/plain, text/html, image/png)
		//   Chrome 41 | Firefox 22 | Opera 28 | Safari 10.1 | IE 6
		overrideCopyEvent = function( event, text ) {
			var isSuccess = false;

			if ( event.clipboardData ) {
				event.clipboardData.setData( 'text/plain', text );
				isSuccess = text === event.clipboardData.getData( 'text/plain' );

			// for IE(6-16?) (types: Text, URL)
			} else if ( window.clipboardData ) {
				window.clipboardData.setData( 'Text', text );
				isSuccess = text === window.clipboardData.getData( 'Text' );
			}

			return isSuccess;
		},

		// * Copy to clipboard manually
		// - Document API: execCommand: 'copy' (deprecated)
		//   Chrome 42 | Firefox 41 | Opera 29 | Safari 10 | IE 9
		executeManualCopy = function( text ) {
			var textarea = document.createElement( 'textarea' ),
				isRTL = window.getComputedStyle( document.body ).direction === 'rtl';

			textarea.style.cssText = 'font-size:12pt;padding:0;margin:0;border:0;' +
				'position:absolute;' + ( isRTL ? 'right' : 'left' ) + ':-9999px;' +
				'top:' + ( window.pageYOffset || document.documentElement.scrollTop ) + 'px;';

			textarea.setAttribute( 'readonly', '' );
			textarea.value = text;
			document.body.appendChild( textarea );

			textarea.contentEditable = true;

			textarea.select();
			textarea.setSelectionRange( 0, textarea.value.length );

			try {
				return document.execCommand( 'copy', false, null );

			} finally {
				document.body.removeChild( textarea );
				textarea = null;
			}
		};


	return function( event, text, callback ) {

		// Check duplicated flag to prevent duplicate calls
		// execCommand('copy') will trigger the 'copy' event
		if ( duplicated ) return;
		window.setTimeout( function() { duplicated = false } );
		duplicated = true;

		var isSuccess, error,

			// for active textfield (input/textarea)
			selstart, selend, seldir,
			active = document.activeElement,

			// for other selections
			selection = window.getSelection(),
			rangeCount = selection.rangeCount,
			prevRanges = [],
			i = 0,

			// Restore previous selections
			restoreSelection = function() {
				selection.removeAllRanges();
				active.focus();

				if ( selstart != null ) {
					active.select();
					active.setSelectionRange( selstart, selend, seldir );

				} else {
					for ( i = 0; i < rangeCount; i++ ) {
						selection.addRange( prevRanges[ i ] );
					}
					if ( active !== document.activeElement ) {
						active.focus();
					}
				}

				error = selection = prevRanges =
					active = restoreSelection = null;
			};


		if ( text && text.nodeType === 1 ) {
			text = text.value || text.textContent;
		}

		// Check if textfield is the previous active element
		if ( active.selectionStart != null ) {
			rangeCount = 0;
			selstart = active.selectionStart;
			selend = active.selectionEnd;
			seldir = active.selectionDirection;

		// Check if there is any content selected previously
		} else {
			for ( ; i < rangeCount; i++ ) {
				prevRanges.push( selection.getRangeAt( i ) );
			}
		}


		try {
			if ( !event || !event.type ) {
				throw new Error( 'Requires appropriate event object.' );
			}

			//// isSuccess = event.type === 'copy' ?
			//// 	overrideCopyEvent( event, text ) :
			//// 		executeManualCopy( text );

			isSuccess = overrideCopyEvent( event, text ) || executeManualCopy( text );

			if ( isSuccess ) {
				event.preventDefault();

				if ( typeof callback === 'function' ) {
					callback();
				}
			}
		} catch ( err ) {
			isSuccess = false;
			error = err;

		} finally {
			if ( !isSuccess ) {
				error = error || new Error( 'Your browser doesn\'t allow clipboard access.' );

				if ( typeof callback === 'function' ) {
					callback( error );
				} else if ( window.console && window.console.error ) {
					window.console.error( error );
				}
			}

			restoreSelection();
		}
	};
} )();


// globally defined as a mutable property
window.$copyToClipboard = $copyToClipboard;


} )();