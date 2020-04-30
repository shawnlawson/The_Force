void main () {
    vec2 st = uv();
    vec2 stN = uvN();
    vec3 c = black;

    float y = noise(st * .1);

    // c = sin(yellow  * y  * .25 * time * bands.w + .5 );
    // c += sin(orange  * st.x * time * bands.z + .5 );
    // when audio is on, uncomment the above two lines and comment out the below two lines
    c = sin(yellow  * y  * .25 * time  + .5 );
    c += sin(orange  * st.x * time  + .5 );

    gl_FragColor = vec4(c, 1.0);
}
