( function( $import ) {

// menu list for search
var menulist = [];

// todo: apply icon map
// var iconmap = { 'experiments': 'ico-expt' };
// $( '<a>' ).attr({ icon: iconmap[ item.name ] || '' })

function genNavMenu( ul, list, depth ) {
	depth = !depth ? 1 : depth + 1;

	$.each( list, function( _, item ) {
		var $li = $( '<li class="k-menu-item-' + depth + '">' ).appendTo( ul );

		$( '<a class="k-menu-link">' )
			.attr( { href: item.url, role: 'applink' } )
			.text( item.title || item.name ).appendTo( $li );

		if ( !item.isdir ) menulist.push( item );
		else if ( item.children ) {
			genNavMenu( $( '<ul class="k-menu">' ).appendTo( $li ), item.children, depth );
		}
	} );
}


$( function() {

	var menuData = $import.get( '/data/pages.json' );

	// generate menu links
	genNavMenu( $( '.k-nav' ), menuData );

	// console.log(menulist);

	// @:menu search process ( menulist for loop )
	// 상단 헤더 검색창 autocomplete 검색
	// 1. ( title || name ) 검색 항목 일치 시 menu clone 추가
	// 2. search[] 검색 항목 일치 시 menu clone 추가
	// max-length 10 충족 시 출력
	// 출력 시
	// ( title || name ) | navigation > tree
	// description ... 형태로 항목 출력



	$('.getTmpl').on( 'click', function() {

		console.log($import);
		try {
			// var menuData = $import( '/pages.json' );
			// console.log( menuData );

			// // generate menu links
			// genNavMenu( $( '.k-nav' ), menuData );

		} catch(e) {
			console.log('error', e);
		}
	} );


} );

return 'menujs';

} )( window.$import );