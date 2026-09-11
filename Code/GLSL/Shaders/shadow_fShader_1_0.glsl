#version 300 es
///shadow_fShader///

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

in float vHeight;
out vec4 fragColor;

const float uShadowStrength = 0.75;         // 0..1, bigger = darker
const float uShadowFadePerY = 0.05;         // smaller = fades slower with height
const float uShadowMinFactor = 0.45;        // lower = darker possible

void main(void) {
    float fade = 1.0 / (1.0 + vHeight * uShadowFadePerY);                               //decaying function
    float strength = clamp(uShadowStrength * fade, 0.0, 0.95);
    float factor = max(1.0 - strength, uShadowMinFactor);

    fragColor = vec4(vec3(factor), 1.0);
    //fragColor = vec4(vec3(factor, 0, 0), 1.0);
}