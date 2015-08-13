
precision lowp float;

varying vec2 v_texCoord;

uniform vec2 resolution;
uniform sampler2D texture;
uniform vec4 edgeBlend;

uniform vec4 colorCurves;
// uniform vec2 u_scale;

void main()
{
    vec2 uv = gl_FragCoord.xy / resolution;
    vec4 color = texture2D(texture, v_texCoord);

    float c = smoothstep(edgeBlend.x+edgeBlend.y, edgeBlend.x-edgeBlend.y, uv.x) + 
              smoothstep(edgeBlend.z-edgeBlend.w, edgeBlend.z+edgeBlend.w , uv.x);

    color.rgb = pow(pow(color.rgb, colorCurves.rgb), colorCurves.aaa); //two pass rgb, then gamma

    gl_FragColor = mix(color, vec4(0,0,0,1), c);
    // gl_FragColor = vec4(u_scale, 0, 1);
}
