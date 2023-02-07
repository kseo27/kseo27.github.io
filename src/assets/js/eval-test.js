function evalUrlTest() {
	alert('Global eval test complete.');
}
evalUrlTest();

console.log( document.currentScript );
console.log( document.scripts[ document.scripts.length - 1] );