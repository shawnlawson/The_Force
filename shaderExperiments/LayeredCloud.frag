void main () {
    vec2 st = uv(); vec2 stN = uvN();

    st += time * .003;

    // st = rotate(st, vec2(0, sin(bands.y)), time );
    // when audio is on, uncomment the above line and comment out the below line
    st = rotate(st, vec2(0, sin(time)), time );

    vec3 c = fbm(st, 5) * white;

    c = smoothstep(.4, .5 , c);

    vec3 bb = texture2D(backbuffer, (stN * 2.) - vec2(.5)).rgb;

    c = mix(c, bb, .5);

    gl_FragColor = vec4(c, 1.0);
}
