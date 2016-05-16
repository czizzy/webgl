attribute vec4 a_Position;
attribute vec4 a_Color;

uniform mat4 u_xformMatrix;

varying vec4 v_Color;

void main() {
    gl_Position = u_xformMatrix * a_Position;
//    gl_PointSize = 1.0;
    v_Color = a_Color;
}