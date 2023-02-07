var popList = {};

// winpop
function winOpen( url, name, popWidth, popHeight ) {
	var defaults = 'directories=no,location=no,menubar=no,resizable=no,scrollbars=yes,status=no,titlebar=no,toolbar=no',
	// popList = window.popupList = window.popupList || {},
	name = name || 'myWin';

	if ( !popList.hasOwnProperty( [name] ) || popList[name] && popList[name].closed ) {
		var popW = parseInt( popWidth ) + 10 || 600,
			popH = parseInt( popHeight ) + 50 || 600,
			winW = window.outerWidth || ( document.documentElement.clientWidth || document.body.clientWidth ),
			winH = window.outerHeight || ( document.documentElement.clientHeight || document.body.clientHeight ),
			popL = ( ( window.screenX || window.screenLeft ) + ( winW - popW ) / 2 ).toFixed(0),
			popT = ( ( window.screenY || window.screenTop ) + ( winH - popH ) / 3 ).toFixed(0);
		popList[name] = window.open( url, name, defaults +',width='+ popW +',height='+ popH +',top='+ popT +',left='+ popL );
		popList[name].moveBy( popL - ( popList[name].screenX || popList[name].screenLeft ), popT - popList[name].screenY );
	} else if( !popList[name] || popList[name] && popList[name].closed === undefined ) {
		return console.error('The name '+ name +' of the pop-up window has already been used');
	}
	popList[name].focus();
	return popList[name];
}

function winClose( name ) {
	// var popList = window.popupList = window.popupList || {};
	var named = popList[name];
	var _target = name ? ( named && named.closed !== undefined ) ? named : false : self;
	if ( _target ) {
		_target.opener = null;
		_target.close();
		_target.open( 'about:blank', '_self' ).close();
	}
}

// 컨텐츠에 맞도록 윈도우 리사이즈,  * 팝업윈도우에서 실행
function adjustWindow( wrapId ) {
	try {
		var stdW = document.body.offsetWidth;
		var stdH = document.body.offsetHeight;
		var elBox = document.getElementById( wrapId );
		var cNode = elBox.lastChild;
		var conH;
		while ( cNode ) {
			if ( cNode.nodeType == 1 ) conH = cNode.offsetTop + cNode.offsetHeight;
			if ( conH ) break;
			cNode = cNode.previousSibling;
		}
		// Reduction
		var sizeW = ( parseInt( getComputedStyle( elBox ).minWidth || 0 ) || elBox.offsetWidth ) + 40 - stdW;
		var sizeH = conH + 40 - stdH;
		sizeW = sizeW < 0 ? sizeW : 0;
		sizeH = sizeH < 0 ? sizeH : 0;
		if ( !sizeW ) { // Expansion
			sizeW = elBox.offsetWidth - stdW;
			sizeW = sizeW > 0 ? stdW + sizeW > 1200 ? 1200 : sizeW + 20 : 0;
		}
		if ( !sizeH ) { // Expansion
			sizeH = elBox.offsetHeight - stdH;
			sizeH = sizeH > 0 ? stdH + sizeH > 900 ? 900 : sizeH + 20 : 0;
		}
		if ( sizeW || sizeH ) window.resizeBy( sizeW, sizeH );
	} catch(e) {}
}
