#version 300 es
///fShader///
/*
* v1.5
* DownHeel - specular fixes + corrected high-resolution occlusion raycast
*
* Occlusion notes:
* - uOcclusionResolution = texels per world/grid unit.
* - Raycast3D now walks in OCCLUSION TEXTURE SPACE, not world grid space.
* - Bounds are read from textureSize(uOcclusionMap, 0).
* - uGridSize is kept for JS compatibility, but occlusion bounds no longer depend on it.
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
uniform sampler2D uSampler;
uniform vec3 uCameraPos;
uniform Material uMaterial;

uniform sampler3D uOcclusionMap;

// Kept for compatibility with existing JS.
// Occlusion bounds now use textureSize(uOcclusionMap, 0).
uniform vec3 uGridSize;

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

const float PL_AmbientStrength = 9.99f;
const float PL_DiffuseStrength = 50.0f;
const float PL_SpecularStrength = 5.0f;

const float IGNORE_ALPHA = 0.1f;

// Increased because DDA now walks occlusion texels.
// At resolution 4, a ray may need roughly 4x more steps than before.
const int MAX_STEPS = 4096;

const float EPSILON = 0.005f;
const float PL_AMBIENT_OCCLUSION = 0.10f;
const float PL_DIFFUSE_OCCLUSION = 0.10f;
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
const float DISTANCE_LIGHT = 0.25f;
const float LIGHT_POS_Y_OFFSET = 0.35f;
const float INTO_WALL = 0.01f;
const float RAY_ORIGIN_BIAS = EPSILON * 5.0f;

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

bool Raycast3D(vec3 rayOrigin3D, vec3 rayTarget3D, float illumination);
bool isOmniDirectional(vec3 dir);

ivec3 getOcclusionTextureSize();
bool isOcclusion3D();
vec3 worldToOcclusionCoord(vec3 position3D);
bool isOccludedTexel(ivec3 texel);
bool isOccluded(vec3 position3D);

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
    vec3 innerLight = CalcLight(
        uCameraPos,
        FragPos,
        viewDir,
        norm,
        innerLightColor,
        shininess,
        ambientColor,
        diffuseColor,
        specularColor,
        roughness,
        metallic,
        fresnelStrength,
        innerAmbientStrength,
        innerDiffuseStrength,
        innerSpecularStrength,
        1,
        viewDir,
        baseColor,
        specularPart
    );

    specularTotal += specularPart;

    vec3 PL_output = vec3(0.0f);

    for (int i = 0; i < N_LIGHTS; i++) {
        if (uPointLights[i].x < 0.0f)
            continue;

        PL_output += CalcLight(
            uPointLights[i],
            FragPos,
            viewDir,
            norm,
            uLightColors[i],
            shininess,
            ambientColor,
            diffuseColor,
            specularColor,
            roughness,
            metallic,
            fresnelStrength,
            PL_AmbientStrength,
            PL_DiffuseStrength,
            PL_SpecularStrength,
            0,
            uLightDirections[i],
            baseColor,
            specularPart
        );

        specularTotal += specularPart;
    }

    vec3 nonSpecularLight = innerLight + PL_output;

    // Texture color affects ambient/diffuse.
    // Specular is added separately so shiny highlights remain visible.
    vec3 diffuseFinal = baseColor * max(nonSpecularLight, GLOBAL_AMBIENT);
    vec3 finalColor = diffuseFinal + specularTotal;

    fragColor = vec4(clamp(finalColor, 0.0f, 1.0f), texelColor.a);
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
    vec3 lightToFrag = normalize(FragPos - lightPosition);       // light -> fragment
    vec3 fragToLight = -lightToFrag;                             // fragment -> light
    vec3 dirLight = normalize(lightDirection);
    float invDistance = 1.0f / (lightPosDistance + EPSILON);
    float attenuation = invDistance / (ATTNF + ATTNF2 * lightPosDistance);

    // -------------------- directional cone illumination --------------------
    // illumination in [0..1], based on angle between light forward and light -> fragment
    float cone = 1.0f;
    float illumination = 1.0f;

    if (inner == 0 && !isOmniDirectional(lightDirection)) {
        cone = dot(lightToFrag, dirLight);
        illumination = max(cone, 0.0f);
    }

    vec3 ambientLight = vec3(0.0f);

    // If fragment is behind the directional light, return only tiny ambient, no occlusion.
    if (inner == 0 && !isOmniDirectional(lightDirection) && cone < -ILLUMINATION_CUTOFF) {
        ambientLight = pointLightColor * ambientStrength * attenuation * ambientColor * BEHIND_LIGHT_FACTOR;
        return ambientLight;
    }

    // Occlusion only meaningful for non-inner light.
    bool occluded = false;

    if (inner == 0) {
        occluded = Raycast3D(lightPosition, FragPos, illumination);
    }

    bool isLight = (lightPosDistance < DISTANCE_LIGHT);

    // -------------------- ambient --------------------
    if (inner == 1) {
        ambientLight = pointLightColor * ambientStrength * ambientColor;
    } else {
        ambientLight = pointLightColor * ambientStrength * attenuation * ambientColor;
    }

    // -------------------- diffuse --------------------
    float diffLight = max(dot(normal, fragToLight), 0.0f);
    float diffView = max(dot(normal, viewDir), 0.0f);
    float diff = 0.95f * diffLight + 0.05f * diffView;

    vec3 diffuselight = pointLightColor * diff * diffuseStrength * attenuation * diffuseColor;
    diffuselight *= 1.0f - metallic * 0.65f;

    // -------------------- specular --------------------
    float gloss = 1.0f - roughness;

    float maxSpecPower = max(shininess, 8.0f);
    float specPower = mix(8.0f, maxSpecPower, gloss);

    vec3 halfDir = normalize(fragToLight + viewDir);
    float NoH = max(dot(normal, halfDir), 0.0f);
    float spec = pow(NoH, specPower);

    // Fresnel edge shine.
    float NoV = max(dot(normal, viewDir), 0.0f);
    float fresnel = pow(1.0f - NoV, 5.0f) * fresnelStrength;

    // Non-metal highlights are mostly specularColor.
    vec3 nonMetalSpecColor = specularColor;

    // Metal highlights are tinted toward the base texture color.
    vec3 metalSpecColor = baseColor * specularColor;

    vec3 finalSpecColor = mix(nonMetalSpecColor, metalSpecColor, metallic);

    // Keep matte materials from sparkling.
    float specAmount = (spec + fresnel * gloss) * gloss;

    // Avoid specular on faces not receiving light.
    float lightFacing = step(0.0001f, diffLight);
    specAmount *= lightFacing;

    vec3 specularLight = pointLightColor * specAmount * specularStrength * attenuation * finalSpecColor;

    // -------------------- illumination reductions / occlusion --------------------
    if (illumination < ILLUMINATION_CUTOFF) {
        if (isLight) {
            float invlightDistance = 1.0f / max(lightPosDistance, EPSILON);
            float attenuationHalo = invlightDistance / (HATTNF + HATTNF2 * lightPosDistance);
            float haloReduction = PL_DIFUSSE_LIGHT_HALO_REDUCTION * attenuationHalo;

            diffuselight *= haloReduction;
            specularLight *= haloReduction;
        } else {
            diffuselight *= PL_DIFUSSE_ILLUMINATION_REDUCTION;
            specularLight *= PL_DIFUSSE_ILLUMINATION_REDUCTION;
        }

        if (lightPosDistance > IGNORED_ATTN_DISTANCE) {
            ambientLight *= PL_AMBIENT_ILLUMINATION_REDUCTION;
        }
    } else if (occluded && inner == 0) {
        return PL_AMBIENT_OCCLUSION * ambientLight + PL_DIFFUSE_OCCLUSION * diffuselight;
    }

    specularOut = clamp(specularLight, 0.0f, MAXLIGHT);
    return clamp(ambientLight + diffuselight, 0.0f, MAXLIGHT);
}

// ----------------------------------------------------------------------------
// Raycasting / occlusion
// ----------------------------------------------------------------------------

bool Raycast3D(vec3 rayOrigin3D, vec3 rayTarget3D, float illumination) {
    vec3 worldDirection = rayTarget3D - rayOrigin3D;
    float worldDirLen = length(worldDirection);

    if (worldDirLen < EPSILON)
        return false;

    vec3 worldDirNorm = worldDirection / worldDirLen;

    // Biases are still in WORLD units.
    // Origin bias helps avoid immediately hitting the light's own texel.
    // Target pullback helps prevent the destination surface from shadowing itself.
    vec3 biasedOriginWorld = rayOrigin3D + worldDirNorm * RAY_ORIGIN_BIAS;
    vec3 biasedTargetWorld = rayTarget3D - worldDirNorm * INTO_WALL;

    // Convert to OCCLUSION TEXTURE SPACE.
    // From here on, one DDA step means one occlusion texel.
    vec3 rayOrigin = worldToOcclusionCoord(biasedOriginWorld);
    vec3 rayTarget = worldToOcclusionCoord(biasedTargetWorld);

    vec3 direction = rayTarget - rayOrigin;
    float dirLen = length(direction);

    if (dirLen < EPSILON)
        return false;

    vec3 stepDir = vec3(
        direction.x > EPSILON ? 1.0f : (direction.x < -EPSILON ? -1.0f : 0.0f),
        direction.y > EPSILON ? 1.0f : (direction.y < -EPSILON ? -1.0f : 0.0f),
        direction.z > EPSILON ? 1.0f : (direction.z < -EPSILON ? -1.0f : 0.0f)
    );

    ivec3 stepCell = ivec3(stepDir);
    ivec3 currentCell = ivec3(floor(rayOrigin));
    ivec3 targetCell = ivec3(floor(rayTarget));

    const float INF = 1e30f;

    vec3 tDelta = vec3(INF);
    vec3 tMax = vec3(INF);

    // X axis
    if (stepDir.x != 0.0f) {
        tDelta.x = 1.0f / abs(direction.x);

        float nextBoundaryX = (stepDir.x > 0.0f)
            ? floor(rayOrigin.x) + 1.0f
            : floor(rayOrigin.x);

        tMax.x = abs((nextBoundaryX - rayOrigin.x) / direction.x);
    }

    // Y axis / texture Y axis.
    // In 2.5D occlusion, this is world Z mapped to texture Y.
    if (stepDir.y != 0.0f) {
        tDelta.y = 1.0f / abs(direction.y);

        float nextBoundaryY = (stepDir.y > 0.0f)
            ? floor(rayOrigin.y) + 1.0f
            : floor(rayOrigin.y);

        tMax.y = abs((nextBoundaryY - rayOrigin.y) / direction.y);
    }

    // Z axis / texture depth.
    // In 2.5D occlusion this usually stays 0.
    if (stepDir.z != 0.0f) {
        tDelta.z = 1.0f / abs(direction.z);

        float nextBoundaryZ = (stepDir.z > 0.0f)
            ? floor(rayOrigin.z) + 1.0f
            : floor(rayOrigin.z);

        tMax.z = abs((nextBoundaryZ - rayOrigin.z) / direction.z);
    }

    for (int i = 0; i < MAX_STEPS; i++) {
        // Do not let the destination texel shadow itself.
        if (all(equal(currentCell, targetCell))) {
            return false;
        }

        // currentCell is already in OCCLUSION TEXTURE SPACE.
        if (isOccludedTexel(currentCell)) {
            return true;
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

    // Texture X/Y correspond to world X/Z.
    vec2 texXY = (vec2(position3D.x, position3D.z) - uOcclusionOrigin) * occResolution;

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

bool isOccluded(vec3 position3D) {
    vec3 occCoord = worldToOcclusionCoord(position3D);
    return isOccludedTexel(ivec3(floor(occCoord)));
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