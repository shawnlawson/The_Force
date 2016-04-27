void main () {
    vec2 st = uv(); vec2 stN = uvN();
    float theta = atan(st.x, st.y)/PI2 +.5; float phi = log(length(st)) * .5;
    vec3 c = black;
    
    vec2 p = vec2(sin(stN.x * 1.), phi);
    float v = abs(snoise(time + p * 5. + 1. * bands.y)) * -2. + 1.;
    c =  hsv2rgb(vec3(v * bands.z, .9, 1.)) ;
    // c = c * vecv * .5;


    vec3 bb = v * texture2D(backbuffer, stN).rgb;
    c = mix(c, bb, .94) + c * .9;


    gl_FragColor = vec4(c, 1.0);
}