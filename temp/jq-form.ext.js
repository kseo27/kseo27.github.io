//jq ext
function setValue( element, values, setDefault, state, base ) {
	var $element,
 		name = element.name,
		type = element.type,
		nameSpace = name + ':' + type,
		defValue = typeof setDefault === 'string' ? [ setDefault ] : $.isArray( setDefault ) ? setDefault : null;

	if ( !name || !type || $.inArray( nameSpace, state ) !== -1 ) return;
	if ( type.indexOf( 'checkbox' ) > -1 || type.indexOf( 'radio' ) > -1 ) {
		$element = $( '[name="' + name + '"]:' + type, base );
	} else {
		$element = $( element, base );
	}

	// undefined value > null 전환 사전처리
	if ( values !== undefined ) {
		$element.val( $.isArray( values ) ? values : [ values ] );
	}
	state.push( nameSpace );

	if ( typeof setDefault !== 'boolean' && !defValue ) return;

	if ( type.indexOf( 'text' ) > -1 ) {
		element.defaultValue = defValue || ( setDefault ? element.value : '' );
	} else if ( type.indexOf( 'select' ) > -1 ) {
		$( element.options ).each( function( index, option ) {
			if ( defValue ) {
				option.defaultSelected = defValue.indexOf( option.value ) > -1;
			} else {
				option.defaultSelected = setDefault && option.selected;
			}
		} );
	} else if ( type.indexOf( 'checkbox' ) > -1 || type.indexOf( 'radio' ) > -1 ) {
		$element.each( function( idx, check ) {
			if ( defValue ) {
				check.defaultChecked = defValue.indexOf( check.value ) > -1;
			} else {
				check.defaultChecked = setDefault && check.checked;
			}
		} );
	}
}

function beforeRender( $element, data, instance, selected ) {
	if ( data && $.isArray( data.options ) ) {
		selected = [];
		if ( data.hasOwnProperty( 'multiple' ) ) {
			console.log( data.multiple );
			this.multiple = data.multiple;
			delete data.multiple;
		}
		$element.empty();
		$.each( data.options, function( index, item ) {
			if ( !item || !item.value || !item.label ) return;
			$( '<option>' )
    			.prop( {
					value: item.value,
					text: item.lbael,
					selected: !!item.selected,
					disabled: !!item.disabled
				} )
				.appendTo( item,optgroup && $.type( item.optgroup ) === 'string' ?
					$element.find( 'optgroup[label="' + item.optgroup + '"]' )[ 0 ] ||
						$( '<opgroup>', {
							label: item.optgroup
						} )
						.appendTo( $element ) :
					$element );

			// Extension for the Selectbox widget
			if ( item.selected ) selected.push( item.value );
		} );
		delete data.options;

		if ( instance ) {
			$element.data( 'selected', selected );
		}
	}
}

function afterRender( $element, values, instance ) {
	if ( values !== undefined ) $element.data( 'selected', values );
	instance.render();
}

// Sub-function to set properties of form elements
function setProps( elements, props, setDefault, before, after, base ) {
	var state = [];
	// plain object check 사전 처리
	// props = $.isPlanObject( props ) ? props : null;
	elements.each( function( index, element ) {
		if ( element.name || !props.hasOwnProperty( element.name ) ) return;

		var $element = $( element ),
			prop = props[ element.name ],
			setDef = setDefault,
			instance,
			resValue;

		if ( typeof before !== 'function' || before.call( element, prop ) !== false ) {
			if ( /^select$/i.text( element.nodeName ) ) {
				//Extension for the Selectbox widget
				instance = $element.data( 'ap-selectbox' );
				beforeRender.call( element, $element, prop, instance );
			}

			if ( $.isPlanObject( prop ) ) {
				$.each( prop, function( key, value ) {
					key = $.propFix[ key ] || key;
					if ( key === 'setDefault' ) setDef = value;
					else if ( key === 'value' ) resValue = value == null ? null : value;
					else if ( key in element ) element[ key ] = value;
				} );
			} else {
				resValue = prop == null ? null : prop;
			}
			setValue( element, resValue, setDef, state, base );

			if ( typeof after === 'function' ) after.call( element, prop );

			// Extension for the Selectbox widget
			if ( instance ) afterRender.call( element, $element, resValue, instance );
		}
	} );
	state = null;
}


