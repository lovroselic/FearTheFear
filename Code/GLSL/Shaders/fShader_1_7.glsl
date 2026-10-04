#version 300 es
///fShader///
/*
* v1.7
* DownHeel - specular fixes + corrected high-resolution occlusion raycast
* FearTheFear - light strengths for point light, raycast end voxel bug correction
*               halo correction
*               backward ambient and diffusion optimization 
*
* Occlusion notes:
* - uOcclusionResolution = texels per world/grid unit.
* - Raycast3D now walks in OCCLUSION TEXTURE SPACE, not world grid space.
* - Bounds are read from textureSize(uOcclusionMap, 0).
* - uGridSize is kept for JS compatibility, but occlusion bounds no longer depend on it.
* 
* artitstry has precedence over physics
*/

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
precision highp sampler3D;
#else
precision mediump float;
precision mediump sampler3D;
#endif

struct Material {
    vec3 ambientColor;
    vec3 diffuseColor;
    vec3 specularColor;
    float shininess;

                                                                // roughness:
                                                                //   0.05 = very shiny
                                                                //   0.25 = leather / satin
                                                                //   0.65 = neutral old-material fallback
                                                                //   0.90 = matte cloth
                                                                //
                                                                // metallic:
                                                                //   0.0 = normal material
                                                                //   1.0 = metal
                                                                //
                                                                // fresnelStrength:
                                                                //   0.0 = disabled / neutral
                                                                //   0.15 - 0.35 = useful shiny edge boost

    float roughness;
    float metallic;
    float fresnelStrength;
};

const int N_LIGHTS = 1;                                         // replaced before compiling

uniform vec3 uPointLights[N_LIGHTS];
uniform vec3 uLightColors[N_LIGHTS];
uniform vec3 uLightDirections[N_LIGHTS];
uniform float uLightAmbientStrength[N_LIGHTS];
uniform float uLightDiffuseStrength[N_LIGHTS];
uniform float uLightSpecularStrength[N_LIGHTS];

uniform sampler2D uSampler;
uniform vec3 uCameraPos;
uniform Material uMaterial;

uniform sampler3D uOcclusionMap;
                                                                // Occlusion bounds now use textureSize(uOcclusionMap, 0).
uniform vec3 uGridSize;                                         // Kept for compatibility with existing JS.

uniform vec2 uOcclusionOrigin;                                  // world X/Z origin of the occlusion texture
uniform float uOcclusionResolution;                             // texels per world/grid unit

uniform float innerAmbientStrength;
uniform float innerDiffuseStrength;
uniform float innerSpecularStrength;
uniform bool uUnlitTexture;                                     // returns just texel colour

in vec3 FragPos;                                                // WORLD space
in vec3 v_normal;                                               // WORLD space
in vec2 vTextureCoord;

const vec3 innerLightColor = vec3(1.0f, 1.0f, 1.0f);
const vec3 GLOBAL_AMBIENT = vec3(0.05f);
const float DEFAULT_ROUGHNESS = 0.65f;
const float MIN_ROUGHNESS = 0.04f;
const float IGNORE_ALPHA = 0.1f;

                                                                // Increased because DDA now walks occlusion texels.
                                                                // At resolution 4, a ray may need roughly 4x more steps than before.
const int MAX_STEPS = 4096;

const float EPSILON = 0.005f;
const float PL_AMBIENT_OCCLUSION = 0.10f;
const float PL_DIFFUSE_OCCLUSION = 0.02f; //0.10
const float PL_AMBIENT_ILLUMINATION_REDUCTION = 0.02f;
const float PL_DIFUSSE_ILLUMINATION_REDUCTION = 0.05f;
const float PL_DIFUSSE_LIGHT_HALO_REDUCTION = 0.25f;
const float ATTNF = 0.3f;
const float ATTNF2 = 0.8f;
const float HATTNF = 1.5f;
const float HATTNF2 = 6.0f;
const float MAXLIGHT = 0.999f;
const float IGNORED_ATTN_DISTANCE = 0.012f;
const float ILLUMINATION_CUTOFF = 0.10f;
const float BEHIND_LIGHT_FACTOR = 0.02f;

                                                                // Additional distance fade for the existing weak rear/side ambient.
                                                                // The fade multiplier is 1 at/below START and 0 at/above END.
                                                                // Existing distance attenuation is still applied separately.
                                                                // Distances are in world/grid units from the Y-adjusted emitter position.
