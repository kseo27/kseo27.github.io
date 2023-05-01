// [expt] Build process experiments
const fs = require('fs').promises;
const path = require('path');
const context = process.cwd();

const combinePath = ( () => {
	const rrestc = /^\.{2,}[\\/]/;
	const rinv = /[\0:*?"<>|]|[^\\/]+\.+(?=\\|\/|$)/; // file/folder명의 시작과 끝에 공백문자는 invalid하지만 생략
	return ( ...paths ) => {
		if ( !paths.length ) {
			throw new TypeError( `combinePath requires at least 1 argument, but only 0 were passed` );
		}

		paths = path.join( context, paths.reduce( ( acc, cur ) => {

			// Check object parsed with path.parse()
			if ( typeof cur === 'object' ) cur = path.format( cur );

			if ( path.isAbsolute( cur ) && /^[^\\/]/.test( cur ) ) {
				cur = path.relative( path.join( context, acc ), cur );
			}

			return `${ acc }/${ cur }`;
		}, '' ) );

		let invalid;
		let relurl = path.relative( context, paths );

		// 루트 경로를 실행 프로세스 경로로 제한
		// To restrict root path to running process path
		if ( rrestc.test( relurl ) ) {
			throw new Error( `The "${ paths }" path must be specified as a subpath of the running process` );
		}

		if ( ( invalid = rinv.exec( relurl ) ) ) {
			throw new SyntaxError( `Invalid path: "${ invalid[ 0 ] }" in "${ paths }"` );
		}

		return paths;
	}
} )();

process.on( 'uncaughtException', (err) => {
	console.error( '\x1b[91m%s\x1b[0m', '[Build Exception]', err );
	process.exit( 1 );
} );

// *** Build Config
const menuPriority = {
	'assets': -8,
	'references': -9,
	'experiments': -10
}

const sortMenu = menulist => {
	return menulist.sort( ( a, b ) => {
		return ( menuPriority[ b.name.toLowerCase() ] || 0 )
			- ( menuPriority[ a.name.toLowerCase() ] || 0 );
	} );
}

console.log( '\x1b[34m====\x1b[96m [Build Processing] \x1b[34m============================================================\x1b[0m' );

// Stats {
// 	dev: 1888907383,
// 	mode: 16822,
// 	nlink: 1,
// 	uid: 0,
// 	gid: 0,
// 	rdev: 0,
// 	blksize: 4096,
// 	ino: 29273397578148836,
// 	size: 0,
// 	blocks: 8,
// 	atimeMs: 1671943612334.3708,
// 	mtimeMs: 1671943612333.3738,
// 	ctimeMs: 1671943612333.3738,
// 	birthtimeMs: 1671581259890.7185,
// 	atime: 2022-12-25T04:46:52.334Z,
// 	mtime: 2022-12-25T04:46:52.333Z,
// 	ctime: 2022-12-25T04:46:52.333Z,
// 	birthtime: 2022-12-21T00:07:39.891Z
// }


async function buildProcess() {
	const menudir = combinePath( '/pages' );
	const allowedExtensions = [ 'html?', 'tmpl' ];
	const rextensions = new RegExp( `\\.(?:${ allowedExtensions.join('|') })$`, 'i' );

	const clearMenupath = url => {
		if ( !url.startsWith( menudir ) ) return url;
		return url.slice( menudir.length ).replace( /^(?![\\/])|[\\/]+/g, '/' );
	}
	const parseMenu = ( menu, data ) => {
		console.log('[Parsing]: ' + menu.url, data.match(/^(?:[\S\s](?!\r?\n|$)){0,20}/)[0] + '...' );

		// Referred to selectivizr.js
		const _csscmnt = /(\/\*[^*]*\*+([^\/][^*]*\*+)*\/)\s*/g;
		const _rheadCmnt    = /^\s*<!--\s*((?:-(?!->)|[^-]>)+|[^->]+)*?-->/;
		const _rheadCmntTag = /@([\w\x20]*?)\s*:\s*([^@\r\n]+?)\s*(?=[@\r\n]|$)/gi;
		const _rhashTag     = /(?<=#)[^#]+?(?=\s*#|\s*$)/g;

		const rheadCmnt = /^\s*<!--((?:[^-]|-(?!->))*)-->/;
		const rheadCmntTag = /@([a-z][^\/\0>:\x20\t\r\n\f]*)\s*:?\s*((?:\\.|[^\\@;])+?)\s*(?=[@;]|(?:\r?\n){2}|$)/gi;

		// Referred to jQuery `Selector`
		const whitespace = `[\\x20\\t\\r\\n\\f]`;
		const identifier = `(?:\\\\[\\da-fA-F]{1,6}${ whitespace }?|\\\\[^\\r\\n\\f]|[\\w-]|[^\0-\\x7f])+`;
		const attributes = `\\[${ whitespace }*(${ identifier })(?:${ whitespace }*([*^$|!~]?=)${ whitespace }*`
					+ `(?:'((?:\\\\.|[^\\\\'])*)'|"((?:\\\\.|[^\\\\"])*)"|(${ identifier }))|)${ whitespace }*\\]`;


		const wsp    = `[\\x20\\t\\r\\n\\f]`; // whitespace

		const attrid = `[^\\x20\\t\\r\\n\\f\\/>"'=]+`; // Referred to Stack overflow /([^\x20\t\r\n\f\/>"'=]+)/;
		// single or double quoted attr value, can be multiline
		const attrqtd    = `'((?:\\\\.|[^\\\\'])*)'|"((?:\\\\.|[^\\\\"])*)"`; // [1]: single quoted value, [2]: double quoted value
		const attrs  = `${ wsp }*(${ attrid })(?:${ wsp }*=${ wsp }*` // [1]: attribute name
					+ `(?:${ attrqtd }|(${ attrid }))|)${ wsp }*`; // [2]|[3]|[4]: attribute value
			// + `(?:('|")((?:\\\\.|[^\\\\])*?)\\2|(${ attrid }))|)${ ws }*`, 'g' );


		// ? ([\w\W]*?) 형태로 attr을 감지할 경우 attr문자열 내부의 > (angle bracket)을 태그 끝으로 인식할 수 있다
		const rnode         = /<[a-z][^\/\0>\x20\t\r\n\f]*\b[\x20\t\r\n\f]*([\w\W]*?)>/g;
		const rnodeWithAttr = /<[a-z][^\/\0>\x20\t\r\n\f]*\b[\x20\t\r\n\f]+([\w\W]+?)>/g;

		const rattrs = new RegExp( attrs, 'g' );
		let mat, mat2;
		// while ( ( mat = rnodeWithAttr.exec( data ) ) ) {
		// 	console.log( '  ', JSON.stringify( mat[ 0 ] ) );
		// 	let i = 1;
		// 	while ( ( mat2 = rattrs.exec( mat[ 1 ] ) ) ) {
		// 		console.log( '    ', i++, JSON.stringify(mat2[1]), JSON.stringify( /* mat2[2] || */ mat2[3] || mat2[4] ) );
		// 	}
		// }


		// literal variable content: [^<\\`;]|<(?!\/)

		// const shallowAttrs = `${ws}*${attrid}(?:${ws}*=${ws}*(?:'(?:\\\\.|[^\\\\'])*'|"(?:\\\\.|[^\\\\"])*"|${attrid})|)${ws}*`;
		const shallowAttrs = `[^\\/>"']+|'(?:\\\\.|[^\\\\'])*'|"(?:\\\\.|[^\\\\"])*"`;

		const tags = `<!--[\\S\\s]*?-->|<(style|script|[a-z][^\\/\\0>\\x20\\t\\r\\n\\f]*)\\b((?:${shallowAttrs})*)\\/?>`;
		// [1]: tagName, [2]: attributes

		const tagConts = '((?:[^<]+|<(?!\\/?[a-z]))*)';
		// const tagConts = '((?:[^<]+|<(?!\/?[a-z]))*(?:<\/[a-z][^\/\0>\x20\t\r\n\f]*>))';

		const rtag = new RegExp( tags, 'gi' );

		const tmplLi = /`(?:\\.|[^\\`$])*/g;

		const literals = /('|")(?:\\?.)*?(?:\1|\r?\n)|`(?:\\.|[^\\`$]|\$(?!\{))*(?:`|(\$\{))/g;

		const testContent = /(?<=>)([\x20\t\r\n\f]*(?:<+(?!\/?[a-z])|`(?:(?:\\.|[^\\`])*)`|'(?:(?:\\.|[^\\'])*)'|"(?:(?:\\.|[^\\"])*)"|[^<\x20\t\r\n\f]+))+[\x20\t\r\n\f]*(?=<)/ig;

		const rnodeContents = /(?<=>)(?:<(?![a-z][^\/\0>\x20\t\r\n\f]*\b[\x20\t\r\n\f]*[\w\W]*?>)|(?<!<[a-z][^\/\0>\x20\t\r\n\f]*\b[\x20\t\r\n\f]*[\w\W]*?)>|[^<>]+)+(?=<)/g;


		const htmcmnt = `<!--((?:[^-]|-(?!->))*)-->`; // [1]: comment content
		const nameid = `[a-z][^\\/\\0>:\\x20\\t\\r\\n\\f]*`; // name identifier
		const htmcont = `(?:[^<]|<(?!\\/?[a-z]))`; // html content
		const rtags = new RegExp( `${ htmcmnt }|<(style|script|${ nameid })\\b((?:${ shallowAttrs })*)\\/?>(?=(${ htmcont }*)(?:<\\/\\2>)?)`, 'gi' );
		// [1]: comment content,  [2]: tag name,  [3]: attributes all,  [4]: tag content

		let matches, tempdata;
		while ( matches = rtags.exec( data ) ) {
			console.log( '\x1b[92m%s \x1b[90m%s\x1b[0m', `<${ matches[1] !== undefined ? 'comment' : matches[2] }>`, matches[0] );

			if ( matches[ 1 ] !== undefined ) { // match comment
				continue;
			}

			let tagname = matches[ 2 ].toLowerCase();

			if ( tagname === 'title' ) {
				// let titleContent = data.slice( rtag.lastIndex ).match( /^(?:[^<]+|<(?!\/?[a-z]))+/ )?.[ 0 ];
				// rtag.lastIndex += titleContent?.length >> 0;

				console.log('  ', matches[ 4 ]?.trim() );

			} else if ( tagname === 'meta' ) {

				let match, property, content;
				while ( match = rattrs.exec( matches[ 3 ] ) ) {
					// console.log( '    ', i++, JSON.stringify(match[1]), JSON.stringify( /* match[2] || */ match[3] || match[4] ) );
					if ( match[ 1 ] === 'property' ) {
						property = ( match[ 2 ] || match[ 3 ] || match[ 4 ] )?.replace( /^kj:|[\S\s]*/, '' );
					} else if ( match[ 1 ] === 'content' ) {
						content =  ( match[ 2 ] || match[ 3 ] || match[ 4 ] );
					}
				}

				// @:test log
				if ( property ) console.log( `${ property }: "${ content }"` );

			} else if ( tagname === 'style' ) {
				let cssmat;
				let cssContent = data.slice( rtags.lastIndex );

				const cssNs = `[^'"<\\/]|<(?!\\/)|\\/(?!\\*)`;
				const cssComment = `\\/\\*(?:[^*]|\\*(?!\\/))*\\*\\/`;
				const cssLiteral = `'(?:\\\\.|[^\\\\'\\r\\n\\f])*'|"(?:\\\\.|[^\\\\"\\r\\n\\f])*"`;
				const rcssc = new RegExp( `^(?:${cssNs}|${cssComment}|${cssLiteral})+` );

				if ( ( cssmat = rcssc.exec( cssContent ) ) ) {
					// console.log('CSS');
					console.log( cssmat[ 0 ] );
					rtags.lastIndex += cssmat[ 0 ].length;
				}

			} else if ( tagname === 'script' ) {
				let scmat;
				let scriptContent = data.slice( rtags.lastIndex );

				const scComment = `\\/\\*(?:[^*]|\\*(?!\\/))*\\*\\/|\\/\\/[^\\r\\n\\f]*(?=[\\r\\n\\f]|$)`; // \/\*(?:[^*]+|\/*(?!\/))*\*\/|\/\/[^\r\n\f]*
				const scString  = `'(?:\\\\.|[^\\\\'\\r\\n\\f])*'|"(?:\\\\.|[^\\\\"\\r\\n\\f])*"`;
				const scTmplli  = '`(?:\\\\.|[^\\\\`$]|\\$(?!\\{))*`';
				const scInterp  = '`(?:\\\\.|[^\\\\`$]|\\$(?!\\{))*(\\$\\{)';
				const scLiteral = `'(?:\\\\.|[^\\\\'\\r\\n\\f])*'|"(?:\\\\.|[^\\\\"\\r\\n\\f])*"|\`(?:\\\\.|[^\\\\\`$]|\\$(?!\\{))*(?:\`|(\\$\\{))`;
				// nonspecific
				const scNs = `[^'"\`<\\/]|<(?!\\/)|\\/(?!\\*|\\/)`;

				// const rscc = /^(?:\/\*(?:[^*]+|\/*(?!\/))*\*\/|\/\/[^\r\n\f]*|[^'"`<\/]+|'(?:\\.|[^\\'\r\n\f])*'|"(?:\\.|[^\\"\r\n\f])*"|<(?!\/)|\/(?!\*|\/))+/g;
				const _rscc = new RegExp( `^(?:(?:${scNs})+|${scComment}|${scLiteral})` );
				const rscc = new RegExp( `^(?:(?:${scNs}|${scComment}|${scString}|${scTmplli})+|${scInterp})` );
				// const rscc = new RegExp( `^(?:${scNs}|${scComment}|${scString}|${scTmplli})+(?:${scInterp})?` );

				// Check for nested braces within interpolation //! [^'"\`\\/{};]+ 플러스 기호로 극도의 성능 저하가 일어남
				const braces = new RegExp( `^(?:[^'"\`\\/{};]|\\/(?!\\*|\\/)|${scComment}|${scString}|${scTmplli})*(?:${scInterp}|(\\{)|(\\}))` );

				// /^(?:[^'"`\/{};]|\/(?!\/|\*)|\/\*(?:[^*]|\*(?!\/))*\*\/|\/\/[^\r\n\f]*(?=[\r\n\f]|$)|'(?:\\.|[^\\'\r\n\f])*'|"(?:\\.|[^\\"\r\n\f])*")*(?:(\{)|(\}))/
				// `^(?:[^'"\`\\/{};]+|\\/(?!\\*|\\/)|${scComment}|${scString})*(?:(\\{)|(\\}))`

				function getNestedBraces( content ) { // ! incomplete
					let match, interp, depth = 0, result = '';

					while ( ( match = braces.exec( content ) ) ) {
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

				// const rinnertli = /^(?:[^`;]|`(?:\\.|[^\\`$]|\$(?!\{))*`)*?(?:(`(?:\\.|[^\\`$]|\$(?!\{))*\$\{)|(\}(?:\\.|[^\\`$]|\$(?!\{))*`))/;
				const rinnertli = /^(?:[^`;]*?(?:(\})|`)(?:\\.|[^\\`$]|\$(?!\{))*(?:`|(\$\{)))/;

				function getInnerTemplate( content ) {
					let match, nested, depth = 1, result = '';
					const rinner = /^(?:[^`;]*?(?:(\})|`)(?:\\.|[^\\`$]|\$(?!\{))*(?:`|(\$\{)))/;

					while ( depth && ( match = rinner.exec( content ) ) ) {

						// TODO: func nested braces, return matched tmpl;
						if ( ( nested = getNestedBraces( content ) ) ) {
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

				// @:test log
				let testlog = '';

				while ( ( scmat = rscc.exec( scriptContent ) ) ) {
					// let scLength = scmat[ 0 ].length;
					scriptContent = scriptContent.slice( scmat[ 0 ].length );

					// @:test log
					testlog += `\x1b[96m${ scmat[ 0 ].slice( 0, scmat[ 1 ] && -2 ) }\x1b[91m${ scmat[ 1 ] || '' }\x1b[0m`;
					// console.log('[-- content --]');
					// console.log( `\x1b[96m%s\x1b[91m%s\x1b[0m`, scmat[ 0 ].slice( 0, scmat[ 1 ] && -2 ), scmat[ 1 ] || '' );

					if ( scmat[ 1 ] ) { // template literal interpolation

						let inner = getInnerTemplate( scriptContent );

						// @:test log
						testlog += `\x1b[33m${ inner }\x1b[0m`;

						// let testlog = getInnerTemplate( scriptContent );
						// console.log( '\x1b[93m%s\x1b[0m', testlog );
						// scriptContent = scriptContent.slice( testlog.length );
						scriptContent = scriptContent.slice( inner.length );
					}
				}
				// @:test log
				console.log( testlog );

				rtags.lastIndex = ( data.length - scriptContent.length );
			}
		}



		var rstring  = /('|")(\\{2}|\\\1|.)*?(?:\1|(?=[\r\n\f]|$))/g;
		var rsingleTag = ( /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i );
		var rbody = /\x3Cbody\b[^>]*?>(?:\s*?(?:\n|\r\n?))*([\S\s]*?)(?:\s*?(?:\n|\r\n?))*\x3C\/body>/i;
		var rtagName = ( /<([a-z][^\/\0>\x20\t\r\n\f]*)/i );

		const rinnertag = /[^<>'"]+|<(?![a-z][^\/\0>\x20\t\r\n\f]*\b(?:))/

		const rmeta = /^(?:\s*<!?[a-z][^\/\0>:])/g;

		// let matched, match, hashtags;
		// if ( ( matched = data.match( rheadCmnt ) ) && ( matched = matched[ 1 ] ) ) {
		// 	while ( ( match = rheadCmntTag.exec( matched ) ) ) {
		// 		if ( match[ 1 ] == 'title' ) {
		// 			menu.title = match[ 2 ];
		// 		} else if ( match[ 1 ] == 'search' ) {
		// 			hashtags = match[ 2 ].match( rhashTag );
		// 			menu.search = hashtags?.length ? hashtags : null;
		// 		}

		// 		console.log( match );
		// 	}
		// }


		// '#asdf tag #fdsa'.match(/@#[^#]+?(?=\s*#|\s*$)/g)?.length || null

		// // let match = data.match( rheadCmnt );
		// if ( match ) {
		// 	// console.log( match[0], match[1] );
		// 	console.log( match );
		// }

		// let match;
		// while ( ( match = rheadCmnt.exec( data ) ) ) {
		// 	console.log( match[1] );
		// }

	}



	let resultList = await ( async function parseMenuList( dirpath ) {
		try {
			const menuList = [];
			const files = await fs.readdir( dirpath, { withFileTypes: true } );

			for ( const file of files ) {
				const filepath = path.join( dirpath, file.name );
				const item = { name: file.name, url: clearMenupath( filepath ) };

				if ( file.isDirectory() ) {
					const children = await parseMenuList( filepath );

					if ( !children.length ) continue;

					item.children = children;

				} else {
					if ( !rextensions.test( file.name ) ) continue;

					const data = await fs.readFile( filepath, { encoding: 'utf8' } );
					parseMenu( item, data );

					// @:temp log
					// console.log(file.name + ' --- ' + data.match(/^(?:[\S\s](?!\r?\n|$)){0,20}/)[0] );
				}

				menuList.push( item );
			}

			return menuList;

		} catch ( err ) {
			throw err;
		}
	} )( menudir );


	try {
		resultList = JSON.stringify( sortMenu( resultList ), null, 2 );

		//! const output = path.parse( 'pages.json' );
		//! if ( !/^(?:\.|\\|\/)*$/.test( output.dir ) ) {
		//! 	await fs.mkdir( combinePath( output.dir ), { recursive: true } );
		//! }
		//! await fs.writeFile( combinePath( output ), resultList, { encoding: 'utf8' } );

		// @:temp log
		console.log();
		console.log(resultList);

	} catch ( err ) {
		throw err;
	}

	// try {
	// 	const data = await fs.readFile( path.join( context, '/pages/template-test.tmpl' ), { encoding: 'utf8' } );
	// 	console.log(data);
	// } catch (err) {
	// 	console.log(err);
	// }
}

buildProcess();


// fs.lstat( combine('/src/assets'), ( err, stats ) => {
// 	if ( err ) return console.log( err );
// 	console.log(stats);
// } );

// fs.stat( combine('src/assets'), ( err, files ) => {
// 	console.log( combine('src/assets') );
// 	if ( err ) {
// 		return console.log( 'Unable to scan directory:\n', err );
// 	}

// 	console.log(files);

// 	// files.forEach(( file ) => {
// 	// 	console.log( file );
// 	// } );
// } );
