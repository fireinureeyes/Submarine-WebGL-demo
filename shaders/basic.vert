attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform float group;

//pass to fragment shader
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 pos;

void main() {

    pos = vec3(model*vec4(position, 1));
    vUv = uv;

    if(group == 0.0 || group == 4.0){
      vNormal = (model * vec4(normal, 0.0)).xyz;
    } else {
      //vNormal = (normalMatrix*vec4(-normal, 1.0)).xyz;
      vNormal = (model * vec4(-normal, 0.0)).xyz;
    }

    gl_Position = projection * view * model * vec4(position, 1.);
}
