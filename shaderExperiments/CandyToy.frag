void main () {
    vec2 st = uv(); vec2 stN = uvN();
    vec3 c = purple * .3;

    st = rotate(st, vec2(0.), time);
    // float f = voronoi(st * 3. * bands.y + time) ;
    // c += step(bands.y, f) * teal;
    // when audio is on, uncomment the above two lines and comment out the below two lines
    float f = voronoi(st * 3.  + time) ;
    c += step(.5, f) * teal;


    st = rotate(st, vec2(0.), time);
    // float f2 = voronoi((st) * 3.1 * bands.z + time);
    // c += step(bands.z, f2) * pink;
    // when audio is on, uncomment the above two lines and comment out the below two lines
    float f2 = voronoi((st) * 3.1  + time);
    c += step(.5, f2) * pink;

    st = rotate(st, vec2(0.), time);
    // float f3 = voronoi(st * 3.2 * bands.w + vec2(0,time *2.));
    // c += step(bands.w, f3) * blue;
    // when audio is on, uncomment the above two lines and comment out the below two lines
    float f3 = voronoi(st * 3.2 + vec2(0,time *2.));
    c += step(.5, f3) * blue;


    gl_FragColor = vec4(c, 1.0);
}
