void main () {
    vec2 uv = uv(); vec2 uvN = uvN();
    float theta = atan(uv.x, uv.y)/PI2 +.5; float phi = log(length(uv)) * .5;
    vec3 c = black;

    float d = phi * fractal(rotate(uv, vec2(0.0, 0.), time * .1) * 6.5) - time * .5 + bands.x;
    c = sin( d * 11. + bands.y * orange);

    vec3 bb = texture2D(backbuffer, uvN).rgb;
    c = mix(c, bb, .94) + c * .3;


	gl_FragColor = vec4(c, 1.0);
}