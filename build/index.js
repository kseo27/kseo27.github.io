const fs = require('fs').promises;
const path = require('path');
// const context = process.cwd();
const { combinePath } = require('./combine-path');
const { isPlainObject } = require('./is-plain-object');

process.on( 'exit', ( code ) => {
	if ( code === 0 ) console.log( '\x1b[92m%s\x1b[0m', '[Build Process] Complete.' );
	else console.warn( '\x1b[93m%s\x1b[0m', '[Build Process] Incomplete Termination.' );
} );

process.on( 'uncaughtException', ( err ) => {
	console.error( '\x1b[91m%s\x1b[0m', '[Build Exception]', err );
	process.exit( 1 );
} );

console.log( '\x1b[34m====\x1b[96m [Build Process] '
+ '\x1b[34m============================================================\x1b[0m\r\n'
+ 'Create `pages.json` by assembling the page menu objects from the pages directory' );


// *--- Build config ------------------------------
const config = {
	menu: {
		dir: '/pages', // 지정된 폴더의 하위 파일로 메뉴 생성
		output: '/data/pages.json', // 지정된 파일로 생성된 메뉴 출력
		allow: [ 'html?', 'tmpl' ], // 메뉴로 생성될 파일 확장자
		props: { // 메뉴 객체에 포함될 속성
			// split: 지정된 구분자로 split 하여 array값 생성
			// parse: 지정된 함수를 reviver로 하여 JSON.parse( text, reviver );
			title: null,
			desc:  null,
			search: { split: ',' }
		},
		alias: {
			description: 'desc'
		},
		endpoint: [ '\\/head', 'body', 'template' ], // 탐색 중 해당 태그를 만나면 해당 파일의 속성 탐색을 스킵
		priority: { // 우선순위에 따라 메뉴 정렬, 수치가 낮을수록 상위, (default: 5)
			assets: 8,
			references: 9,
			experiments: 10
		}
	}
}


