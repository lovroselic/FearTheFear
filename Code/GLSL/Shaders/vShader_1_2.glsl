#version 300 es
///vShader///
/*
* v1.2 Taxxon
*/
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

in vec4 aVertexPosition;
in vec3 aVertexNormal;
in vec2 aTextureCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uScale;
uniform mat4 uTranslate;
uniform mat4 uRotateY;

out vec2 vTextureCoord;
out vec3 FragPos;
out vec3 v_normal;

void main(void) {
    mat4 model = uTranslate * uRotateY * uScale;
    vec4 worldPos = model * aVertexPosition;
    gl_Position = uProjectionMatrix * uModelViewMatrix * worldPos;
    vTextureCoord = aTextureCoord;
    FragPos = worldPos.xyz;

    mat3 normalMat = transpose(inverse(mat3(model)));
    v_normal = normalize(normalMat * aVertexNormal);
}