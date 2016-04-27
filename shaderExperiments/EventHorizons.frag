void main () {
    vec2 st = uv(); vec2 stN = uvN();
    float theta = atan(st.x, st.y)/PI2 +.5; float phi = log(length(st)) * .8;
    vec3 c = black;

    for (int i = 0; i < 100; i++) {
        float tt = float(i) * PI;
        float x = fract(tt) * 4. - 2.;
        float y = rand(floor(tt * time * .01)) * 2. - 1.;
        
        vec2 s = vec2 (phi, st.y);
        s = rotate(s, vec2(sin(time)), time * 5.);
        
        c += box(s-vec2(x, y), vec2(.01, .01), .0001 + .2 * bands.y, .01) * teal;
        c += box(s-vec2(x, y), vec2(.001, .001) * 1.5 * bands.x, .0001 + .01 * bands.y, .1) * white;
        
    }
 
    c = c * sin(c * orange + time) * bands.z;
    vec3 bb =  texture2D(backbuffer, stN).rgb;
    c = mix(c, bb, .9) + c * .1;

	gl_FragColor = vec4(c, 1.0);
}