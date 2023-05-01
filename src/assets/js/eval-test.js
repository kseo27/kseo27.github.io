function evalUrlTest() {
	console.log('Global eval test complete.');
	alert('Global eval test complete.');
}
evalUrlTest();

window.$$$ = function() {
	console.log('eval-test log.');
}

console.log( document.currentScript );
console.log( document.scripts[ document.scripts.length - 1] );