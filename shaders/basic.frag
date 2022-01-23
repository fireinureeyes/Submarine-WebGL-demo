/*
#ifdef GL_ES
precision highp float;
#endif
*/

precision highp float;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform float group;
uniform float lightsOn;


// Material properties
uniform vec3 ambientColor;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform vec3 emission;
uniform float shininess;

//Directional light
uniform vec3 lightDirection;
uniform float ambientLight;

//texture
uniform sampler2D diffuse;

//in from vertex shader
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 pos;

//light properties
struct Light {
  vec4 position;
	vec4 ambient;
	vec4 diffuse;
	vec4 specular;
  float constantAttenuation, linearAttenuation, quadraticAttenuation;
  float spotCutoff, spotExponent;
  vec3 spotDirection;
};

const int numberOfPointLights = 2;
Light lights[numberOfPointLights];

Light rLight = Light (
  vec4(0.8, 0.8, -5.0, 1.0),
  vec4(2.5, 2.0, 1.2, 1.0),
  vec4(2.5, 2.0, 1.2, 1.0),
  vec4(2.5, 2.0, 1.2, 1.0),
  0.0, 0.15, 0.0,
  110.0, 20.0,
  vec3(0.0, 1.0, -5.0)
);

Light lLight = Light (
  vec4(-0.8, 0.8, -5.0, 1.0),
  vec4(2.5, 2.0, 1.2, 1.0),
  vec4(2.5, 2.0, 1.2, 1.0),
  vec4(2.5, 2.0, 1.2, 1.0),
  0.0, 0.15, 0.0,
  110.0, 20.0,
  vec3(0.0, 1.0, -5.0)
);

void main() {

  lights[0] = rLight;
  lights[1] = lLight;

  vec3 lightDir;
  float attenuation;
  vec4 position = vec4(pos, 1.0);
  vec3 sceneDiff = texture2D(diffuse, vUv).rgb;

  //Calculate directional light
  vec3 N = normalize(vNormal);
  vec3 L = normalize(lightDirection - pos);

  //Lambert's cosine law
  float lambertian = max(dot(N,L), 0.0);

  float specular = 0.0;

  if(lambertian > 0.0){
    vec3 R = reflect(-L, N); //reflected light vector
    vec3 V = normalize(-pos);

    //Compute specular term
    float specAngle = max(dot(R, V), 0.0);
    specular = pow(specAngle, shininess);
  }

  float lightness = -clamp(dot(normalize(vNormal), normalize(lightDirection)), -1., 0.);
  lightness = ambientLight + (1. - ambientLight) * lightness;

  //calculate color with directional lighting
  vec3 directionalLight = vec3((texture2D(diffuse, vUv).rgb)*lightness+lambertian*diffuseColor+specular*specularColor);

  //Calculate point lights
  vec3 normalDirection = normalize(vNormal);
  vec3 viewDirection = normalize(vec3(vec4(0.0, 0.0, 0.0, 1.0) - position));

  //add directional lighting to total lighting
  vec3 totalLighting = directionalLight;

  for(int i = 0; i < numberOfPointLights; i++) {
    vec3 positionToLightSource = vec3(lights[i].position - position);
    float distance = length(positionToLightSource);
    lightDir = normalize(positionToLightSource);

    attenuation = 1.0 / (lights[i].constantAttenuation
   			       + lights[i].linearAttenuation * distance
   			       + lights[i].quadraticAttenuation * distance * distance);

   	 if (lights[i].spotCutoff <= 90.0) { // if spotlight
   	     float clampedCosine = max(0.0, dot(-lightDirection, normalize(lights[i].spotDirection)));
   	     if (clampedCosine < cos(radians(lights[i].spotCutoff))) // outside of spotlight cone?
   		{
   		  attenuation = 0.0;
   		} else {
   		  attenuation = attenuation * pow(clampedCosine, lights[i].spotExponent);
   		}
   	 }

    //attenuation = (1.0 / (distance*0.18));
    float lambertian = max(dot(normalDirection, positionToLightSource), 0.0);

    vec3 diffuseReflection = attenuation
    * vec3(lights[i].diffuse) * vec3(diffuseColor) * max(0.0, dot(normalDirection, lightDir));

    vec3 specularReflection;
    if(dot(normalDirection, lightDir) < 0.0){ //if light on the wrong side
      specularReflection = vec3(0.0, 0.0, 0.0);
    } else {
      specularReflection = attenuation * vec3(lights[i].specular) * vec3(specularColor)
      * pow(max(0.0, dot(reflect(-lightDir, normalDirection), viewDirection)), shininess);
    }

    totalLighting = totalLighting + diffuseReflection + specularReflection;
  }

  if(group == 3.0){
    gl_FragColor = vec4((texture2D(diffuse, vUv).rgb*3.5), 1.0); //city, no lights
  } else {
    if(lightsOn == 1.0) {
        gl_FragColor = vec4((totalLighting), 1.0);
    } else {
       //end of scene, turn the lights off
       gl_FragColor = vec4(directionalLight, 1.0);
    }
    if(group == 4.0) { //make submarine and propeller darker
      gl_FragColor = vec4(gl_FragColor.rgb*0.75, 1.0);
    }
  }

  //phong and directional light only:
  //gl_FragColor = vec4(directionalLight, 1.0);
  //texture + lightness only
  //gl_FragColor = vec4((texture2D(diffuse, vUv).rgb)*lightness, 1.0);
}
