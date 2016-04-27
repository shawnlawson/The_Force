void main () {
    vec2 st = uv(); vec2 stN = uvN();
    float bx = bands.x;    
    
    vec3 c = black;;
    float v = abs(1.  - bandsTime.z );
    
    st = rotate(st, vec2(0.), 160.);
    float theta = atan(10. * bands.y, 0.);
    st.y = theta * 10.;
    c = purple + voronoi(st * 3. + sin(time + fract(rand(time)) * .001) * 2.) * white * 3. * bands.y ;
    
    // st = rotate(st, vec2(0.), 60.);
    theta = atan(10. * bands.z, st.x);
    st.y = theta * 10.;
    c += voronoi(st * 3. + cos(time * 2.)) * green * 3.  * bands.z;
    
    vec2 offset = vec2(log(time), cos(time)) ;
    offset = vec2(.5);
    vec3 bb = texture2D(backbuffer, (stN - offset)  + offset).rgb;
    
    c = mix(c, bb, .7);
    
    
	gl_FragColor = vec4(c, 1.0);
}