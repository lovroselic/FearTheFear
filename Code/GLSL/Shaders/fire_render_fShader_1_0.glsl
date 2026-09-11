#version 300 es
///fire_render_fShader///
/*
* v1.0 — fire-only fragment shader (scrolling-noise warp + alpha gate)
*/

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

// base sprite 
uniform sampler2D uSampler;
uniform int uRounded;

uniform sampler2D uNoise1;
uniform sampler2D uNoise2;
uniform sampler2D uNoise3;

uniform vec3      uNoiseScale;      
uniform vec3      uScroll;          
uniform float     uTime;            
uniform float     uWarp;           
uniform float     uGate;            

in vec2  v_uv;
in float v_age;
out vec4 outColor;

float random(float seed) {
    vec2 st = gl_FragCoord.xy * seed;
    float a = 12.9898, b = 78.233, c = 43758.5453;
    float dt = dot(st, vec2(a, b));
    float sn = mod(dt, 3.14);
    return fract(sin(sn) * c);
}

void main(void) {
    float a = 1.0;

    // rounded billboard alpha
    if (uRounded == 1) {
        vec2 d = v_uv - vec2(0.5);
        float lenSqr = dot(d, d);
        a = smoothstep(0.25, 0.23, lenSqr);
    }

    // age-driven fade 
    a -= v_age * v_age;
    if (a < 0.1) {
        discard;
    }

    // center-crop flicker 
    float r = random(v_age);
    const float F = 4.0;
    float L = max(r * (1.0 / F), 0.0);
    float H = min((r / F) + (1.0 - 1.0 / F), 1.0);
    vec2 uvCrop = vec2(
        (1.0 - v_uv.x) * L + v_uv.x * H,
        (1.0 - v_uv.y) * L + v_uv.y * H
    );

    // three scrolling noises (V scroll); combine
    vec2 uv1 = uvCrop * uNoiseScale.x + vec2(0.0, uTime * uScroll.x);
    vec2 uv2 = uvCrop * uNoiseScale.y + vec2(0.0, uTime * uScroll.y);
    vec2 uv3 = uvCrop * uNoiseScale.z + vec2(0.0, uTime * uScroll.z);

    float n1 = texture(uNoise1, uv1).r;
    float n2 = texture(uNoise2, uv2).r;
    float n3 = texture(uNoise3, uv3).r;
    float n  = (n1 + n2 + n3) * (1.0 / 3.0);

    // warp UV with two channels, gate alpha with the combined noise
    vec2 warp = vec2(n1, n2) - 0.5;         // [-0.5..0.5]^2
    vec2 fireUV = uvCrop + warp * uWarp;

    vec4 texel = texture(uSampler, fireUV);

    // gate alpha to break up edges (thresholds are artistic)
    float gate = smoothstep(0.35, 0.95, n);
    a *= mix(1.0, gate, uGate);

    outColor = vec4(texel.rgb, a);
}
