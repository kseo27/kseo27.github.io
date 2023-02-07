/*! jQuery UI Extensions
* @author: kseo27 - 2021-10-25 */
(function() {
	// Browser globals with jQuery UI
	if ( typeof window !== 'undefined' && window.jQuery && jQuery.ui ) {
		Array.prototype.slice.call( arguments ).forEach(function( factory, idx ) {
			if ( typeof factory === 'function') factory( jQuery );
		})
	}
}(function( $ ) { 'use strict';

// --- Datepicker settings
var dp = $.datepicker;
if ( !dp ) return;

var dpDefault = dp._defaults;

// Reset datepicker core methods
// Check positioning to remain on screen
dp._checkOffset = function( inst, offset, isFixed ) {
	var // Extended properties
		distanceX = this._get( inst, 'distanceX' ) || 0,
		distanceY = this._get( inst, 'distanceY' ) || 0,
		scrollX = document.documentElement.scrollLeft || document.body.scrollLeft,
		scrollY = document.documentElement.scrollTop || document.body.scrollTop,
		baseElement = isFixed && $( inst.input ).parents().filter(function() {
			return $( this ).css('position') === 'fixed';
		}).first(),
		wrapper = inst.input ? inst.input.parentsUntil( baseElement || 'body' ).eq( 2 ) : $(),
		baseWidth, baseRight, wrapWidth, wrapLeft, wrapRight, dpRight,
		// Original properties
		dpWidth = inst.dpDiv.outerWidth() + distanceX,
		dpHeight = inst.dpDiv.outerHeight() + distanceY,
		inputWidth = inst.input ? inst.input.outerWidth() : 0,
		inputHeight = inst.input ? inst.input.outerHeight() : 0,
		viewWidth = document.documentElement.clientWidth + ( isFixed ? 0 : scrollX ),
		viewHeight = document.documentElement.clientHeight + ( isFixed ? 0 : scrollY );

	// Original logic
	offset.left -= ( this._get( inst, 'isRTL' ) ? ( dpWidth - inputWidth ) : 0 );
	offset.left -= ( isFixed && offset.left === inst.input.offset().left ) ? scrollX : 0;
	offset.top -= ( isFixed && offset.top === ( inst.input.offset().top - inputHeight ) ) ? scrollY : 0;

	offset.top -= Math.min( offset.top, ( offset.top + dpHeight > viewHeight && viewHeight > dpHeight ) ? Math.abs( dpHeight + inputHeight ) : -distanceY );

	// Extended logic
	baseWidth = baseElement ? baseElement.outerWidth() : viewWidth;
	baseRight = baseElement ? baseWidth + ( baseElement.offset().left - scrollX ) : baseWidth;
	wrapWidth = wrapper.outerWidth() || inputWidth;
	wrapLeft = wrapper[ 0 ] ? ( wrapper.offset().left - ( isFixed ? scrollX : 0 ) ) : offset.left;
	wrapRight = wrapLeft + wrapWidth;
	dpRight = offset.left + dpWidth;
	offset.left -= Math.min( offset.left, ( baseWidth > dpWidth && dpRight + 20 > baseRight ) || ( wrapWidth > dpWidth && dpRight> wrapRight) ? Math.abs( Math.max( dpRight - baseRight + 10, dpRight - wrapRight ) ) : -distanceX );
	return offset;
}

function setLimitedDate( input, dpinst ) {
	var $this = $( input );
	var dataId = $this.data( 'from' ) || $this.data( 'to' );
	if ( dataId ) {
		var opp = $this.data( 'to' ) ? 'from' : 'to';
		var lmt = opp === 'to' ? 'maxDate' : 'minDate';
		var $oppInp = $( 'input[data-' + opp + '="' + dataId + '"]' );
		var oppDpi = $oppInp.data( 'datepicker' );
		var oppTpi = $oppInp.datepicker( 'options', 'timepicker' );
		if ( oppDpi && oppDpi.input.val() ) {
			var parsed = new Date( oppDpi.selectedYear, oppDpi.selectedMonth, oppDpi.selectedDay );
			dpinst.settings[ lmt ] = parsed;
			if ( oppTpi ) {
				parsed.setHours( oppTpi.hour, oppTpi.minute );
				dpinst.settings[ lmt + 'Time' ] = parsed;
			}
		} else {
			dpinst.settings[ lmt ] = null;
			if ( oppTpi ) dpinst.settings[ lmt + 'Time' ] = null;
		}
	}
}

function setValidDate( date, inst ) {
	if ( inst && date ) {
		var tpi = inst.settings.timepicker;
		if ( tpi ) dp._setTimeDatepicker( inst.input[ 0 ], date );
		else dp._setDateDatepicker( inst.input[ 0 ], date );
	}
}

$.datepicker.setDefaults({
	dayNamesMin: [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ],
	dateFormat: 'yy.mm.dd',
	// showOtherMonths: true,
	// showOn: 'both',
	// buttonImageOnly: false,
	// buttonImage: false, //image address.gif
	// buttonText: '<i title="Calendar">calendar</i>',
	showAnim: 'fadeIn',
	duration: 10,
	showButtonPanel: true,
	changeYear: true,
	yearRange: 'c-5:c+5',
	// beforeShowDay: $.datepicker.noWeekends, // 주말선택불가
	// onSelect: function( selectedDate, dpinst ) {},
	beforeShow: setLimitedDate,
	onClose: setValidDate,

	// Extended properties
	distanceY: 2,
	// distanceX: 0,
});

// Bind datepicker
$(function() {
	$( '[role="dpicker"] input[type="text"]' ).datepicker();
});

// --- Timepicker settings
if ( !$.timepicker ) return;

$.timepicker.setDefaults({
	timeFormat: 'HH:mm',
	pickerTimeFormat: '(TT) hh:mm',
	beforeShow: setLimitedDate,
	onClose: setValidDate
});

// Bind (date)timepicker
$(function() {
	$( '[role="tpicker"] input[type="text"]' ).timepicker();
	$( '[role="dtpicker"] input[type="text"]' ).datetimepicker();
})


},

//TODO: jq-ui-widget, chart defaults, tabulator core
function( $ ) { 'use strict';
	// extra factory
}));