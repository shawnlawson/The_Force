void main () {
    vec2 uv = uv();
    vec2 uvN = uvN();
    vec3 c = black;
    
    float y = fractal(uv * .1);
    
    c = sin(yellow  * y  * .25 * time * bands.w + .5 );
    c += sin(orange  * uv.x * time * bands.z + .5 );
    
	gl_FragColor = vec4(c, 1.0);
}