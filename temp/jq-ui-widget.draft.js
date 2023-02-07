
// 검색용 autocomplete 실행문
var $acinst;
var $search = $( '#gnbSearch' );

$search.length && $search.autocomplete( {
	_size_: 10,
	_keyword_: '',
	delay: 300,
	minLength: 1,
	autoFocus: true,
	appendTo: $search.parent(),
	position: {
		my: 'left top+1', at: 'left bottom', collision: 'none'
	},
	create: function( ev ) {
		// widget을 생성하며 instance를 변수에 할당
		$acinst = $( this ).data( 'ui-autocomplete' );
		// 인스턴스 이벤트로 바인드해야 destroy시 함께 제거됨
		$acinst._on( $acinst.element, {
			keypress: function( ev ) {
				if ( ev.keyCode == 13 ) this.search( null, ev );
			}
		} );
		// Custom Rendering Method
		$acinst._renderItem = function( ul, item ) {
			return $( '<li></li>' ).append( item.el ).appendTo( ul );
		}
	},
	search: function( ev ) {
		// HTML에 무한 생성되는 status 로그를 쌓이지 않도록 지움
		$acinst.liveRegion.empty();
	},
	source: function( request, response ) {
		// 이전 검색을 수행한 키워드와 동일하면 스킵
		if ( this.options._keyword_ == request.term ) {
			this.menu.element.show();
			return this.menu.next();
		}
		var arrRes = [];
		var lmt = $acinst.options._size_;
		var rex = rexKo( request.term, 'gi' ); // TODO: rexKo 필요

		$( '#header .ap_menu nav a' ).each( function() {
			// if ( arrRes.length >= lmt ) return false
			var $this = $( this );
			var menu = $this.text();
			var equiv = $this.data( 'equiv' ) || '';
			var match = rex.exec( menu );
			if ( match || rex.test( equiv ) ) {
				var sep = '\/';
				var mnD2 = $this.parentsUntil( '.ap_menu', '.ap_d2' ).prev().text();
				var mnD1 = $this.parentsUntil( '.ap_menu', 'nav' ).prev().text();
				var path = ( mnD1 ? mnD1 + sep + ( mnD2 ? mnD2 + sep : '' ) : '' ) + menu;
				var label = menu.replace( rex, function( str ) { return '<span>'+str+'</span>' } );
				var $clone = $( this ).clone().attr( 'title', path ).html( label + '<p class="elip">' + path + '</p>' );
				arrRes.push( { el: $clone, label: label, value: menu, equiv: equiv, index: match ? match.index : NaN } );
			}
		} );

		if ( arrRes.length ) {
			// 검색 결과가 있을 경우에만 키워드 갱신
			this.options._keyword_ = request.term;
			// 검색 결과가 있을 경우에만 sort/splice
			arrRes.sort( function( a, b ) {
				return a.value < b.value ? -1 : a.value > b.value ? 1 : 0;
			} ).sort( function( a, b ) {
				return a.index - b.index;
			} );
			if ( +lmt ) arrRes.splice( lmt );
		}
		response( arrRes );
	},
	// response: function( ev, ui ) {
	//	$acinst.liveRegion.empty();
	//	console.log( ui.content.length );
	// },
	// open: function( ev ) {
	//	$acinst.menu.element.scrollTop( 0 );
	// },
	focus: function( ev, ui ) {
		$acinst.liveRegion.empty();
		return false; // 인풋값 변경을 막기위해
	},
	select: function( ev, ui ) {
		// Enter시 Click 이벤트 호출하기 위해
		if ( ev.key == 'Enter' ) ui.item.el.trigger( 'click' );
		return false; // 인풋값 변경을 막기위해
	},
	close: function( ev ) {
		$acinst.liveRegion.empty();
		// $acinst.menu.element.show(); // 닫힘 방지용
	}
} );


// jQuery UI Widget Extension
// bugfix
$.extend( $.Widget.prototype, {
	_classes: function( options ) {
		var full = [], that = this;
		options = $.extend( {
			element: this.element,
			classes: this.options.calsses || {}
		}, options );

		function onRemove() {
			options.element.each( function( i, element ) {
				var tracked;
				$.each( $.map( that.classesElementLookup, function( elements ) {
					return elements;
				} ), function( i , elements ) {
					if ( elements.is( element ) ) tracked = true;
				} );

				if ( !tracked ) {
					that._on( true, $( element ), {
						remove: "_untrackClassesElement"
					} );
				}
			} );
		}

		function processClassString( classes, checkOption ) {
			var current, i;
			for ( i = 0; i < classes.length; i++ ) {
				current = that.classesElementLookup[ classes[ i ] ] || $();
				if ( options.add ) {
					onRemove();
					current = $( $.unique( current.get().concat( options.element.get() )));
				} else {
					current = $( current.not( options.element ).get() );
				}
				that.classesElementLookup[ classes[ i ] ] = current;
				full.push( classes[ i ] );
				if ( checkOption && options.classes[ classes[ i ] ] ) {
					full.push( options.classes[ classes[ i ] ] );
				}
			}
		}
		if ( options.keys ) {
			processClassString( options.keys.match( /\S+/g ) || [], true );
		}
		if ( options.extra ) {
			processClassString( options.extra.match( /\S+/g ) || [] );
		}
		return full.join( " " );
	},

	_untrackClassesElement: function( ev ) {
		var that = this;
		$.each( that.classesElementLookup, function( key, value ) {
			if ( $.inArray( ev.target, value ) !== -1 ) {
				that.classesElementLookup[ key ] = $( value.not( ev.target ).get() );
			}
		} );
		this._off( $( ev.target ) );
	}
} );

