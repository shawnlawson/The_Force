precision lowp float;

uniform vec2      resolution;
uniform float     time;
uniform float     channelTime[4];
uniform vec4      mouse;
uniform vec4      date;
uniform vec3      channelResolution[4];
uniform vec4      bands;
uniform vec4      bandsTime;
uniform sampler2D backbuffer;

float PI = 3.14159;
float PI2 = 6.28318;

vec3 black = vec3(0.0);
vec3 white = vec3(1.0);
vec3 red = vec3(0.86,0.22,0.27);   
vec3 orange = vec3(0.92,0.49,0.07);
vec3 yellow = vec3(0.91,0.89,0.26);
vec3 green = vec3(0.0,0.71,0.31);
vec3 blue = vec3(0.05,0.35,0.65);
vec3 purple = vec3(0.38,0.09,0.64);
vec3 pink = vec3(.9,0.758,0.798);
vec3 lime = vec3(0.361,0.969,0.282);
vec3 teal = vec3(0.396,0.878,0.878);

vec2 uvN(){return (gl_FragCoord.xy / resolution);}
vec2 uv(){return (gl_FragCoord.xy / resolution * 2.0 -1.0) * vec2(resolution.x/resolution.y, 1.0);}  

float rand(float x) {
    return fract(sin(x)*4536.2346);
}
float rand(vec2 p) {
    return fract(sin(dot(p.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float box(vec2 p,vec2 b,float r,float f) {
    return smoothstep(f, 0.0, length(max(abs(p)-b,0.0))-r);
}

float circle(float x,float y,float r,float f) {
    float d=distance(uv(),vec2(x, y))/r;
    return 1.-smoothstep(r-f,r,d);
}

vec2 rotate(vec2 space, vec2 center, float amount){
    return vec2(cos(amount) * (space.x - center.x) + sin(amount) * (space.y - center.y),
        cos(amount) * (space.y - center.y) - sin(amount) * (space.x - center.x));
}

vec2 mod289(vec2 x) {
    return x - floor(x * (1.0/289.0)) * 289.0;
}
vec3 mod289(vec3 x) {
    return x - floor(x * (1.0/289.0)) * 289.0;
}

vec3 permute(vec3 x) {
    return mod289(((x*34.0)+1.0)*x);
}

const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
float snoise(vec2 v){
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

float turbulence(vec2 fragCoord, float octave)
{
    float col = 0.0;
    vec2 xy,frac, tmp1, tmp2;
    float i2, amp, maxOct = octave;
    for (int i = 0; i < 8; i++)
    {
        amp = maxOct / octave;
        i2 = float(i);
        xy = fragCoord / octave;
        frac = fract(xy);
        tmp1 = mod(floor(xy) + resolution.xy, resolution.xy);
        tmp2 = mod(tmp1 + resolution.xy - 1.0, resolution.xy);
        col += frac.x * frac.y * rand(tmp1) / amp;
        col += frac.x * (1.0 - frac.y) * rand(vec2(tmp1.x, tmp2.y)) / amp;
        col += (1.0 - frac.x) * frac.y * rand(vec2(tmp2.x, tmp1.y)) / amp;
        col += (1.0 - frac.x) * (1.0 - frac.y) * rand(tmp2) / amp;
        octave /= 2.0;
    }
    return (col);
}

float noise( vec2 point )
{
    vec2 p = floor( point );
    vec2 f = smoothstep(vec2(0.0), vec2(1.0), fract( point ));
    return mix(
        mix( rand( p + vec2( 0.0, 0.0 ) ), rand( p + vec2( 1.0, 0.0 ) ), f.x ),
        mix( rand( p + vec2( 0.0, 1.0 ) ), rand( p + vec2( 1.0, 1.0 ) ), f.x ),
        f.y
    );
}

float fractal( vec2 point )
{
    float sum = 0.0;
    float scale = 0.5;
    for ( int i = 0; i < 7; i++ )
    {
        sum += noise( point ) * scale;
        point *= 2.0;
        scale /= 2.0;
    }
    
    return sum;
}

float voronoi( vec2 x )
{
    vec2 p = floor( x );
    vec2  f = fract( x );

    float res = 0.0;
    for( int j=-1; j<=1; j++ ) {
        for( int i=-1; i<=1; i++ )
        {
            vec2 b = vec2( i, j );
            vec2  r = vec2( b ) - f + vec2(rand( p + b));
            float d = dot( r, r );
    
            res += exp( -32.0*d );
    }}
    return -(1.0/32.0)*log( res );
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 sexy(void) {
    float star=0.0;
    vec3 cr = black;
    for(int i = 0; i < 80; i++)
    {
    float tTime = float(i) * PI;
    vec2 p = vec2(rand(floor(-tTime * time*.005)), fract(time *0.1 +tTime));
    float   r = rand(uv().x);
    star= r*(0.3*sin(time * (r * 5.0) + 20.0 * r) + 0.25);
    cr += box(uvN()-p.yx, vec2(0.005, 0.01), 0.001, 0.0001) * star;
    cr += box(uvN()-p.yx * vec2(1.2, 3.0), vec2(0.005, 0.01), 0.001, 0.0001) * star;
    }
    return vec3(cr * 1.5);
}

vec2 nyanFrame(vec2 p, float rr) {
    float v = 40.0/256.0;
    p = clamp(p,0.0,1.0);
    p.x = p.x*v;
    p = clamp(p,0.0,1.0);
    float fr = floor( mod( 20.0*time+rr, 6.0 ) );
    p.x += fr*v;
    return p;
}