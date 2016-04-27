void main () {
    vec2 st = uv();
    vec2 stN = uvN();
    vec3 c = black;
    
    vec2 uu = cos((st) * (2.* bands.z));
    vec2 vv =  sin((st) * (2.* bands.y));
    float y = snoise(uu * mod(time * .2, 2.) );
    float x = snoise(vv * mod(time * .5, 3.));
    
    c = cos(blue  * y  * .0025 * time * bands.w + 1. );
    c += sin(red  * x  * .0015 * time * bands.z + .5 );
    
    c = step(.8, c);
    
	gl_FragColor = vec4(1.-c, 1.0);
}