const float BACK_GLOW_FADE_START = 0.25f;
const float BACK_GLOW_FADE_END = 0.75f;
const float DISTANCE_LIGHT = 0.25f;
const float LIGHT_POS_Y_OFFSET = 0.35f;
const float HALO_FADE_START = DISTANCE_LIGHT * 0.5f;
const float CONE_FADE_HALF_WIDTH = 0.05f;

                                                                // Replaces INTO_WALL; the endpoint now moves OUT of the surface.
                                                                // Small world-space offset along the outward receiving normal.
const float RAY_TARGET_BIAS = 0.01f;
const float RAY_ORIGIN_BIAS = EPSILON * 5.0f;

const float METALLIC_DIFFUSE_REDUCTION = 0.65f;
const float VIEW_DIFFUSE_FILL = 0.05f;                          // 5% camera-facing fill, 95% light-facing diffuse.

out vec4 fragColor;

// ----------------------------------------------------------------------------
// Function prototypes
// ----------------------------------------------------------------------------

float getMaterialRoughness();

vec3 CalcLight(
    vec3 lightPosition,
    vec3 FragPos,
    vec3 viewDir,
    vec3 normal,
    vec3 pointLightColor,
    float shininess,
    vec3 ambientColor,
    vec3 diffuseColor,
    vec3 specularColor,
    float roughness,
    float metallic,
    float fresnelStrength,
    float ambientStrength,
    float diffuseStrength,
    float specularStrength,
    int inner,
    vec3 lightDirection,
    vec3 baseColor,
    out vec3 specularOut
);

bool Raycast3D(vec3 rayOrigin3D, vec3 rayTarget3D, vec3 surfaceNormal);
bool isOmniDirectional(vec3 dir);

ivec3 getOcclusionTextureSize();
bool isOcclusion3D();
vec3 worldToOcclusionCoord(vec3 position3D);
bool isOccludedTexel(ivec3 texel);

// ----------------------------------------------------------------------------

void main(void) {
    vec4 texelColor = texture(uSampler, vTextureCoord);

    if (texelColor.a < IGNORE_ALPHA)
        discard;

    if (uUnlitTexture) {
        fragColor = texelColor;
        return;
    }

    vec3 baseColor = texelColor.rgb;

    vec3 ambientColor = uMaterial.ambientColor;
    vec3 diffuseColor = uMaterial.diffuseColor;
    vec3 specularColor = uMaterial.specularColor;
    float shininess = uMaterial.shininess;
    float roughness = getMaterialRoughness();
    float metallic = uMaterial.metallic;
    float fresnelStrength = uMaterial.fresnelStrength;

    vec3 norm = normalize(v_normal);
    vec3 viewDir = normalize(uCameraPos - FragPos);
    vec3 specularTotal = vec3(0.0f);
    vec3 specularPart = vec3(0.0f);

    // Inner light from camera position.
    vec3 innerLight = CalcLight(uCameraPos, FragPos, viewDir, norm, innerLightColor, shininess, ambientColor, diffuseColor, specularColor, roughness, metallic, fresnelStrength, innerAmbientStrength, innerDiffuseStrength, innerSpecularStrength, 1, viewDir, baseColor, specularPart);

    specularTotal += specularPart;

    vec3 PL_output = vec3(0.0f);

    for (int i = 0; i < N_LIGHTS; i++) {
        if (uPointLights[i].x < 0.0f)
            continue;

        PL_output += CalcLight(uPointLights[i], FragPos, viewDir, norm, uLightColors[i], shininess, ambientColor, diffuseColor, specularColor, roughness, metallic, fresnelStrength, uLightAmbientStrength[i], uLightDiffuseStrength[i], uLightSpecularStrength[i], 0, uLightDirections[i], baseColor, specularPart);
        specularTotal += specularPart;
    }

    vec3 nonSpecularLight = innerLight + PL_output;
    vec3 diffuseFinal = baseColor * max(nonSpecularLight, GLOBAL_AMBIENT);                 // Texture color affects ambient/diffuse.
    vec3 finalColor = diffuseFinal + specularTotal;                                             // Specular is added separately so shiny highlights remain visible.

    fragColor = vec4(clamp(finalColor, 0.0f, 1.0f), texelColor.a);     // final fragment color
}

