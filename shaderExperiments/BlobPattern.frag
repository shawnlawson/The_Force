void main () {
    vec2 st = uv();
    vec2 stN = uvN();
    vec3 c = black;

    // vec2 uu = cos((st) * (10.* bands.z));
    // vec2 vv =  sin((st) * (10.* bands.y));
    // when audio is on, uncomment the above two lines and comment out the below two lines
    vec2 uu = cos((st) * (10.));
    vec2 vv =  sin((st) * (10.));
    float y = snoise(uu * mod(time * .2, 1.) );
    float x = snoise(vv * mod(time * .5, 1.));

    // c = cos(blue  * y  * .0025 * time * bands.w + 1. );
    // c += sin(red  * x  * .0015 * time * bands.z + .5 );
    // when audio is on, uncomment the above two lines and comment out the below two lines
    c = cos(blue  * y  * .0025 * time + 1. );
    c += sin(red  * x  * .0015 * time + .5 );

    c = step(.95, c);

    gl_FragColor = vec4(c, 1.0);
}
