void main () {
    vec2 st = uv(); vec2 stN = uvN();
    float bx = bands.x;    
    
    float v = abs(1.  - bandsTime.z * .1);
    
    st += time * .003;
    
    st = rotate(st, vec2(0, sin(bands.y)), time );
    
    vec3 c = fbm(st, 5) * white;
    
    c = smoothstep(v, v - .1, c);
    
    vec3 bb = texture2D(backbuffer, (stN * 2.) - vec2(.5)).rgb;
    
    c = mix(c, bb, .5);
    
	gl_FragColor = vec4(c, 1.0);
}