const path = require('path');
const context = process.cwd();
const rrestc = /^\.{2,}[\\/]/;
const rinvalid = /[\0:*?"<>|]|[^\\/]+\.+(?=[\\/]|$)/; // file/folder명의 시작과 끝에 공백문자는 invalid하지만 생략

const combinePath = ( ...paths ) => {
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
	let relpath = path.relative( context, paths );

	// 루트 경로를 실행 프로세스 경로로 제한
	// To restrict root path to running process path
	if ( rrestc.test( relpath ) ) {
		throw new Error( `The "${ paths }" path must be specified as a subpath of the running process` );
	}

	if ( invalid = rinvalid.exec( relpath ) ) {
		throw new SyntaxError( `Invalid path: "${ invalid[ 0 ] }" in "${ paths }"` );
	}

	return paths;
}

module.exports = {
	combinePath
};