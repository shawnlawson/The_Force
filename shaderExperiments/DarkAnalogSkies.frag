void main () {
    vec2 st = uv(); vec2 stN = uvN();
    float theta = atan(st.x, st.y)/PI2 +.5; float phi = log(length(st)) * .8;
    vec3 c = black;

    // float f = noise(vec2(st.y + bands.y, time));
    // when audio is on, uncomment the above line and comment out the below line
    float f = noise(vec2(st.y + .3, time));
    f = pow(f, 9.) * 15.;
    // float f2 = noise(vec2(st.y + bands.z, time));
    // when audio is on, uncomment the above line and comment out the below line
    float f2 = noise(vec2(st.y  + .2, time));
    f2 = pow(f2, 9.) * 15.;
    // float f3 = noise(vec2(st.y + bands.w, time));
    // when audio is on, uncomment the above line and comment out the below line
    float f3 = noise(vec2(st.y, time));
    f3 = pow(f3, 9.) * 15.;

    c += f * blue + f2 * yellow + f3 * red;

    float ff = noise(rotate(stN * 5., vec2(5., 5.), time * .1));
    c *= ff;

    vec3 bb =  texture2D(backbuffer, stN).rgb;
    c = mix(c, bb, .0) + c * .0;

    gl_FragColor = vec4(c, 1.0);
}