// selectbox widget
$.widget( 'ap.selectbox', [ $.ui.formResetMixin, {
	version: 'ap.custom',
	defaultElement: '<select>',
	options: {
		block: true,
		classes: {

		},
		disabled: null,
		multiple: null,
		required: false,
		search: false,
		noResultText: 'No search results.',
	//	selected: false,
		position: {
			my: 'left top', at:'left bottom', collision: 'none'
		},
		role: 'selectbox',
		defaultText: '== Select ==',
		width: false,

		// Callbacks
		change: null,
		close: null,
		focus: null,
		open: null,
		select: null
	},
	_create: function() {
		var selectboxId = this.element.uniqueId().attr( 'id' );
		this.ids = {
			element: selectboxId,
			viewBox: selectboxId + '-view',
			searchbox: selectboxId + '-search'
		};

		// Prevent focus original select element
		this.element.attr( 'tabindex', -1 );

		// Create viewbox box and wrap original select element
		this.viewbox = this.element.wrap( this.options.block ? '<div>' : '<span>' ).parent();
		this.viewbox.attr( {
			tabindex: this.options.disabled ? -1 : 0,
			role: this.options.role,
			id: this.ids.viewbox
		} );
		this._addClass( this.viewbox, 'ap-select' );

		// Create options list
		this.listWrap = $( '<div>' ).appendTo( this.viewbox );
		this.list = $( '<ul class="ap-select-scroll"></ul>' ).appendTo( this.leftWrap );
		this._addClass( this.leftWrap, 'ap-select-list' );

		// Associate existing label with the widget
		this.labels = this.element.labels().attr( 'for', this.ids.viewbox );
		this._on( this.labels, {
			click: function( event ) {
				this.viewbox.focus();
				event.preventDefault();
			}
		} );

		this._on( this.viewbox, this._viewboxEvents );
		this._on( this.listWrap, this._listEvents );
		this._bindFormResetHandler();

		this.refresh();
	},

	refresh: function() {
		this.options.isReset = true;
		this.render();
	},

	render: function() {
		// Set state
		this._setOptions( {
			disabled: this.element.prop( 'disabled' ),
			multiple: this.element.prop( 'multiple' ),
			required: this.element.prop( 'required' ),
		} );

		var item,
			options = this._collectOptions();

		this.list.empty();

		this._parseOptions( options );
		this._renderList( this.list, this.items );
		this._setViewbox( this.items );
		this._setSearchbox();

		this.listItems = this.list.find( 'li' ).not( '.ap-optgroup' );
		this._addClass( this.listItems, 'ap-select-item' );

		// Check if there is a scrollbar
		this._resizeList();

		if ( !options.length ) { 
			return;
		}

		item = this._getSelectedItem();

		// Update the list to have the correct item focused
		if ( item ) {
			this._focus( this.listItems.eq( item.index ), null );
		}
	},

	// TODO:
	_setSearchbox: function() {
		var that = this,
			search = typeof this.options.earch === 'number' ?
				this.items.length > this.options.search :
				this.options.search;

		if ( search && !this.searchInstance ) {
			this.searchWrap = $( '<div>' ).prependTo( this.listWrap );
			this.noResultDiv = $( '<div class="ap-select-noresult"></div>' )
				.text( this.options.noResultText || '' )
				.appendTo( this.listWrap );
			this._addClass( this.searchWrap, 'ap-select-search' );
			$( '<input>', {
				id: this.ids.searchbox,
				type: 'text'
			} )
				.appendTo( this.searchWrap )
				.searchbox( { //TODO: 위젯 구현 해야함
					menu: this.searchWrap,
					minLength: 0,
					term: '',
					create: function() {
						that.searchInstance = $( this ).data( 'ap-searchbox' );
					},
					source: function( req, res ) {
						var rex, list;
						that.listItems.removeClass( 'ap-select-hide' );

						if ( !/0/.test( req.term ) && +req.term === 0 ) {
							list = that.listItems.eq(
								( that._getSelectedItem() || that.items[ 0 ] ).index
							);
							that.noResult = false;
						} else {
							rex = rexKo( req.term, 'i', $.ui.autocomplete.escapeRegex );
							that.noResult

		// ... ... ...
} ] );