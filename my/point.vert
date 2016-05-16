attribute vec4 a_Position;
attribute vec4 a_Color;
attribute vec4 a_Normal;

uniform mat4 u_ProjMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ModelMatrix;
uniform mat4 u_NormalMatrix;

uniform vec3 u_LightPosition;
uniform vec3 u_LightColor;
// uniform vec3 u_LightDirection;
uniform vec3 u_AmbientLight;

varying vec4 v_Color;

void main() {
    vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
    vec4 vertexPosition = u_ModelMatrix * a_Position;
    vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));
    float nDotL = max(dot(lightDirection, normal), 0.0);
    vec3 diffuse = u_LightColor * vec3(a_Color) * nDotL;
    vec3 ambient = u_AmbientLight * a_Color.rgb;
    gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
//    gl_PointSize = 1.0;
//    v_Color = vec4(diffuse + ambient, a_Color.a);
        v_Color = vec4(diffuse, a_Color.a);
}