// ----------------------------------------------------------------------------
// Material helpers
// ----------------------------------------------------------------------------

float getMaterialRoughness() {
    if (uMaterial.roughness <= 0.0f)
        return DEFAULT_ROUGHNESS;

    return clamp(uMaterial.roughness, MIN_ROUGHNESS, 1.0f);
}

// ----------------------------------------------------------------------------
// Lighting
// ----------------------------------------------------------------------------

vec3 CalcLight(
    vec3 lightPosition,
    vec3 FragPos,
    vec3 viewDir,
    vec3 normal,
    vec3 pointLightColor,
    float shininess,
    vec3 ambientColor,
    vec3 diffuseColor,
    vec3 specularColor,
    float roughness,
    float metallic,
    float fresnelStrength,
    float ambientStrength,
    float diffuseStrength,
    float specularStrength,
    int inner,
    vec3 lightDirection,
    vec3 baseColor,
    out vec3 specularOut
) {
    specularOut = vec3(0.0f);

    if (inner == 0)
        lightPosition.y -= LIGHT_POS_Y_OFFSET;

    float lightPosDistance = distance(lightPosition, FragPos);
    float backGlow = 1.0f - smoothstep(BACK_GLOW_FADE_START, BACK_GLOW_FADE_END, lightPosDistance);         // Radial fade on top of the existing attenuation. Only the directional-light rear/low-illumination ambient paths use it.
    vec3 lightToFrag = normalize(FragPos - lightPosition);                                                               // light -> fragment
    vec3 fragToLight = -lightToFrag;                                                                                       // fragment -> light
    vec3 dirLight = normalize(lightDirection   );
    float invDistance = 1.0f / (lightPosDistance + EPSILON);
    float attenuation = invDistance / (ATTNF + ATTNF2 * lightPosDistance);

    // -------------------- directional cone illumination --------------------

    float cone = 1.0f;

    if (inner == 0 && !isOmniDirectional(lightDirection)) {
        cone = dot(lightToFrag, dirLight);
    }

    vec3 ambientLight = vec3(0.0f);

                                                                                                                            // If fragment is behind the directional light, return only tiny ambient, no occlusion.
    if (inner == 0 && !isOmniDirectional(lightDirection) && cone < -ILLUMINATION_CUTOFF) {
                                                                                                                            // Keep the local supporting-wall glow, but fade distant spill.
                                                                                                                            // Occlusion remains bypassed here for the wall behind the offset decal.
        ambientLight = pointLightColor * ambientStrength * attenuation * ambientColor * BEHIND_LIGHT_FACTOR * backGlow;
        return ambientLight;
    }

    
    bool occluded = false;                                                                                                 // Occlusion only meaningful for non-inner light.

    if (inner == 0) {
        // normal is the normalized world-space receiving normal.
        occluded = Raycast3D(lightPosition, FragPos, normal);
    }

    // -------------------- ambient --------------------

    if (inner == 1) {
        ambientLight = pointLightColor * ambientStrength * ambientColor;                                                    // inner light doesn' have attenuation
    } else {
        ambientLight = pointLightColor * ambientStrength * attenuation * ambientColor;
    }

    // -------------------- diffuse --------------------

    float diffLight = max(dot(normal, fragToLight), 0.0f);
    float diffView = max(dot(normal, viewDir), 0.0f);
    float diff = mix(diffLight, diffView, VIEW_DIFFUSE_FILL);
    vec3 diffuselight = pointLightColor * diff * diffuseStrength * attenuation * diffuseColor;
    diffuselight *= 1.0f - metallic * METALLIC_DIFFUSE_REDUCTION;

    // -------------------- specular --------------------

    float gloss = 1.0f - roughness;
    float maxSpecPower = max(shininess, 8.0f);
    float specPower = mix(8.0f, maxSpecPower, gloss);
    vec3 halfDir = normalize(fragToLight + viewDir);
    float NoH = max(dot(normal, halfDir), 0.0f);
    float spec = pow(NoH, specPower);

    float NoV = max(dot(normal, viewDir), 0.0f);                          // Fresnel edge shine.
    float fresnel = pow(1.0f - NoV, 5.0f) * fresnelStrength;

    vec3 nonMetalSpecColor = specularColor;                                         // Non-metal highlights are mostly specularColor.
    vec3 metalSpecColor = baseColor * specularColor;                                // Metal highlights are tinted toward the base texture color.
    vec3 finalSpecColor = mix(nonMetalSpecColor, metalSpecColor, metallic);
    float specAmount = (spec + fresnel * gloss) * gloss;                            // Keep matte materials from sparkling.
    float lightFacing = step(0.0001f, diffLight);                           // Avoid specular on faces not receiving light.
    specAmount *= lightFacing;
    vec3 specularLight = pointLightColor * specAmount * specularStrength * attenuation * finalSpecColor;

    // -------------------- illumination reductions / occlusion --------------------

                                                                                    // Bound the halo multiplier.
                                                                                    // It can strengthen ordinary side fill, but cannot amplify the
                                                                                    // already calculated diffuse/specular light above its original strength.
    float invlightDistance = 1.0f / max(lightPosDistance, EPSILON);
    float attenuationHalo = invlightDistance / (HATTNF + HATTNF2 * lightPosDistance);
    float haloReduction = clamp(PL_DIFUSSE_LIGHT_HALO_REDUCTION * attenuationHalo, PL_DIFUSSE_ILLUMINATION_REDUCTION, 1.0f);

                                                                                    // Smoothly blend the bounded halo into ordinary side fill.
                                                                                    // The transition ends at DISTANCE_LIGHT, eliminating the old distance jump.
    float haloBlend = 1.0f - smoothstep(HALO_FADE_START, DISTANCE_LIGHT, lightPosDistance);
    float sideDiffuseFactor = mix(PL_DIFUSSE_ILLUMINATION_REDUCTION, haloReduction, haloBlend);

                                                                                    // Smooth the forward-cone transition around the old illumination cutoff.
                                                                                    // With the proposed constants, it runs from cone = 0.05 to cone = 0.15.
    float coneBlend = smoothstep(ILLUMINATION_CUTOFF - CONE_FADE_HALF_WIDTH, ILLUMINATION_CUTOFF + CONE_FADE_HALF_WIDTH, cone);

                                                                                    // Fade direct spill out as fragments move behind the emitter.
                                                                                    // It reaches zero at the existing backwards-ambient early-return boundary.
    float rearBlend = smoothstep(-ILLUMINATION_CUTOFF, 0.0f, cone);

                                                                                    // Blend side/halo lighting into full forward lighting.
                                                                                    // Inner and omnidirectional lights have cone = 1, producing a factor of 1.
    float directFactor = mix(sideDiffuseFactor * rearBlend, 1.0f, coneBlend);

    diffuselight *= directFactor;
    specularLight *= directFactor;

                                                                                    // Smooth ambient across the same angular transition.
                                                                                    // Retain the distance-limited supporting-wall glow.
    float backAmbientFactor = BEHIND_LIGHT_FACTOR * backGlow;
    float sideAmbientFactor = PL_AMBIENT_ILLUMINATION_REDUCTION * backGlow;

                                                                                    // Preserve the existing very-close ambient exception.
    if (lightPosDistance <= IGNORED_ATTN_DISTANCE) {
        sideAmbientFactor = 1.0f;
    }

                                                                                    // Blend rear ambient into side ambient, then into full forward ambient.
                                                                                    // The rear blend also smooths the very-close ambient exception near
                                                                                    // the backwards-ambient early-return boundary.
    float ambientFactor = mix(mix(backAmbientFactor, sideAmbientFactor, rearBlend), 1.0f, coneBlend);

    ambientLight *= ambientFactor;

                                                                                    // Apply occlusion independently, after all distance/angular reductions.
    if (occluded && inner == 0) {
        return PL_AMBIENT_OCCLUSION * ambientLight + PL_DIFFUSE_OCCLUSION * diffuselight;
    }

    specularOut = clamp(specularLight, 0.0f, MAXLIGHT);            // specular color return
    return clamp(ambientLight + diffuselight, 0.0f, MAXLIGHT);     // ambient, diffuse color return
}

