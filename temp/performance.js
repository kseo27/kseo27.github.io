// @:Expt performance
(function() {

/**
 * Performance Memory
 */
function kmemFormatter( mem ) {
	_log(
		'Allocated: ' + numeral( mem.totalJSHeapSize ).format( '0.00b' ),
		', Used: ' + numeral( mem.usedJSHeapSize ).format( '0.00b' ),
		', Limit: ' + numeral( mem.jsHeapSizeLimit ).format( '0.00b' )
	);
}
window.kmemory = function() {
	if ( performance && performance.memory ) {
		kmemFormatter( performance.memory );
	}
}


/* 
// @:Test performance nav timing
if ( typeof PerformanceTiming !== 'undefined' ) {
	console.log( performance );
	console.log( performance.timing );
}

if ( typeof PerformanceNavigationTiming !== 'undefined' ) {
	console.log( performance.getEntriesByType( 'navigation' ) );
	console.log( performance.getEntriesByType( 'resource' ) );
}
 */


/**
 * Performance Observer
 */
if ( typeof PerformanceObserver !== 'undefined' ) {

	function perfObserver( entries, observer ) {
		entries.getEntries().forEach( function( entry ) {
			// mdn ex)
			// if (entry.entryType === "mark") {
			// 	console.log(`${entry.name}'s startTime: ${entry.startTime}`);
			// }
			// if (entry.entryType === "measure") {
			// 	console.log(`${entry.name}'s duration: ${entry.duration}`);
			// }

			// console.log( '[Perf Observer] '+ entry.entryType +':'+ entry.initiatorType, entry.toJSON() );

			// request initiatorType: fetch, xmlhttprequest
			if ( /^(fetch|xmlhttprequest)$/i.test( entry.initiatorType ) ) {
				var duration = entry.duration.toFixed( 2 ) + ' ms';
				console.log( '[Request Observer]:', duration, entry.name );
			}
		} );
	}

	// entryTypes: 'element', 'event', 'first-input', 'largest-contentful-paint',
	// 'layout-shift', 'longtask', 'mark', 'measure', 'navigation', 'paint', 'resource'
	var types = [ 'resource', 'navigation' ];

		// @:Expt for dev
		types = types.concat( [ 'element', 'event' ] );

	var observer = new PerformanceObserver( perfObserver );
	observer.observe( { entryTypes: types } );
	// buffered ex) observer.observe( { type: "resource", buffered: true } );

}


})();