// *--- Regex -------------------------------------
const r = {
	wsp      : `[\\x20\\t\\r\\n\\f]`, // whitespace
	htmlns   : `[^<]+|<(?!\/?[a-z])`, // html nonspecific
	stylens  : `[^'"<\\/]|<(?!\\/)|\\/(?!\\*)`, // nonspecific in <style>
	scriptns : `[^'"\`<\\/]|<(?!\\/)|\\/(?!\\*|\\/)`, // nonspecific in <script>

	htmlcmnt : `<!--((?:[^-]|-(?!->))*)-->`, // html comment, [1]: comment content
	mlncmnt  : `\\/\\*(?:[^*]|\\*(?!\\/))*\\*\\/`, // multi-line comment
	slncmnt  : `\\/\\/[^\\r\\n\\f]*`, // single-line comment

	string   : `'(?:\\\\.|[^\\\\'\\r\\n\\f])*'|"(?:\\\\.|[^\\\\"\\r\\n\\f])*"`, // string in style / script
	tmplli   : '`(?:\\\\.|[^\\\\`$]|\\$(?!\\{))*`', // template literal without interpolation
	// template literal with interpolation
	interp   : '`(?:\\\\.|[^\\\\`$]|\\$(?!\\{))*(\\$\\{)', // [1]: interpolation start (nest check required)

	tagcont  : `(?:[^<]|<(?!\\/?[a-z]))`, // html tag content
	nameid   : `[a-z][^\\/\\0>:\\x20\\t\\r\\n\\f]*`, // tag or prop name identifier without colon, use with `i` flag
	attrid   : `[^\\x20\\t\\r\\n\\f\\/>"'=]+`, // attribute identifier, Referred to Stack overflow
	// single or double quoted attr value, can be multiline
	attrqtd  : `'((?:\\\\.|[^\\\\'])*)'|"((?:\\\\.|[^\\\\"])*)"`, // [1]: single quoted value, [2]: double quoted value

	shallowAttr : `[^\\/>"']+|'(?:\\\\.|[^\\\\'])*'|"(?:\\\\.|[^\\\\"])*"`, // quick search for tag attributes

	sep( s ) {
		return `${ r.wsp }*${ s }${ r.wsp }*`;
	}
}
// 참조용, 하단에 재정의 함
const re = {
	hcmnt  : new RegExp( `^${r.wsp}*${r.htmlcmnt}${r.wsp}*` ), // [1]: head comment contents
	// head comment properties,  [1]: @propperty,  [2]: content value
	hprop  : new RegExp( `@(${r.nameid})${r.sep(':?')}((?:\\\\.|[^\\\\@;])+?)${r.wsp}*(?=[@;]|(?:\\r?\\n){2}|$)`, 'gi' ),
	// html tags,  [1]: comment content,  [2]: tag name,  [3]: attributes all,  [4]: tag content
	tags   : new RegExp( `${r.htmlcmnt}|<(style|script|${r.nameid})\\b((?:${r.shallowAttr})*)\\/?>(?=(${r.tagcont}*)(?:<\\/\\2>)?)`, 'gi' ),
	// tag attributes,  [1]: attribute name,  [2]|[3]|[4]: attribute value
	attrs  : new RegExp( `${r.wsp}*(${r.attrid})(?:${r.wsp}*=${r.wsp}*(?:${r.attrqtd}|(${r.attrid}))|)${r.wsp}*`, 'g' ),
	style  : new RegExp( `^(?:${r.stylens}|${r.mlncmnt}|${r.string})+` ), // style tag contents
	// script tag contents,  [1]: interpolation start (nest check required)
	script : new RegExp( `^(?:(?:${r.scriptns}|${r.mlncmnt}|${r.slncmnt}|${r.string}|${r.tmplli})+|${r.interp})` ),
	// inner interpolation,  [1]: interpolation end,  [2]: interpolation start
	inner  : /^(?:[^`;]*?(?:(\})|`)(?:\\.|[^\\`$]|\$(?!\{))*(?:`|(\$\{)))/,
	// Check for nested braces within interpolation //! [^'"\`\\/{};]+ 플러스 기호로 극도의 성능 저하가 일어남
	// [1]: new interpolation start,  [2]: open brace,  [3]: close brace
	braces : new RegExp( `^(?:[^'"\`\\/{};]|\\/(?!\\*|\\/)|${r.mlncmnt}|${r.slncmnt}|${r.string}|${r.tmplli})*(?:${r.interp}|(\\{)|(\\}))` ),
}
const _scComment = `\\/\\*(?:[^*]|\\*(?!\\/))*\\*\\/|\\/\\/[^\\r\\n\\f]*(?=[\\r\\n\\f]|$)`; //? (?=[\\r\\n\\f]|$)


// *--- Props & Methods ---------------------------
const menudir = combinePath( config.menu.dir );
const outpath = combinePath( config.menu.output );
const reqprops = Object.keys( config.menu.props );

const unalias = ( ( props, aliases ) => {
	for ( const [ alias, prop ] of Object.entries( aliases ) ) {
		if ( props.hasOwnProperty( prop ) && !props.hasOwnProperty( alias ) ) {
			reqprops.push( alias );
		} else {
			delete aliases[ alias ];
		}
	}
	return prop => ( aliases[ prop ] || prop );
} )( config.menu.props, config.menu.alias );


const rnaming = new RegExp( `(?:^|[-_.\\x20\\t]+?|(?<=[a-z])(?=[A-Z]))((?:[A-Za-z0-9]|[^\0-\\x7f])|$)`, 'g' );
const toMenuName = ( filename ) => {
	return filename.replace( /(?<!^)\.[a-z]+$/i, '' )
		.replace( rnaming, ( _, match, index ) => {
			return match ? index ? ' ' + match : match.toUpperCase() : '';
		} );
}


const isEndpoint = ( endpoints => {
	const rendpoint = new RegExp( `^(?:${ endpoints.join( '|' ) })$`, 'i' );
	return ( tag ) => rendpoint.test( tag );
} )( config.menu.endpoint );


const parseProp = ( props => {
	const parser = {};
	for ( const [ prop, dscr ] of Object.entries( props ) ) {
		if ( isPlainObject( dscr ) ) {
			if ( dscr.hasOwnProperty( 'split' ) ) {
				const { split } = dscr;
				const rsep = split ? ( split instanceof RegExp ? split
					: typeof split == 'string' ? new RegExp( r.sep( split ) )
						: undefined ) : undefined;
				parser[ prop ] = ( value ) => value.split( rsep );
				continue;
			}
			if ( dscr.hasOwnProperty( 'parse' ) ) {
				parser[ prop ] = ( value ) => JSON.parse( value, dscr.parse );
				continue;
			}
		}
		parser[ prop ] = ( value ) => value;
	}
	return ( prop, value ) => parser[ prop ]( value );
} )( config.menu.props );


const isAllowedFile = ( extns => {
	const rextns = new RegExp( `\\.(?:${ extns.join( '|' ) })$`, 'i' );
	return ( file = {} ) => rextns.test( file.name );
} )( config.menu.allow );


const clearMenuPath = ( dir => {
	const rnorm = /^[\\/]*|[\\/]+/g; // to normalize url
	return url => {
		if ( !url.startsWith( dir ) ) return url;
		return url.slice( dir.length ).replace( rnorm, '/' );
	}
} )( menudir );


const sortMenu = ( pri => {
	return list => list.sort( ( a, b ) => {
		return ( pri[ a.name.toLowerCase() ] || 5 )
			- ( pri[ b.name.toLowerCase() ] || 5 );
	} );
} )( config.menu.priority );


const rhcmnt  = new RegExp( `^${r.wsp}*${r.htmlcmnt}${r.wsp}*` );
const rignore = new RegExp( `^${r.wsp}*\\bignore-build\\b`, 'i' );
const rhprop  = new RegExp( `@(${r.nameid})${r.sep(':?')}((?:\\\\.|[^\\\\@;])+?)${r.wsp}*(?=[@;]|(?:\\r?\\n){2}|$)`, 'gi' );
const rtags   = new RegExp( `${r.htmlcmnt}|<(\\/?${r.nameid})\\b((?:${r.shallowAttr})*)\\/?>(?=(${r.tagcont}*))`, 'gi' );
const rattrs  = new RegExp( `${r.wsp}*(${r.attrid})(?:${r.wsp}*=${r.wsp}*(?:${r.attrqtd}|(${r.attrid}))|)${r.wsp}*`, 'g' );
const rstyle  = new RegExp( `^(?:${r.stylens}|${r.mlncmnt}|${r.string})+` );
const rscript = new RegExp( `^(?:(?:${r.scriptns}|${r.mlncmnt}|${r.slncmnt}|${r.string}|${r.tmplli})+|${r.interp})` );
const rbraces = new RegExp( `^(?:[^'"\`\\/{};]|\\/(?!\\*|\\/)|${r.mlncmnt}|${r.slncmnt}|${r.string}|${r.tmplli})*(?:${r.interp}|(\\{)|(\\}))` );
const rinner  = /^(?:[^`;]*?(?:(\})|`)(?:\\.|[^\\`$]|\$(?!\{))*(?:`|(\$\{)))/;

const getNestedBraces = content => {
	let match, interp, depth = 0, result = '';

	while ( match = rbraces.exec( content ) ) {
		if ( ( match[ 1 ] || match[ 3 ] ) && depth <= 0 ) break;

		content = content.slice( match[ 0 ].length );
		result += match[ 0 ];

		if ( match[ 1 ] ) {
			interp = getInnerTemplate( content );
			content = content.slice( interp.length );
			result += interp;
			continue;
		}
		if ( match[ 2 ] ) depth++;
		if ( match[ 3 ] ) depth--;
	}
	return result;
}

const getInnerTemplate = content => {
	let match, nested, depth = 1, result = '';

	while ( depth && ( match = rinner.exec( content ) ) ) {
		if ( nested = getNestedBraces( content ) ) {
			content = content.slice( nested.length );
			result += nested;
			continue;
		}
		if ( match[ 1 ] ) depth--;
		if ( match[ 2 ] ) depth++;

		content = content.slice( match[ 0 ].length );
		result += match[ 0 ];
	}
	return result;
}

const parseMenu = ( props => {

	return ( menu, data ) => {
		// @:test log
		console.log( '\x1b[35m%s\x1b[4m\x1b[97m%s\x1b[0m', '[Parsing]: ', menu.url );

		const tempData = {};
		const reqset = new Set( reqprops );
		const assignProp = ( prop, value ) => {
			if ( !reqset.has( prop ) || !value ) return;

			let name = unalias( prop );
			tempData[ name ] = parseProp( name, value );

			if ( name != prop ) reqset.delete( prop );
			reqset.delete( name );
		};


		let match, suppl;

		// Analyze head comment
		if ( ( match = rhcmnt.exec( data ) )?.[ 1 ] ) {

			// 파일 상단에 `ignore-build`주석이 있으면 false를 반환
			// Return false if there is an `ignore-build` comment at the top
			if ( rignore.test( match[ 1 ] ) ) return false;

			while ( suppl = rhprop.exec( match[ 1 ] ) ) {
				assignProp( suppl[ 1 ], suppl[ 2 ] );
			}
			if ( reqset.size ) rtags.lastIndex = match[ 0 ].length;
			// data = data.slice( match[ 0 ].length );
		}

		// Analyze html tags
		while ( reqset.size && ( match = rtags.exec( data ) ) ) {
			// @:test log
			// console.log( '\x1b[92m%s \x1b[90m%s\x1b[0m', `<${ match[1] !== undefined ? 'comment' : match[2] }>`, match[0] );

			if ( match[ 1 ] !== undefined ) continue; // match comment

			let tagname = match[ 2 ].toLowerCase();

			if ( isEndpoint( tagname ) ) break; // match endpoint tags

			if ( tagname === 'title' ) {
				assignProp( tagname, ( suppl = match[ 4 ]?.trim() ) );
				rtags.lastIndex += suppl?.length >> 0;
				continue;
			}

			if ( tagname === 'meta' ) {
				let property, content;

				while ( suppl = rattrs.exec( match[ 3 ] ) ) {
					if ( suppl[ 1 ] === 'property' ) {
						property = ( suppl[ 2 ] || suppl[ 3 ] || suppl[ 4 ] )?.replace( /^kj:|[\S\s]*/, '' );
					} else if ( suppl[ 1 ] === 'content' ) {
						content = ( suppl[ 2 ] || suppl[ 3 ] || suppl[ 4 ] );
					}
				}

				if ( property ) {
					assignProp( property, content );

					// @:test log
					// console.log( `${ property }: "${ content }"` );
				}
				continue;
			}

			// @:test log, style / script content
			// console.log( match[ 4 ] );

			// * style 또는 script 문자열 내부에 태그 표현(</>angle brackets)이 있을 경우
			// * 이를 태그로 인식하기 때문에 내용을 검색하여 정규표현식의 lastIndex를 스킵 시킨다
			if ( tagname === 'style' ) {
				suppl = data.slice( rtags.lastIndex );

				if ( match = rstyle.exec( suppl ) ) {
					rtags.lastIndex += match[ 0 ].length;

					// @:test log
					// console.log( match[ 0 ] );
				}
				continue;
			}

			if ( tagname === 'script' ) {
				suppl = data.slice( rtags.lastIndex );

				// @:test log
				// let testlog = '';

				while ( match = rscript.exec( suppl ) ) {
					suppl = suppl.slice( match[ 0 ].length );

					// @:test log
					// testlog += `\x1b[96m${ match[ 0 ].slice( 0, match[ 1 ] && -2 ) }\x1b[91m${ match[ 1 ] || '' }\x1b[0m`;

					if ( match[ 1 ] ) { // template literal interpolation

						let inner = getInnerTemplate( suppl );
						suppl = suppl.slice( inner.length );

						// @:test log
						// testlog += `\x1b[33m${ inner }\x1b[0m`;
					}
				}
				rtags.lastIndex = ( data.length - suppl.length );

				// @:test log
				// console.log( testlog );
			}
		}
		// Reset rtags lastIndex
		rtags.lastIndex = 0;

		// Sort & assign properties to menu item
		for ( let prop in props ) {
			if ( reqset.has( prop ) ) continue;
			menu[ prop ] = tempData[ prop ];
		}

		// Remove unnecessary items
		// delete menu.name;
	}
} )( config.menu.props );



// *--- Main build process ------------------------
const buildProcess = async () => {
	const mainindex = path.join( menudir, '/index.html' );
	console.log(mainindex);

	let menulist = await ( async function genMenulist( dirpath ) {
		try {
			const mlist = [];
			const files = await fs.readdir( dirpath, { withFileTypes: true } );

			for ( const file of files ) {
				// console.log(file.name);
				const fpath = path.join( dirpath, file.name );
				if ( mainindex === fpath ) continue;

				const fitem = { name: toMenuName( file.name ), url: clearMenuPath( fpath ) };

				if ( file.isDirectory() ) {
					const children = await genMenulist( fpath );
					if ( !children.length ) continue;

					fitem.isdir = true;
					fitem.children = children;
				} else {
					if ( !isAllowedFile( file ) ) continue;

					const fdata = await fs.readFile( fpath, { encoding: 'utf8' } );

					// 파일 구문 분석 결과 false를 반환할 경우, list에 추가되지 않음
					// If file parsing returns false, it won't be added to the list
					if ( parseMenu( fitem, fdata ) === false ) continue;
				}
				mlist.push( fitem );
			}
			return sortMenu( mlist );

		} catch ( err ) {
			throw err;
		}
	} )( menudir );


	try {
		// menulist = JSON.stringify( sortMenu( menulist ), null, 2 );
		menulist = JSON.stringify( menulist, null, '\t' );

		await fs.mkdir( path.dirname( outpath ), { recursive: true } );
		await fs.writeFile( outpath, menulist, { encoding: 'utf8' } );

		// @:test log: styling json string
		console.log( menulist.replace( /^([\x20\t]*)("(?:\\.|[^"])*")(?=:)|"(?:\\.|[^"])*"|([[\]{}:,])/gm,
			( _, ws, nm, tr ) => {
				if ( nm ) return `${ ws }\x1b[96m${ nm }\x1b[0m`;
				if ( tr ) return `\x1b[90m${ tr }\x1b[0m`;
				return _;
		} ) );

	} catch ( err ) {
		throw err;
	}
}

buildProcess();