// ----------------------------------------------------------------------------
// Raycasting / occlusion
// ----------------------------------------------------------------------------

                                                                                    // surfaceNormal must be normalized, outward-facing, and in WORLD space.
bool Raycast3D(vec3 rayOrigin3D, vec3 rayTarget3D, vec3 surfaceNormal) {
    vec3 worldDirection = rayTarget3D - rayOrigin3D;
    float worldDirLen = length(worldDirection);

    if (worldDirLen < EPSILON)
        return false;

    vec3 worldDirNorm = worldDirection / worldDirLen;

                                                                                    // Biases are still in WORLD units.
                                                                                    // Limit both biases to 25% of the original segment length.
                                                                                    // A fixed origin bias could overshoot a very close receiving surface.
    float originBias = min(RAY_ORIGIN_BIAS, worldDirLen * 0.25f);
    float targetBias = min(RAY_TARGET_BIAS, worldDirLen * 0.25f);

                                                                                    // Advance slightly from the emitter towards the receiving surface.
    vec3 biasedOriginWorld = rayOrigin3D + worldDirNorm * originBias;

                                                                                    // Move the endpoint OUTSIDE the receiver along its outward normal.
                                                                                    // Pulling towards the light could put it INSIDE a wall when lit from behind.
                                                                                    // For voxelized EGA shapes, a mesh-exterior point may still be in a solid
                                                                                    // voxel; accurate voxelization is still needed to avoid false self-shadowing.
    vec3 biasedTargetWorld = rayTarget3D + surfaceNormal * targetBias;

                                                                                    // Convert to OCCLUSION TEXTURE SPACE.
                                                                                    // From here on, one DDA step means one occlusion texel.
    vec3 rayOrigin = worldToOcclusionCoord(biasedOriginWorld);
    vec3 rayTarget = worldToOcclusionCoord(biasedTargetWorld);

    vec3 direction = rayTarget - rayOrigin;
    float dirLen = length(direction);

    if (dirLen < EPSILON)
        return false;

    vec3 stepDir = vec3(direction.x > EPSILON ? 1.0f : (direction.x < -EPSILON ? -1.0f : 0.0f), direction.y > EPSILON ? 1.0f : (direction.y < -EPSILON ? -1.0f : 0.0f), direction.z > EPSILON ? 1.0f : (direction.z < -EPSILON ? -1.0f : 0.0f));

    ivec3 stepCell = ivec3(stepDir);
    ivec3 currentCell = ivec3(floor(rayOrigin));
    ivec3 targetCell = ivec3(floor(rayTarget));

    const float INF = 1e30f;

    vec3 tDelta = vec3(INF);
    vec3 tMax = vec3(INF);

                                                                                // X axis
    if (stepDir.x != 0.0f) {
        tDelta.x = 1.0f / abs(direction.x);
        float nextBoundaryX = (stepDir.x > 0.0f) ? floor(rayOrigin.x) + 1.0f : floor(rayOrigin.x);
        tMax.x = abs((nextBoundaryX - rayOrigin.x) / direction.x);
    }

                                                                                // Y axis / texture Y axis.
                                                                                // In 2.5D occlusion, this is world Z mapped to texture Y.
    if (stepDir.y != 0.0f) {
        tDelta.y = 1.0f / abs(direction.y);
        float nextBoundaryY = (stepDir.y > 0.0f) ? floor(rayOrigin.y) + 1.0f : floor(rayOrigin.y);
        tMax.y = abs((nextBoundaryY - rayOrigin.y) / direction.y);
    }

                                                                                // Z axis / texture depth.
                                                                                // In 2.5D occlusion this usually stays 0.
    if (stepDir.z != 0.0f) {
        tDelta.z = 1.0f / abs(direction.z);
        float nextBoundaryZ = (stepDir.z > 0.0f) ? floor(rayOrigin.z) + 1.0f : floor(rayOrigin.z);
        tMax.z = abs((nextBoundaryZ - rayOrigin.z) / direction.z);
    }

    for (int i = 0; i < MAX_STEPS; i++) {
                                                                                // Check occupancy BEFORE declaring the endpoint reached.
                                                                                // The outward endpoint bias handles cube-surface self-shadowing.
                                                                                // currentCell is already in OCCLUSION TEXTURE SPACE.
        if (isOccludedTexel(currentCell)) {
            return true;
        }

                                                                                // The endpoint voxel has been checked and is empty: the ray is clear.
        if (all(equal(currentCell, targetCell))) {
            return false;
        }

        if (tMax.x <= tMax.y && tMax.x <= tMax.z) {
            currentCell.x += stepCell.x;
            tMax.x += tDelta.x;
        } else if (tMax.y <= tMax.z) {
            currentCell.y += stepCell.y;
            tMax.y += tDelta.y;
        } else {
            currentCell.z += stepCell.z;
            tMax.z += tDelta.z;
        }
    }

    return false;
}

