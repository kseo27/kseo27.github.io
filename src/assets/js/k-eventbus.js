(function() {

function EventBus() {
	var allHandlers = {};

	return {
		on: function( type, handler ) {
			var handlers = allHandlers[ type ];
			if ( !handlers ) handlers = [ handler ];
			else handlers.push( handler );

			allHandlers[ type ] = handlers;
		},

		off: function( type, handler ) {
			var handlers = allHandlers[ type ];
			if ( handlers ) {
				handlers.splice( handlers.indexOf( handler ) >>> 0, 1 );
			}
		},

		emit: function( type, evt ) {
			var handlers = allHandlers[ type ];
			if ( handlers ) {
				handlers.slice().map(function( handler ) {
					handler( evt );
				} );
			}
		}
	};
}

} ());
