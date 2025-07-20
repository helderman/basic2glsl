const basic = document.getElementById('basic');
const shader = document.getElementById('shader');
const clock = document.getElementById('clock');
const canvas = document.getElementById('canvas');
const sandbox = glsl.of(canvas);	// https://github.com/actarian/glsl-canvas/

window.setInterval(function() {
	clock.innerText = (sandbox.timer.current / 1000).toFixed(1);
}, 100);

function trans() {
	let prelude = document.getElementById('boilerplate1').innerText;
	let s = basic.value;

	// Remove leading/trailing whitespace and comments
	s = s.replace(/^\s*/gm, '');
	s = s.replace(/\s*'.*$/gm, '');

	// Outcomment unnecessary statements
	s = s.replace(/^end$|^nomainwin$|^scan$|^wait$|^.*\bProgName\$.*$/gmi, '//$&');

	s = s.replace(/\bAnd\b/gmi, '&&');
	s = s.replace(/\bNot\b/gmi, '!');
	s = s.replace(/\bOr\b/gmi, '||');
	s = s.replace(/\bAbs\b/gmi, 'abs');
	s = s.replace(/\bAcs\b/gmi, 'acos');
	s = s.replace(/\bAsn\b/gmi, 'asin');
	s = s.replace(/\bAtn\b/gmi, 'atan');
	s = s.replace(/\bCos\b/gmi, 'w_cos');
	s = s.replace(/\bExp\b/gmi, 'exp');
	s = s.replace(/\bInt\b/gmi, 'w_trunc');
	s = s.replace(/\bLog\b/gmi, 'log');
	s = s.replace(/\bMax\b/gmi, 'max');
	s = s.replace(/\bMin\b/gmi, 'min');
	s = s.replace(/\bSin\b/gmi, 'w_sin');
	s = s.replace(/\bTan\b/gmi, 'w_tan');

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

	// Declare variables
	const floats = s.match(/^\w+(?=\s*=)/gm);
	const vec3s = s.match(/^\w+(?=\$\s*=)/gm);
	if (floats && floats.length > 0) prelude += 'float ' + [...new Set(floats)].join(', ') + ';\n';
	if (vec3s && vec3s.length > 0) prelude += 'vec3 ' + [...new Set(vec3s)].join(', ') + ';\n';

	// Loop
	s = s.replace(/^Do$/gmi, 'for (int ii=0; ii<999; ii++) {');
	s = s.replace(/^(?:Do\s+)?While\b\s*(.*)$/gmi, 'for (int ii=0; ii<999; ii++) {\nif (!bool($1)) break;');
	s = s.replace(/^For\s+(\w+)\s*=+\s*(.*?)\s*\bTo\b\s*(.*)$/gmi, '{\nfloat $1 = w_for($2, $3);');
	s = s.replace(/^Next\b.*$|^End\s.*$|^Loop$|^Wend$/gmi, '}');
	s = s.replace(/^Loop\s+Until\b\s*(.*)$/gmi, 'if (bool($1)) break;\n}');
	s = s.replace(/^Exit\b.*$/gmi, 'break;');

	// Add trailing semicolon
	s = s.replace(/^\w+\s*=.*$/gm, '$&;');

	// Liberty BASIC streams
	s = s.replace(/^#w\s*"color\s+"\s*;\s*(.*?)\s*;\s*"\s+"\s*;\s*(.*?)\s*;\s*"\s+"\s*;\s*(.*?)$/gmi, 'w_color = vec4($1, $2, $3, 255) / 255.;');
	s = s.replace(/^#w\s*"line\s+"\s*;\s*(.*?)\s*;\s*"\s+"\s*;\s*(.*?)\s*;\s*"\s+"\s*;\s*(.*?)\s*;\s*"\s+"\s*;\s*(.*?)$/gmi, 'if (w_line($1, $2, $3, $4)) gl_FragColor = w_color;');
	s = s.replace(/^.*#w\b.*$/gmi, '//$&');

	shader.value = prelude + s + '\n}\n#endif\n}\n';
}

function run() {
	sandbox.load(shader.value);
}

function resetClock() {
	const t = sandbox.timer;
	t.start = t.previous = t.now();
	t.current = t.delay = 0;
	// TODO: update canvas to show frame 0 when resetting while paused
}

function pauseClock() {
	sandbox.toggle();
}

function loadBasic(id) {
	basic.value = document.getElementById(id).innerText;
}
