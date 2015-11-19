void main () {
    vec2 uv = uv(); vec2 uvN = uvN();
    float theta = atan(uv.x, uv.y)/PI2 +.5; float phi = log(length(uv)) * .5;
    vec3 c = black;

    float d = phi * voronoi(rotate(uv, vec2(0.0, -2.), time * .1) * 7.) - time * .5 + bands.x;
    c = sin( d * 11. + bands.y * orange);

    vec3 bb = texture2D(backbuffer, uvN).rgb;


	gl_FragColor = vec4(c, 1.0);
}