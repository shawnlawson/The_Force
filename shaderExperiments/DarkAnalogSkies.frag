void main () {
    vec2 uv = uv(); vec2 uvN = uvN();
    float theta = atan(uv.x, uv.y)/PI2 +.5; float phi = log(length(uv)) * .8;
    vec3 c = black;

    float f = fractal(vec2(uv.y + bands.y, time));
    f = pow(f, 9.) * 15.;
    float f2 = fractal(vec2(uv.y + bands.z, time));
    f2 = pow(f2, 9.) * 15.;
    float f3 = fractal(vec2(uv.y + bands.w, time));
    f3 = pow(f3, 9.) * 15.;

    c += f * blue + f2 * yellow + f3 * red;
    
    float ff = fractal(rotate(uvN * 5., vec2(5., 5.), time * .1));
    //  c =  step(bands.x, ff);
    c *= ff;
    //  c *=  ff * 30.;

    vec3 bb =  texture2D(backbuffer, uvN).rgb;
    c = mix(c, bb, .0) + c * .0;

	gl_FragColor = vec4(c, 1.0);
}