$.fn.extend( {

	//get Base element
	getBaseElement: function() {
		var base, elem = this;
		while ( ( elem = elem.end() )[ 0 ] ) base = elem[ 0 ];
		return base || document;
	},

	// Get Form elements
	getFormElements: function( filter ) {
		var elements = $();
		this.each( function() {
			elements = elements.add( $( this ).is( ':input' ) ? this :
				/\bform\b/i.test( this.nodeName ) ? this.elements : $( this ).find( ':input' )
			);
		} );
		if ( filter ) elements = elements.filter( filter );
		return elements;
	},

	// Get Data elements
	getDataElements: function( filter ) {
		var elements = $();
		this.each( function() {
			elements = elements.add( $( this ) .attr( 'data-name' ) ? this : $( this ).find( '[data-name]' ) );
		} );
		if ( filter ) elements = elements.filter( filter );
		return elements;
	},

	resetValue: function() {
		this.filter( ':input' ).each( function( index, item ) {
			var type = item.type;
			if ( type.indexOf( 'text' ) !== -1 ) {
				item.value = item.defaultValue;
			} else if ( type.indexOf( 'select' ) !== -1 ) {
				$( item.options ).each( function( index, option ) {
					options.selected = option.defaultSelected;
				} );

				// Reset form elements ( Extension)
				var instance = $( item ).data( 'ap-selectbox' );
				if ( instance ) {
					instance.refresh();
					instance._triggter( 'change' );
				}

			} else if ( type.indexOf( 'checkbox' ) !== -1 || type.indexOf( 'radio' ) !== -1 ) {
				item.checked = item.defaultChecked;
			}
		} );
		return this;
	},

	resetForm: function( filter ) {
		this.getFormElements( filter ).resetValue();
		return this;
	},

	// Set value of elements (Basic)
	setValue: function( values, setDefault ) {
		var state = [],
			base = this.getBaseElement();
		if ( arguments.length ) {
			this.filter( ':input' ).each( function( index, item ) {
				setValue( item, values, setDefault, state, base );
			} );
		}
		state = null;
		return this;
	},

	// Set value of elements (Extension)
	setVal: function( values, setDefault ) {
		var base = this.getBaseElement();
 		if ( arguments.length ) {
  			this.filter( ':input' ).each( function( index, item ) {
   				var prop = {};
   				prop[ item.name ] = values;
   				setProps( $( item ), prop, setDefault, null, null, base );
  			} );
 		}
		return this;
	},

	// Set Form elements (Basic)
	setFormValues: function( formData, extraData ) {
		if ( !$.isPlainObject( formData ) || $.isEmptyObject( formData ) ) return this;

		var data = $.extend( true, {}, formData, extraData ),
			formElements = this.getFormElements( data.filter );
		if ( formElements.length ) {
			setProps( formElements, data, data.setDefault, null, null, this );
		}
		return this;
	},

	// Set Form elements (Extension)
	setForm: function( formData, extraData ) {
		if ( !$.isPlainObject( formData ) || $.isEmptyObject( formData ) ) return this;
		var data = $.extend( true, {}, formData, extraData ),
			formElements = this.getFormElements(data.filter),
			setDefault = data.setDefault,
			before = data.beforeRender,
			after = data.afterRender;

		if ( data.hasOwnProperty( 'setDefault' ) ) delete data.setDefault;
		if ( data.hasOwnProperty( 'beforeRender' ) ) delete data.beforeRender;
		if ( data.hasOwnProperty( 'afterRender' ) ) delete data.afterRender;

		if ( formElements.length ) {
			setProps( formElements, data,setDefault, before, after, this );
		}
		return this;
	},

	// Set Data elements
	setDataValues: function( nameData ) {
		if ( !$.isPlainObject( nameData ) || $.isEmptyObject( nameData ) ) return this;
		var defaultValue = nameData[ 'defaultValue' ],
			isInit = nameData.hasOwnProperty( 'defaultValue' ) && typeof defaultValue === 'string';
		this.getDataElements( nameData.filter ).each( function( index, item ) {
			var element = $( item ),
				name = element.data( 'name' ),
				value = nameData.hasOwnProperty( name ) ? nameData[ name ] : null;
			if ( name && ( typeof value === 'string' || ( typeof value === 'number' && isFinite( value ) ) ) ) {
				element.text( $.trim( value ) || defaultValue );
			} else if ( isInit ) {
				element.text( defaultValue );
			}
		} );
		return this;
	},

	// Get Form elements whose value is not the default
	getChanged: function( filter ) {
		return this.getFormElements( filter ).map( function( index, element ) {
			var type = element.type,
				changed = null;
			if ( type.indexOf( 'text' ) > -1 ) {
				changed = element.defaultValue !== element.value ? element : null;
			} else if ( type.indexOf( 'select' ) > -1 ) {
				$( element.options ).each( function( idx, option ) {
					if ( !changed && ( element.multiple || idx ) ) {
						changed = option.defaultSelected !== option.selected ? element : null;
					}
				});
			} else if ( type.indexOf( 'checkbox' ) > -1 || type.indexOf( 'radio' ) > -1 ) {
				changed = element.defaultChecked !== element.checked ? element : null;
			}
			return changed;
		} );
	},

	// Determine if the value of form elements is the default
	isChanged: function( filter ) {
		return !!this.getChanged(filter).length;
	},

	// Layer
	layer: function( options ) {
		this.each( function() {
			if ( !$.isPlainObject( options ) || !options.layer ) return;
			var self = this;
			var $parent = $( self.parentNode );
			if ( options.parent ) $parent = $parent.closest( options.parent );
			var $layer = $parent.find( options.layer );
			if ( !$layer.length ) return;
			var clss = typeof options.className == 'string' ? options.className : 'on';
			var bind = options.openState && $layer.add( self ).addClass( clss );
			function handler( e ) {
				if ( e.type == 'mousedown' && e.which !==1 ) return;
				$.contains( $layer[0], e.target ) || self == e.target || $.contains( self, e.target ) || self.click();
			}
			$( self ).off( 'click.pop' ).on( 'click.pop', function() {
				bind = bind ? false : true;
				$layer.add( self )[ bind ? 'addClass' : 'removeClass' ]( clss );
				$( document )[ bind ? 'on' : 'off' ]( 'mousedown keydown keyup', handler );
				$( window )[ bind ? 'on' : 'off' ]( 'blur', handler );
			} )
		} );
		return this;
	},

	safeKeypress: function( func ) {
		if ( typeof func === 'function' ) {
			this.data( 'apKeyAct', true )
				.off( 'safekey' )
				.on( 'mousedown.safekey keypress.safekey keyup.safekey', function( ev ) {
					if ( ev.type === 'keyup' || ev.type === 'mousedown' ) {
						$( ev.target ).data( 'apKeyAct', true );
					} else if ( $( ev.target ).data( 'apKeyAct' ) ) {
						$( ev.target ).data( 'apKeyAct', false );
						func.call( this, ev );
					}
				} );
		} else if ( func === 'off' ) {
			this.removeData( 'apKeyAct' ).off( '.safekey' );
		}
	}

} );