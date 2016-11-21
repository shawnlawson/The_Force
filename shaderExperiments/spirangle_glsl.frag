void main () {
    vec2 p = uv() * 20.;
	float t, theta = atan(p.x, p.y); 
	vec3 c = vec3(0);
    
    vec2 pr = rotate(p, vec2(0),   PI2/3.);
    vec2 pl = rotate(p, vec2(0), - PI2/3.);

    float l = clamp( sign(-theta )        * sign(theta+PI2/2.4), 0., 1.);
    float r = clamp( sign(-theta - .001)  * sign(theta-PI2/3.), 0., 1.);
    float b = clamp( sign(theta - PI2/3.) * sign(theta+PI2/3.), 0., 1.);
    
    if(p.y > -1.5) {
        b *= 1. - l* step(.5, - pl.y);
    } else if(p.y > -2.5) {
        b *= 1. - l * step(1.5, - pl.y);
        t = atan(p.x, p.y - 1.);
    } else if(p.y > -3.5) {
        b *= 1. - l * step(2.5, - pl.y);
        t = atan(p.x, p.y - 4.);
    } else if(p.y > -4.5){
        b *= 1. - l * step(3.5, - pl.y);
        t = atan(p.x, p.y - 5.);
    } else if(p.y > -5.5){
        b *= 1. - l * step(4.5, - pl.y);
        t = atan(p.x, p.y - 7.);
    } 
  
    if(pl.x < 0. && pl.y > -.5)
        l *= 0.;

    l *= 1. - clamp(sign(t) * sign(t+PI2/2.4), 0., 1.) * step(1.5, -p.y);
    
    b = b * step(.6, fract(p.y + .1))   * step(1.0, -p.y);
    r = r * step(.6, fract(pr.y + .1))  * step(1.0, -pr.y);
    l = l * step(.6, fract(pl.y + .1));

    c += min((b+r+l), 1.) * vec3(1);
    c *= step(-5.5, p.y) * step(-5.5, pr.y) * step(-5.5, pl.y);
    
	gl_FragColor = vec4(c, 1.0);
}
