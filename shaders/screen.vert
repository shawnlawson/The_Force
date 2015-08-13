
precision lowp float;

attribute vec2 position;
attribute vec2 a_texCoord;

varying vec2 v_texCoord;

uniform vec2 translation;
uniform vec2 u_scale;
uniform float u_degrees;

void main()
{
	vec2 scaledPosition = position * u_scale;
	float angleInRadians = u_degrees * 3.14159 / 180.0;
	vec2 rotation = vec2(sin(angleInRadians), cos(angleInRadians));

	vec2 rotatedPosition = vec2(
		scaledPosition.x * rotation.y + scaledPosition.y * rotation.x,
		scaledPosition.y * rotation.y - scaledPosition.x * rotation.x);
    
    gl_Position = vec4( rotatedPosition + translation , 0, 1);
    
    v_texCoord = a_texCoord;
}