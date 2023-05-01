// [expt] Optional 'require' experiments
const path = require('path');
const obj = {};
const isObject = o => {
	return obj.toString.call(o) === '[object Object]';
}
const assignProps = ( target, current ) => {
	const entries = Object.entries( current );

	for ( const [ key, value ] of entries ) {
		if ( value === undefined ) continue;

		if ( isObject( value ) && isObject( target[ key ] ) ) {
			assignProps( target[ key ], current[ key ] );

		} else if ( !isObject( target[ key ] ) ) {
			target[ key ] = current[ key ];
		}
	}
}


const defaultConfig = {
	menu: {
		dir: '/pages',
		output: '/pages.json',
		allow: [ 'html?', 'tmpl' ],
		props: {
			title: null,
			desc:  null,
			search: { split: ',' }
		},
		alias: {
			description: 'desc'
		},
		endpoint: [ '\\/head', 'body', 'template' ],
		priority: {
			assets: 8,
			references: 9,
			experiments: 10
		}
	}
};


const runProcess = () => {

	// * optional import
	let imported,
		context = process.cwd();

	const targetPath = path.join( context, 'build.cofig' );

	// ? Check extension if needed
	// let matches,
	// 	rexclude = /[-\w]+(\.(?:js(?:on)?|[em]js))?$/i
	// if ( !( matches = rexclude.exec( targetPath ) ) ) {
	// 	imported = {};
	// }

	[ '.js', '.json' ].some( extn => {
		try {
			imported = require( targetPath + extn );
		} catch (e) {}

		return imported;
	} );


	assignProps( defaultConfig, imported || {} );

	// @:test log
	console.log( defaultConfig );
}

runProcess();
