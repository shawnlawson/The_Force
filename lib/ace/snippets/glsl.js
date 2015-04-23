ace.define("ace/snippets/glsl",["require","exports","module"], function(require, exports, module) {
"use strict";

exports.snippetText ="## Shapes\n\
# box\n\
snippet box\n\
	box(vec2($1, $2), vec2($3, $4), ${5: float}, ${6:float})${7}\n\
# circle\n\
snippet cir\n\
	circle(${1:float}, ${2:float}, ${3:float}, ${4:float})${5}\n\
##\n\
## Compile Helpers\n\
# if false\n\
snippet iff\n\
	if (false) {\n\
		${1}\n\
	}\n\
##\n\
## Loops\n\
# for integer\n\
snippet fori\n\
	for (int i = 0; i < ${1:int}; i++) {\n\
		${2}\n\
	}${3}\n\
# for float\n\
snippet forf\n\
	for (float i = 0.0; i < ${1:float}; i++) {\n\
		${2}\n\
	}${3}\n\
\n\
";
exports.scope = "glsl";

});
