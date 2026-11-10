#version 300 es
///model_vShader///
/*
* v1.2 Haunting the Hauntessa
* v1.3 Fear the Fear
*/
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

const int MAX_JOINTS = 160;                             //it needs to have same number as ENGINE.INI.MAX_JOINTS!!!! default1 60

in vec4 aVertexPosition;
in vec3 aVertexNormal;
in vec2 aTextureCoord;
in vec4 aJoint;
in vec4 aWeight;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uScale;
uniform mat4 uTranslate;
uniform mat4 uRotateY;
uniform mat4 u_jointMat[MAX_JOINTS];

out vec2 vTextureCoord;
out vec3 FragPos;
out vec3 v_normal;

void main(void) {
    mat4 skinMat = aWeight.x * u_jointMat[int(aJoint.x)] +
        aWeight.y * u_jointMat[int(aJoint.y)] +
        aWeight.z * u_jointMat[int(aJoint.z)] +
        aWeight.w * u_jointMat[int(aJoint.w)];

    mat4 model = uTranslate * uRotateY * uScale;
    vec4 worldPos = model * skinMat * aVertexPosition;                              // world position includes skinning AND object placement.

    gl_Position = uProjectionMatrix * uModelViewMatrix * worldPos;
    vTextureCoord = aTextureCoord;

    FragPos = worldPos.xyz;                                                         // lighting and occlusion require WORLD coordinates.

    mat3 normalMat = transpose(inverse(mat3(model * skinMat)));
    v_normal = normalize(normalMat * aVertexNormal);
}