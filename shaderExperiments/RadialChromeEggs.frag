void main () {
    vec2 st = uv(); vec2 stN = uvN();
    float theta = atan(st.x, st.y)/PI2 +.5; float phi = log(length(st)) * .5;
    vec3 c = black;

    float d = phi * voronoi(rotate(st, vec2(0.0, -2.), time * .1) * 7.) - time * .5 + bands.x;
    c = sin( d * 11. + bands.y * orange);

    vec3 bb = texture2D(backbuffer, stN).rgb;


	gl_FragColor = vec4(c, 1.0);
}