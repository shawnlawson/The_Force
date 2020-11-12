ace.define("ace/snippets/glsl",["require","exports","module"], function(require, exports, module) {
"use strict";

exports.snippets =[
	{
		name: "box shape",
	  	tabTrigger: "box",
	  	content: "box(vec2($1, $2), vec2($3, $4), ${5: float}, ${6:float})${7}"
	},
	{
		name: "circle shape",
	  	tabTrigger: "circle",
	  	content: "circle(${1:float}, ${2:float}, ${3:float}, ${4:float})${5}"
	},
	{
		name: "hsv to rgb color space",
	  	tabTrigger: "hsv2",
	  	content: "hsv2rgb(${1:vec3})"
	},
	{
		name: "kaleidoscope",
	  	tabTrigger: "kale",
	  	content: "kale(${1:vec2}, ${2:float})"
	},
	{
		name: "rotate",
	  	tabTrigger: "rot",
	  	content: "rotate(${1:vec2}, ${2:vec2}, ${3:float})${4}"
	},
	{
		name: "random",
	 	tabTrigger: "rand",
	 	content: "rand(${1:float_or_vec2})$2"
	},
	{
		name: "noise 0 to 1",
	 	tabTrigger: "noise",
	 	content: "noise(${1:float_or_vec2_or_vec3})$2"
	},
	{
		name: "signed noise -1 to 1",
	 	tabTrigger: "snoise",
	 	content: "snoise(${1:vec2_or_vec3})$2"
	},
	{
		name: "voronoi",
	 	tabTrigger: "voronoi",
	 	content: "voronoi(${1:vec2_or_vec3})${2}"
	},
	{
		name: "fractal Brownian motion",
	 	tabTrigger: "fbm",
	 	content: "fbm(${1:float_or_vec2_or_vec3}, ${2:int})$3"
	},
	{
		name: "ridged multi-fractal",
	 	tabTrigger: "rmf",
	 	content: "rmf(${1:vec2}, ${2:int})$3"
	},
	{
		name: "voronoi fractal Brownian motion",
	 	tabTrigger: "vfbm",
	 	content: "vfbm(${1:vec2}, ${2:int})$3"
	},
	{
		name: "voronoi ridged multi-fractal",
	 	tabTrigger: "vrmf",
	 	content: "vrmf(${1:vec2}, ${2:int})$3"
	},
	{
		name: "update nyan animation frame",
	 	tabTrigger: "nyan",
	 	content: "nyanFrame(${1:vec2}, ${2:float})$3"
	},
	{
		name: "radians",
		tabTrigger: "radians",
		content: "radians(${1})${2}"
	},
	{
		name: "degrees",
		tabTrigger: "degrees",
		content: "degrees(${1})${2}"
	},
	{
		name: "sine",
		tabTrigger: "sin",
		content: "sin(${1})${2}"
	},
	{
		name: "cosine",
		tabTrigger: "cos",
		content: "cos(${1})${2}"
	},
	{
		name: "tangent",
		tabTrigger: "tan",
		content: "tan(${1})${2}"
	},
	{
		name: "asin",
		tabTrigger: "asin",
		content: "asin(${1})${2}"
	},
	{
		name: "acos",
		tabTrigger: "acos",
		content: "acos(${1})${2}"
	},
	{
		name: "atan",
		tabTrigger: "atan",
		content: "atan(${1})${2}"
	},
	{
		name: "pow",
		tabTrigger: "pow",
		content: "pow(${1})${2}"
	},
	{
		name: "exp",
		tabTrigger: "exp",
		content: "exp(${1})${2}"
	},
	{
		name: "log",
		tabTrigger: "log",
		content: "log(${1})${2}"
	},
	{
		name: "exp2",
		tabTrigger: "exp2",
		content: "exp2(${1})${2}"
	},
	{
		name: "log2",
		tabTrigger: "log2",
		content: "log2(${1})${2}"
	},
	{
		name: "sqrt",
		tabTrigger: "sqrt",
		content: "sqrt(${1})${2}"
	},
	{
		name: "inversesqrt",
		tabTrigger: "inversesqrt",
		content: "inversesqrt(${1})${2}"
	},
	{
		name: "abs",
		tabTrigger: "abs",
		content: "abs(${1})${2}"
	},
	{
		name: "sign",
		tabTrigger: "sign",
		content: "sign(${1})${2}"
	},
	{
		name: "floor",
		tabTrigger: "floor",
		content: "floor(${1})${2}"
	},
	{
		name: "ceil",
		tabTrigger: "ceil",
		content: "ceil(${1})${2}"
	},
	{
		name: "fract",
		tabTrigger: "fract",
		content: "fract(${1})${2}"
	},
	{
		name: "mod",
		tabTrigger: "mod",
		content: "mod(${1}, ${2})${3}"
	},
	{
		name: "min",
		tabTrigger: "min",
		content: "min(${1}, ${2})${3}"
	},
	{
		name: "max",
		tabTrigger: "max",
		content: "max(${1}, ${2})${3}"
	},
	{
		name: "clamp",
		tabTrigger: "clamp",
		content: "clamp(${1}, ${2}, ${3})${4}"
	},
	{
		name: "mix",
		tabTrigger: "mix",
		content: "mix(${1}, ${2}, ${3})${4}"
	},
	{
		name: "step",
		tabTrigger: "step",
		content: "step(${1}, ${2})${3}"
	},
	{
		name: "smoothstep",
		tabTrigger: "smoothstep",
		content: "smoothstep(${1}, ${2})${3}"
	},
	{
		name: "length",
		tabTrigger: "length",
		content: "length(${1})${2}"
	},
	{
		name: "distance",
		tabTrigger: "distance",
		content: "distance(${1}, ${2})${3}"
	},
	{
		name: "dot",
		tabTrigger: "dot",
		content: "dot(${1}, ${2})${3}"
	},
	{
		name: "cross",
		tabTrigger: "cross",
		content: "cross(${1}, ${2})${3}"
	},
	{
		name: "normalize",
		tabTrigger: "normalize",
		content: "normalize(${1})${2}"
	},
	{
		name: "faceforward",
		tabTrigger: "faceforward",
		content: "faceforward(${1}, ${2})${3}"
	},
	{
		name: "reflect",
		tabTrigger: "reflect",
		content: "reflect(${1}, ${2})${3}"
	},
	{
		name: "refract",
		tabTrigger: "refract",
		content: "refract(${1}, ${2}, ${3:float})${4}"
	},
	{
		name: "texture",
		tabTrigger: "texture2D",
		content: "texture2D(${1:sampler2D}, ${2:vec2})${3}"
	},
	{
		name: "vc",
	 	tabTrigger: "vc",
	 	content: "vec2"
	},
	{
		name: "vvc",
	 	tabTrigger: "vvc",
	 	content: "vec3"
	},
	{
		name: "ft",
	 	tabTrigger: "ft",
	 	content: "float"
	},
	{
		name: "compile, but do not run",
	 	tabTrigger: "iff",
	 	content: "if (false) {\n\t${1}\n}"
	 },
	{
		name: "for loop with int",
		tabTrigger: "fori",
		content: "for (int i = 0; i < ${1:int}; i++) {\n\t${2}\n}${3}"
	},
	{
		name: "for loop with float",
	 	tabTrigger: "forf",
		content: "for (float i = 0.0; i < ${1:float}; i++) {\n\t${2}\n}${3}"
	}
]
exports.scope = "glsl";

});
