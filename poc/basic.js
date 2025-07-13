// https://github.com/patriciogonzalezvivo/glslCanvas
const basic = document.getElementById('basic');
const glsl = document.getElementById('glsl');
const clock = document.getElementById('clock');
const canvas = document.getElementById('canvas');
const sandbox = new GlslCanvas(canvas);

window.setInterval(function() {
	clock.innerText = ((performance.now() - sandbox.timeLoad) / 1000).toFixed(1);
}, 100);

translate();
run();

function translate() {
	let prelude =
		'// Start boilerplate code ------------------------------------------\n' +
		'#ifdef GL_ES\nprecision mediump float;\n#endif\n' +
		'uniform vec2 u_resolution;\nuniform float u_time;\n' +
		'float DisplayWidth = u_resolution.x, DisplayHeight = u_resolution.y;\n' +
		'float trunc(float x){return x>0.?floor(x):ceil(x);}\n' +
		'// End boilerplate code --------------------------------------------\n';
	let s = basic.value;

	// Remove leading/trailing whitespace and comments
	s = s.replace(/^\s*/gm, '');
	s = s.replace(/\s*'.*$/gm, '');

	// Eliminate outer loops - tailored for Eric's fractal
	s = s.replace(/^For\s+(a)\b.*$/gmi, '$1 = 1.5*u_resolution.x - gl_FragCoord.x\n{');
	s = s.replace(/^For\s+(b)\b.*$/gmi, '$1 = 1.5*u_resolution.y - gl_FragCoord.y\n{');

	// Outcomment unnecessary statements
	s = s.replace(/^end$|^nomainwin$|^scan$|^wait$|^.*\bProgName\$.*$/gmi, '//$&');

	s = s.replace(/\bAnd\b/gmi, '&&');
	s = s.replace(/\bOr\b/gmi, '||');
	s = s.replace(/\bAbs\b/gmi, 'abs');
	s = s.replace(/\bCos\b/gmi, 'cos');
	s = s.replace(/\bSin\b/gmi, 'sin');
	s = s.replace(/\bInt\b/gmi, 'trunc');

	// Make sure every numeric literal has a decimal point
	s = s.replace(/\b(?<!\.)(\d+)\b(?!\.)/gm, '$&.');

	// Remove $ from variable name
	s = s.replace(/\$/gm, '');

	// If
	s = s.replace(/^If\b\s*(.*?)\s*\bThen$/gmi, 'if (bool($1)) {');
	s = s.replace(/^If\b\s*(.*?)\s*\bThen\b\s*(.+)$/gmi, 'if (bool($1)) {\n$2\n}\n');

	// Replace = with ==
	s = s.replace(/^(\w+\s*)=/gm, '$1<assign>');
	s = s.replace(/=/gm, '==');
	s = s.replace(/<assign>/gm, '=');

	// Loop
	s = s.replace(/^Do$/gmi, 'for (int ii=0; ii<999; ii++) {');
	s = s.replace(/^Do\s+While\b\s*(.*)$/gmi, 'for (int ii=0; ii<999; ii++) {\nif (!bool($1)) break;');
	s = s.replace(/^For\s+(\w+)\s*=\s*(.*?)\s*\bTo\b\s*(.*)$/gmi, 'for ($1 = $2; $1 <= $3; $1++) {');
	s = s.replace(/^Next\b.*$|^End\s.*$|^Loop$/gmi, '}');
	s = s.replace(/^Loop\s+Until\b\s*(.*)$/gmi, 'if (bool($1)) break;\n}');
	s = s.replace(/^Exit\b.*$/gmi, 'break;');

	// Add trailing semicolon
	s = s.replace(/^\w+\s*=.*$/gm, '$&;');

	// Libery BASIC streams
	//s = s.replace(/^#w\s*"fill\s+black"$/gmi, 'gl_FragColor.rgb = vec3(0);');
	s = s.replace(/^#w\s*"color\s+"\s*;\s*(.*?)\s*;\s*"\s+"\s*;\s*(.*?)\s*;\s*"\s+"\s*;\s*(.*?)$/gmi, 'gl_FragColor.rgb = vec3($1, $2, $3) / 255.;');
	s = s.replace(/^.*#w\b.*$/gmi, '//$&');

	// Declare variables
	const floats = s.match(/^\w+(?=\s*=)/gm);
	const vec3s = s.match(/^\w+(?=\$\s*=)/gm);
	if (floats && floats.length > 0) prelude += 'float ' + [...new Set(floats)].join(', ') + ';\n';
	if (vec3s && vec3s.length > 0) prelude += 'vec3 ' + [...new Set(vec3s)].join(', ') + ';\n';

	glsl.value = prelude + 'void main() {\ngl_FragColor = vec4(0,0,0,1);\n' + s + '}\n';
}

function run() {
	sandbox.load(glsl.value);
}

function resetClock() {
	sandbox.timeLoad = performance.now();
}
