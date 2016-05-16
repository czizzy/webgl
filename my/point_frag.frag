precision mediump float;
varying vec4 v_Color;
varying vec3 v_Position;
varying vec3 v_Normal;

uniform vec3 u_LightPosition;
uniform vec3 u_LightColor;
uniform vec3 u_AmbientLight;

void main() {
     vec3 normal = normalize(v_Normal);
     vec3 lightDirection = normalize(u_LightPosition - v_Position);
     float nDotL = max(dot(lightDirection, normal), 0.0);
     vec3 diffuse = v_Color.rgb * u_LightColor * nDotL;
     vec3 ambient = u_AmbientLight * v_Color.rgb;
     gl_FragColor = vec4(diffuse + ambient, v_Color.a);
}