ivec3 getOcclusionTextureSize() {
    return textureSize(uOcclusionMap, 0);
}

bool isOcclusion3D() {
    return getOcclusionTextureSize().z > 1;
}

vec3 worldToOcclusionCoord(vec3 position3D) {
    float occResolution = max(uOcclusionResolution, 1.0f);
    vec2 texXY = (vec2(position3D.x, position3D.z) - uOcclusionOrigin) * occResolution;              // Texture X/Y correspond to world X/Z.

                                                                                                            // depth == 1:
                                                                                                            //   2.5D heightmap-style occlusion.
                                                                                                            //   Texture Z is always 0.
                                                                                                            //
                                                                                                            // depth > 1:
                                                                                                            //   3D voxel occlusion.
                                                                                                            //   World Y maps to texture Z.
    float texZ = 0.0f;

    if (isOcclusion3D()) {
        texZ = position3D.y * occResolution;
    }

    return vec3(texXY.x, texXY.y, texZ);
}

bool isOccludedTexel(ivec3 texel) {
    ivec3 size = getOcclusionTextureSize();

    if (any(lessThan(texel, ivec3(0))) || any(greaterThanEqual(texel, size))) {
        return false;
    }

    float occ = texelFetch(uOcclusionMap, texel, 0).r;
    return occ >= 0.5f;
}

bool isOmniDirectional(vec3 dir) {
    return length(dir) < 0.01f;
}
