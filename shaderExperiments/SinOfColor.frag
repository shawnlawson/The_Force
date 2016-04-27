void main () {
    vec2 st = uv();
    vec2 stN = uvN();
    vec3 c = black;
    
    float y = noise(st * .1);
    
    c = sin(yellow  * y  * .25 * time * bands.w + .5 );
    c += sin(orange  * st.x * time * bands.z + .5 );
    
	gl_FragColor = vec4(c, 1.0);
}