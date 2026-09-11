#version 300 es
///shadow_vShader///

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

const int MAX_JOINTS = 160;

in vec4 aVertexPosition;
in vec4 aJoint;
in vec4 aWeight;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

uniform mat4 uScale;
uniform mat4 uTranslate;
uniform mat4 uRotateY;
uniform mat4 u_jointMat[MAX_JOINTS];

// Shadow controls
uniform float uShadowPlaneY;            // floor height under ship (WORLD y)
uniform vec3  uShipWorldPos;            // ship WORLD position (same space as planeY)

out float vHeight;

//bloody hardcoded constants
const float uShadowBias = 0.01;        // tiny lift to avoid z-fighting (0.01)
const float uShadowShrinkPerY = 0.2;    // shrink with height factor (0.2)

void main(void) {
    // Skinning
    mat4 skinMat =
        aWeight.x * u_jointMat[int(aJoint.x)] +
        aWeight.y * u_jointMat[int(aJoint.y)] +
        aWeight.z * u_jointMat[int(aJoint.z)] +
        aWeight.w * u_jointMat[int(aJoint.w)];

    vec4 skinned = skinMat * aVertexPosition;

    // World position 
    vec4 world4 = uTranslate * uRotateY * uScale * skinned;
    vec3 worldPos = world4.xyz;

    const vec3 dir = vec3(0.0, -1.0, 0.0);                              //down

    float t = (uShadowPlaneY - worldPos.y) / dir.y;                               // Project vertex to plane y = uShadowPlaneY along dir, dir.y = -1
    vec3 projPos = worldPos + dir * t;
    projPos.y = uShadowPlaneY + uShadowBias;

    float t0 = (uShadowPlaneY - uShipWorldPos.y) / dir.y;                         // Project ship center to same plane, so we shrink around it
    vec3 center = uShipWorldPos + dir * t0;
    center.y = uShadowPlaneY + uShadowBias;                                       // constraint to shadow plane.y

    float height = max(uShipWorldPos.y - uShadowPlaneY, 0.0);                // shrink with height above that plane
    float s = 1.0 / (1.0 + height * uShadowShrinkPerY);
    projPos.xz = center.xz + (projPos.xz - center.xz) * s;

    vHeight = height;                                                             // to fShader

    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(projPos, 1.0);
}