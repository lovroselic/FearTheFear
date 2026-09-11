#version 300 es
///particle_render_fShader///
/*
* v1.0
*/

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D uSampler;
uniform int uRounded;

uniform sampler2D uNoise1;
uniform sampler2D uNoise2;
uniform sampler2D uNoise3;

uniform vec3 uNoiseScale;
uniform vec3 uScroll;
uniform float uTime;
uniform float uWarp;
uniform float uGate;

in vec2 v_uv;
in float v_age;

out vec4 outColor;

float random(float seed);

void main(void) {
    float a = 1.0f;

    if (uRounded == 1) {
        vec2 delta = v_uv - vec2(0.5f, 0.5f);
        float lenSqr = abs(dot(delta, delta));
        a = smoothstep(0.25f, 0.23f, lenSqr);
    }

    a -= v_age * v_age;
    if (a < 0.1f) {
        discard;
    }

    float r = random(v_age);
    float F = 4.0f;
    float L = max(r * (1.0f / F), 0.0f); // 0.25
    float H = min((r / F) + (1.0f - 1.0f / F), 1.0f); // 0.25 + 0.75
    vec2 texture_uv = vec2((1.0f - v_uv.x) * L + v_uv.x * H, (1.0f - v_uv.y) * L + v_uv.y * H);

    vec4 texelColor = texture(uSampler, texture_uv);
    outColor = vec4(texelColor.rgb, a);
}

float random(float seed) {
    vec2 st = gl_FragCoord.xy * seed;
    float a = 12.9898f;
    float b = 78.233f;
    float c = 43758.5453f;
    float dt = dot(st.xy, vec2(a, b));
    float sn = mod(dt, 3.14f);
    return fract(sin(sn) * c);
}