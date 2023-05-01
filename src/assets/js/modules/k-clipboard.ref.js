/*

@[Traces of Research] Clipboard API. It mainly deals with `writeText`.

* NOTE:
- 텍스트 외 다른 데이터 타입 기능을 (DataTransfer) 위해서는 외부 라이브러리 사용 권장 (e.g. clipboard.js)

- Clipboard API는 `copy`, `cut`, `paste` 외에도 다른 사용자 제스처 내에서 접근해야 함.
  사용자 활성화로 제어되는 기능 (Features gated by user activation):
  일반적으로 `click` 또는 다른 사용자 상호 작용 (keydown, mousedown, pointerdown, pointerup, touchend)
  @see https://developer.mozilla.org/en-US/docs/Web/Security/User_activation

- Clipboard에 복사하는 기능 구현은 다음 세 가지 API를 사용함.
  1) Async Clipboard API: navigator.clipboard.writeText
  2) Document API: document.execCommand('copy') (deprecated)
  3) Overriding the copy event: ClipboardEvent.clipboardData.setData

- Navigator.clipboard 사용 시 메서드(read, write, readText, writeText) 간의 지원 범위 및 권한이 다름.
  일반적으로 쓰기(write) 기능은 권한 요청 없이 사용가능 하지만 읽기(read) 기능은 권한 요청 대화 상자를 표시.

- ClipboardEvent API: clipboardData는 `copy`, `cut`, `paste` 이벤트에서만 접근이 가능하지만
  Internet Explorer에서 window.clipboardData는 다른 제스처에서도 접근이 가능함.

- Internet Explorer는 일반적으로 `copy`, `cut`, `paste` 이외의 이벤트에서 clipboard에 접근 할 경우
  최초 업데이트될 때 권한 대화 상자를 표시.

- document.execCommand('copy') 메서드는 `copy` 이벤트의 트리거가 되어, `click`등의 다른 제스처와
  혼용 할 경우 무한 루프의 위험이 있으므로 별도 처리가 필요함.

- clipboard 접근이 지원되지 않으면 흔히 window.prompt( 'Copy to clipboard: Ctrl+C, Enter', text );
  형태로 fallback 기능을 사용하는데 prompt의 기능에 한계가 있을 수 있으므로 직접 숨겨진 필드 또는 모달창을
  만들어 selection에서 직접 복사하도록 유도하는 것을 권장함.

! Clipboard 기능은 플랫폼 간의 상이한 issue들이 있음. 다음 웹 페이지 참조
  @see https://github.com/lgarron/clipboard-polyfill/blob/main/experiment/Conclusions.md

*/
( function() {
/*

@[Excerpt] stackoverflow
@see https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript

* Overview
----------
There are three primary browser APIs for copying to the clipboard:

1. Async Clipboard API [navigator.clipboard.writeText]

  - Text-focused portion available in Chrome 66 (March 2018)
  - Access is asynchronous and uses JavaScript Promises, can be written so security user
    prompts (if displayed) don't interrupt the JavaScript in the page.
  - Text can be copied to the clipboard directly from a variable.
  - Only supported on pages served over HTTPS.
  - In Chrome 66 pages inactive tabs can write to the clipboard without a permissions prompt.

2. document.execCommand('copy') (deprecated)

  - Most browsers support this as of ~April 2015 (see Browser Support below).
  - Access is synchronous, i.e. stops JavaScript in the page until complete including
    displaying and user interacting with any security prompts.
  - Text is read from the DOM and placed on the clipboard.
  - During testing ~April 2015 only Internet Explorer was noted as displaying permissions
    prompts whilst writing to the clipboard.

3. Overriding the copy event

  - See Clipboard API documentation on Overriding the copy event.
  - Allows you to modify what appears on the clipboard from any copy event, can include
    other formats of data other than plain text.
  - Not covered here as it doesn't directly answer the question.


* General development notes
---------------------------
Don't expect clipboard related commands to work whilst you are testing code in the console.
Generally, the page is required to be active (Async Clipboard API) or requires user
interaction (e.g. a user click) to allow (document.execCommand('copy')) to access the
clipboard see below for more detail.

* IMPORTANT (noted here 2020/02/20)
Note that since this post was originally written deprecation of permissions in cross-origin
IFRAMEs and other IFRAME "sandboxing" prevents the embedded demos "Run code snippet" buttons
and "codepen.io example" from working in some browsers (including Chrome and Microsoft Edge).

To develop create your own web page, serve that page over an HTTPS connection to test and
develop against.

Here is a test/demo page which demonstrates the code working:
https://deanmarktaylor.github.io/clipboard-test/


*[Async + Fallback]
Due to the level of browser support for the new Async Clipboard API, you will likely want to
fall back to the document.execCommand('copy') method to get good browser coverage.

Here is a simple example (may not work embedded in this site, read "important" note above):
```
	function fallbackCopyTextToClipboard( text ) {
		var textArea = document.createElement( 'textarea' );
		textArea.value = text;

		// Avoid scrolling to bottom
		textArea.style.top = '0';
		textArea.style.left = '0';
		textArea.style.position = 'fixed';

		document.body.appendChild( textArea );
		textArea.focus();
		textArea.select();

		try {
			var successful = document.execCommand( 'copy' );
			var msg = successful ? 'successful' : 'unsuccessful';
			console.log( 'Fallback: Copying text command was ' + msg );
		} catch ( err ) {
			console.error( 'Fallback: Oops, unable to copy', err );
		}

		document.body.removeChild( textArea );
	}

	function copyTextToClipboard( text ) {
		if ( !navigator.clipboard ) {
			fallbackCopyTextToClipboard( text );
			return;
		}
		navigator.clipboard.writeText( text ).then( function() {
			console.log( 'Async: Copying to clipboard was successful!' );
		}, function( err ) {
			console.error( 'Async: Could not copy text: ', err );
		} );
	}

	var copyBtn = document.querySelector( '.copy-btn' );

	copyBtn.addEventListener( 'click', function( event ) {
		copyTextToClipboard( 'My text to copy to clipboard.' );
	} );

```
*[Async Clipboard API]
Note that there is an ability to "request permission" and test for access to the clipboard
via the permissions API in Chrome 66.
```
	var text = 'Example text to appear on clipboard';

	navigator.clipboard.writeText( text ).then( function() {
		console.log( 'Async: Copying to clipboard was successful!' );
	}, function( err ) {
		console.error( 'Async: Could not copy text: ', err );
	} );

```
*[document.execCommand('copy')]
```
	function copyTextToClipboard( text ) {
		var textArea = document.createElement( 'textarea' );

		// Place in the top-left corner of screen regardless of scroll position.
		textArea.style.position = 'fixed';
		textArea.style.top = 0;
		textArea.style.left = 0;

		// Ensure it has a small width and height. Setting to 1px / 1em
		// doesn't work as this gives a negative w/h on some browsers.
		textArea.style.width = '2em';
		textArea.style.height = '2em';

		// We don't need padding, reducing the size if it does flash render.
		textArea.style.padding = 0;

		// Clean up any borders.
		textArea.style.border = 'none';
		textArea.style.outline = 'none';
		textArea.style.boxShadow = 'none';

		// Avoid flash of the white box if rendered for any reason.
		textArea.style.background = 'transparent';

		textArea.value = text;

		document.body.appendChild( textArea );
		textArea.focus();
		textArea.select();

		try {
			var successful = document.execCommand( 'copy' );
			var msg = successful ? 'successful' : 'unsuccessful';
			console.log( 'Copying text command was ' + msg );
		} catch ( err ) {
			console.log( 'Oops, unable to copy' );
		}

		document.body.removeChild( textArea );
	}

```
---------------------------------------------------------------------------------------------
(another article)

- Uses cssText to avoid exceptions in Internet Explorer as opposed to style directly.
- Restores selection if there was one
- Sets read-only so the keyboard doesn't come up on mobile devices
- Has a workaround for iOS so that it actually works as it normally blocks execCommand.

```
var copyToClipboard = ( function initClipboardText() {
	var textarea = document.createElement('textarea');

	// Move it off-screen.
	textarea.style.cssText = 'position: absolute; left: -99999em';

	// Set to readonly to prevent mobile devices opening a keyboard when
	// text is .select()'ed.
	textarea.setAttribute('readonly', true);

	document.body.appendChild(textarea);

	return function setClipboardText(text) {
		textarea.value = text;

		// Check if there is any content selected previously.
		var selected = document.getSelection().rangeCount > 0 ?
			document.getSelection().getRangeAt(0) : false;

		// iOS Safari blocks programmatic execCommand copying normally, without this hack.
		// https://stackoverflow.com/questions/34045777/copy-to-clipboard-using-javascript-in-ios
		if ( navigator.userAgent.match(/ipad|ipod|iphone/i) ) {
			var editable = textarea.contentEditable;
			textarea.contentEditable = true;
			var range = document.createRange();
			range.selectNodeContents(textarea);
			var sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
			textarea.setSelectionRange(0, 999999);
			textarea.contentEditable = editable;
		}
		else {
			textarea.select();
		}

		try {
			var result = document.execCommand('copy');

			// Restore previous selection.
			if (selected) {
				document.getSelection().removeAllRanges();
				document.getSelection().addRange(selected);
			}

			return result;
		}
		catch (err) {
			console.error(err);
			return false;
		}
	};
} )();

```
*/

/*

@[Excerpt] web.dev
@see https://web.dev/async-clipboard/

* 보안 및 권한
------------
많은 새로운 API와 마찬가지로 Clipboard API는 HTTPS를 통해 제공되는 페이지에만 지원됩니다.
악용을 방지하기 위해 페이지가 활성 탭일 때만 클립보드 액세스가 허용됩니다. 활성 탭의 페이지는
권한을 요청하지 않고 클립보드에 쓸 수 있지만 클립보드에서 읽기에는 항상 권한이 필요합니다.

복사 및 붙여넣기 권한이 Permissions API에 추가되었습니다.
* clipboard-write 권한은 페이지가 활성 탭일 때 자동으로 부여됩니다.
! clipboard-read 권한을 요청해야 하며, 이를 위해 클립보드에서 데이터 읽기를 시도할 수 있습니다.
아래 코드는 후자를 보여줍니다.
```
	const queryOpts = { name: 'clipboard-read', allowWithoutGesture: false };
	const permissionStatus = await navigator.permissions.query( queryOpts );

	// Will be 'granted', 'denied' or 'prompt':
	console.log( permissionStatus.state );

	// Listen for changes to the permission state
	permissionStatus.onchange = () => {
		console.log( permissionStatus.state );
	};

```
allowWithoutGesture 옵션을 사용하여 잘라내기 또는 붙여넣기를 호출하기 위해 사용자 제스처가
필요한지 여부를 제어할 수 있습니다. 이 값의 기본값은 브라우저에 따라 다르므로 항상 포함해야 합니다.


* 권한 정책 통합
--------------
iframe에서 API를 사용하려면 다양한 브라우저 기능과 API를 선택적으로 활성화 및 비활성화할 수
있는 메커니즘을 정의하는 권한 정책으로 이를 활성화해야 합니다. 구체적으로, 앱의 필요에 따라
clipboard-read 또는 clipboard-write 중 하나 또는 둘 모두를 전달해야 합니다.
```
	<iframe src="index.html" allow="clipboard-read; clipboard-write"></iframe>

```
* 기능 감지
----------
모든 브라우저를 지원하면서 Async Clipboard API를 사용하려면 navigator.clipboard에 대해
테스트하고 이전 방법으로 대체하세요. 예를 들어, 다음은 다른 브라우저를 포함하도록 붙여넣기를
구현할 수 있는 방법입니다.
```
	document.addEventListener( 'paste', async (e) => {
		e.preventDefault();
		let text;
		if ( navigator.clipboard )
			text = await navigator.clipboard.readText();
		else
			text = e.clipboardData.getData( 'text/plain' );

		console.log( 'Got pasted text: ', text );
	} );

```
Async Clipboard API 이전에는 웹 브라우저 전반에서 다양한 복사 및 붙여넣기 구현이 혼합되어
있었습니다. 대부분의 브라우저에서 브라우저 자체의 복사 및 붙여넣기는
document.execCommand('copy') 및 document.execCommand('paste')를 사용하여 트리거할 수
있습니다. 복사할 텍스트가 DOM에 없는 문자열이면 DOM에 삽입하고 선택해야 합니다.
```
	button.addEventListener( 'click', (e) => {
		const input = document.createElement( 'input' );
		document.body.appendChild( input );
		input.value = text;
		input.focus();
		input.select();
		const result = document.execCommand( 'copy' );
		if ( result === 'unsuccessful' ) {
			console.error( 'Failed to copy text.' );
		}
	} );

```
- Internet Explorer에서는 window.clipboardData를 통해 클립보드에 액세스할 수도 있습니다.
  책임감 있게 권한을 요청하는 일부로서, 클릭 이벤트와 같은 사용자 제스처 내에서 액세스하는 경우
  권한 부여 메시지가 표시되지 않습니다.
*/

// @[Advanced practice] Permissions API
//  Chrome 43 | Firefox 46 | Opera 30 | Safari 16 | Edge 79
// @see https://developer.mozilla.org/en-US/docs/Web/API/Permissions/query
if ( navigator.permissions ) {

	navigator.permissions.query({ name: 'geolocation' })
		.then( function( permissionStatus ) {

			// Returns the state of a requested permission
			// one of 'granted', 'denied', or 'prompt'.
			var state = permissionStatus.state ||
					permissionStatus.status; // deprecated (replace `status` with `state`)

			console.log( 'geolocation:', state || 'not supported' );

			if ( state === 'granted' ) {
				// e.g. showLocalNewsWithGeolocation();
			} else if ( state === 'prompt' ) {
				// e.g. showButtonToEnableLocalNews();
			}
			// Don't do anything if the permission was denied.

			// An event called whenever PermissionStatus.state changes
			permissionStatus.onchange = function() {
				//// var state = permissionStatus.state || permissionStatus.status;
				console.log( 'geolocation permission status has changed to "'
					+ ( this.state || this.status ) + '"' );
				//// permissionStatus.onchange = null;
			};
		} );

	navigator.permissions.query({ name: 'clipboard-write', allowWithoutGesture: false })
		.then( function( status ) {
			var state = status.state || status.status,
				done = function( granted ) {
					if ( granted ) {
						// Logic to run if permission is granted...
					}
					status.onchange = done = null;
				};

			if ( state === 'granted' ) {
				done( true );

			} else if ( state === 'prompt' ) {
				status.onchange = function() {
					done( ( this.state || this.status ) === 'granted' );
				}
			} else {
				done( false );
			}
		} );
}


/*

@[Excerpt] clipboard.js
스크롤 위치 변경을 막는 부분 and 요소 별 선택영역 조정 참조

```
function createFakeElement( value ) {
	var isRTL = document.documentElement.getAttribute('dir') === 'rtl';
	// Prevent zooming on iOS
	var fakeElement = document.createElement( 'textarea' );

	// Reset box model
	fakeElement.style.fontSize = '12pt';

	fakeElement.style.border = '0';
	fakeElement.style.padding = '0';
	// Move element out of screen horizontally
	fakeElement.style.margin = '0';

	// Move element to the same position vertically
	fakeElement.style.position = 'absolute';
	fakeElement.style[ isRTL ? 'right' : 'left' ] = '-9999px';

	var yPosition = window.pageYOffset || document.documentElement.scrollTop;
	fakeElement.style.top = ''.concat( yPosition, 'px' );
	fakeElement.setAttribute( 'readonly', '' );
	fakeElement.value = value;
	return fakeElement;
}
function select(element) {
	var selectedText;

	if (element.nodeName === 'SELECT') {
		element.focus();

		selectedText = element.value;
	}
	else if (element.nodeName === 'INPUT' || element.nodeName === 'TEXTAREA') {
		var isReadOnly = element.hasAttribute('readonly');

		if (!isReadOnly) {
			element.setAttribute('readonly', '');
		}

		element.select();
		element.setSelectionRange(0, element.value.length);

		if (!isReadOnly) {
			element.removeAttribute('readonly');
		}

		selectedText = element.value;
	}
	else {
		if (element.hasAttribute('contenteditable')) {
			element.focus();
		}

		var selection = window.getSelection();
		var range = document.createRange();

		range.selectNodeContents(element);
		selection.removeAllRanges();
		selection.addRange(range);

		selectedText = selection.toString();
	}

	return selectedText;
}

```
*/

/*

?[Excerpt] Dottoro
References parts of the legacy clipboard API
@see http://help.dottoro.com/ljxundda.php

```
function CopyToClipboard() {
	var input = document.getElementById( 'toClipboard' );
	var textToClipboard = input.value;

	var success = true;
	if ( window.clipboardData ) { // Internet Explorer
		window.clipboardData.setData( 'Text', textToClipboard );

	} else {
		// create a temporary element for the execCommand method
		var forExecElement = CreateElementForExecCommand( textToClipboard );

		// Select the contents of the element
		// (the execCommand for 'copy' method works on the selection)
		SelectContent( forExecElement );

		var supported = true;

		// UniversalXPConnect privilege is required for clipboard access in Firefox(<15)
		try {
			if ( window.netscape && netscape.security ) {
				netscape.security.PrivilegeManager.enablePrivilege( 'UniversalXPConnect' );
			}

			// Copy the selected content to the clipboard
			// Works in Firefox and in Safari before version 5
			success = document.execCommand( 'copy', false, null );

		} catch ( e ) {
			success = false;
		}

		// remove the temporary element
		document.body.removeChild( forExecElement );
	}

	if ( success ) {
		alert( 'The text is on the clipboard, try to paste it!' );
	} else {
		alert( 'Your browser doesn\'t allow clipboard access!' );
	}
}
function CreateElementForExecCommand( textToClipboard ) {
	var forExecElement = document.createElement( 'div' );

	// place outside the visible area
	forExecElement.style.position = 'absolute';
	forExecElement.style.left = '-10000px';
	forExecElement.style.top = '-10000px';

	// write the necessary text into the element and append to the document
	forExecElement.textContent = textToClipboard;
	document.body.appendChild( forExecElement );

	// the contentEditable mode is necessary for the execCommand method in Firefox
	forExecElement.contentEditable = true;

	return forExecElement;
}
function SelectContent( element ) {
	// first create a range
	var rangeToSelect = document.createRange();
	rangeToSelect.selectNodeContents( element );

	// select the contents
	var selection = window.getSelection();
	selection.removeAllRanges();
	selection.addRange( rangeToSelect );
}

```
*/

//// Clipboard not supported (not recommended)
function promptCopyToClipboard( text ) {
	window.prompt( 'Copy to clipboard: Ctrl+C, Enter', text );
}



// @[Integrated Clipboard Method]
// * 참조 사항들을 종합하여 작성한 `cpoy` 메서드
var Integrated_Clipboard_Method = ( function() {

	// execCommand 'copy'로 인한 무한 루프 방지 용
	var dupflag = false;
	function duplicated() {
		if ( dupflag ) return true;
		window.setTimeout( function() { dupflag = false } );
		return !( dupflag = true );
	}

	/**
	 * Copy specific text to clipboard
	 * @param {Event} event Event object dispatched by user interaction
	 * @param {String|Element} text Text or element to copy to clipboard
	 * @param {Function?} callback An error object is passed if copying to the clipboard fails
	 */
	return function copyToClipboard( event, text, callback ) {
		if ( duplicated() ) return;

		var isSuccess, error,
			isRTL, textarea, range,

			// for active textfield (input/textarea)
			selstart, selend, seldir,
			active = document.activeElement,

			// for other selections
			selection = window.getSelection(),
			rangeCount = selection.rangeCount,
			prevRanges = [],
			i = 0,

			// Clear objects to release memory
			clearData = function() {
				error = selection = prevRanges = range =
					active = clearData = restoreSelection = null;
			},

			// Restore previous selection
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
				clearData();
			};


		// If text is a textfield or element
		if ( text && text.nodeType === 1 ) {
			text = text.value || text.textContent;
		}

		/*
		 * Modern Asynchronous Clipboard API
		 - Navigator.clipboard : (methods: read, write, readText, writeText)
		   Chrome 66 | Firefox 63 | Opera 53 | Safari 13.1 | Edge 79
		 ! Support and details are different for each method
		*/
		if ( navigator.clipboard ) {
			navigator.clipboard.writeText( text ).then( callback, callback )
				// ? always restore previous selections if needed
				// .then( restoreSelection )
				.then( clearData );
			return;
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

			// UniversalXPConnect privilege is required for clipboard access in Firefox(<15)
			if ( window.netscape && netscape.security && netscape.security.PrivilegeManager ) {
				netscape.security.PrivilegeManager.enablePrivilege( 'UniversalXPConnect' );
			}

			/*
			 * Overwrite what is being copied to the clipboard.
			 - ClipboardEvent.clipboardData : (types: text/plain, text/html, image/png)
			   Chrome 41 | Firefox 22 | Opera 28 | Safari 10.1 | IE 6
			 ! Support and details are different for each event (copy, cut, paste)
			*/
			if ( event.clipboardData ) {
				event.clipboardData.setData( 'text/plain', text );

				// There is an issue with the operation of the `setData` method in iOS,
				// so check it through `getData`
				isSuccess = text === event.clipboardData.getData( 'text/plain' );

			// ? window.clipboardData : for IE(6-16?) (types: Text, URL)
			} else if ( window.clipboardData ) {
				window.clipboardData.setData( 'Text', text );
				isSuccess = text === window.clipboardData.getData( 'Text' );
			}

			/*
			 * Copy to clipboard manually using text field
			 - Document API: execCommand: 'copy' (deprecated)
			   Chrome 42 | Firefox 41 | Opera 29 | Safari 10 | IE 9
			 ! Support and error conditions are different for each platform
			*/
			if ( !isSuccess ) {
				textarea = document.createElement( 'textarea' ); // Prevent zooming on iOS
				isRTL = window.getComputedStyle( document.body ).direction === 'rtl';

				// Move it off-screen and avoid scrolling to bottom
				textarea.style.cssText = 'font-size:12pt;padding:0;margin:0;border:0;' +
					'position:absolute;' + ( isRTL ? 'right' : 'left' ) + ':-9999px;' +
					'top:' + ( window.pageYOffset || document.documentElement.scrollTop ) + 'px;';

				// Set to readonly to prevent mobile devices opening a keyboard
				// when text is .select()'ed.
				textarea.setAttribute( 'readonly', '' );

				textarea.value = text;
				document.body.appendChild( textarea );

				// ? iOS Safari blocks programmatic execCommand copying normally, without this hack.
				// https://stackoverflow.com/questions/34045777/copy-to-clipboard-using-javascript-in-ios
				if ( navigator.userAgent.match( /ipad|ipod|iphone/i ) ) {
					textarea.contentEditable = true;
					range = document.createRange();

					// Range API: selectNodeContents
					//  Chrome 4 | Firefox 2 | Opera 10 | Safari 3.1 | IE 9
					range.selectNodeContents( textarea );
					selection.removeAllRanges();
					selection.addRange( range );

					// HTMLInputElement API: setSelectionRange
					//  Chrome 4 | Firefox 2 | Opera 10 (TextArea 12.1) | Safari 3.1 | IE 9
					textarea.setSelectionRange( 0, textarea.value.length );

				} else {
					textarea.select();
				}

				isSuccess = document.execCommand( 'copy', false, null );
			}

			// When successful, prevent default action
			// and execute callback for success by passing nothing as param
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
			if ( textarea ) {
				document.body.removeChild( textarea );
				textarea = null;
			}

			// When it fails, execute callback for failure by passing error object as param
			// or display error in console
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



// @[apx] 별첨 부록

// ?[Legacy execCommand] related topics
// @see http://help.dottoro.com/larpvnhw.php

// ?[Document.createRange]: #createRange #createTextRange
// Referred to Dottoro (for IE 6-8)
function RemoveContent() {
	var srcObj = document.getElementById( 'src' );

	if ( document.createRange ) {  // all browsers, except IE before version 9
		var rangeObj = document.createRange();
		rangeObj.selectNodeContents( srcObj );
		rangeObj.deleteContents();
	}
	else {  // Internet Explorer before version 9
		var rangeObj = document.body.createTextRange();
		rangeObj.moveToElementText( srcObj );
		rangeObj.select();
		rangeObj.execCommand( 'cut' );
	}
}


} )();