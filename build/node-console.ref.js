/**
 * @:Ref Console Style & Colors
 * * prefix: `\x1b[`,  affix: `m`,  separator: `%s`,  e.g. `\x1b[31m%s\x1b[0m`
 *
 * [Styling]   Reset: 0, Bright(Bold): 1, Dim(Faint): 2, Italic: 3, Underscore: 4, Blink: 5, Reverse: 7, Hidden: 8
 * [Fg Color]  Black: 30,  Red: 31,  Green: 32,  Yellow: 33,  Blue: 34,  Magenta: 35,  Cyan: 36,  White: 37
 * [Bg Color]  Black: 40,  Red: 41,  Green: 42,  Yellow: 43,  Blue: 44,  Magenta: 45,  Cyan: 46,  White: 47
 * [Bright Fg] Black(Gray): 90,  Red: 91,  Green: 92,  Yellow: 93,  Blue: 94,  Magenta: 95,  Cyan: 96,  White: 97
 * [Bright Bg] Black(Gray): 100, Red: 101, Green: 102, Yellow: 103, Blue: 104, Magenta: 105, Cyan: 106, White: 107
 *
 * ! `\x1b[0m` 코드로 항상 Reset해 주지 않으면 다음 출력에도 영향을 미친다
 */


// Styling with templates
console.log( '\x1b[34m====\x1b[96m [Process Start] \x1b[34m============================================================\x1b[0m' );

console.log( 'If you don\'t reset to the `\\x1b[0m` code each time, it will affect the next output.' )


// Styling with separator
console.log( '\x1b[94m%s\x1b[90m%s\x1b[0m', 'Loading Process', ' with CLI Preloader' );

console.log( 'Check that the above styling code affects the following output.' );


// Loading in console/terminal
let loader = ( () => {
	const p = [ '\\', '|', '/', '-' ];
	let i = 0;
	return setInterval( () => {
		process.stdout.write( `\r\x1b[93mProcess in progress.. \x1b[1m${ p[ i++ ] }\x1b[0m\r` );
		i %= p.length;
	}, 200 );
} )();

setTimeout( () => {
	clearInterval( loader );
	process.stdout.clearLine();
	console.log( '\x1b[92mProcess Complete.\x1b[0m' );
	process.exit( 0 );
}, 3000 );
