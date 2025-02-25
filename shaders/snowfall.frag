#version 120

#include <flutter/runtime_effect.glsl>
//////-- CONFIGURATION --//////

//Shader from Azorlogh at shadertoy.com
//https://www.shadertoy.com/view/sllXDf

uniform vec2 iResolution;
uniform float iTime;
uniform float inverter;
out vec4 fragColor;

const vec3 nord0 = vec3(46, 52, 64) / 255.0;
const vec3 nord1 = vec3(59, 66, 82) / 255.0;
const vec3 nord2 = vec3(67, 76, 94) / 255.0;
const vec3 nord3 = vec3(76, 86, 106) / 255.0;
const vec3 nord4 = vec3(216, 222, 233) / 255.0;
const vec3 nord5 = vec3(229, 233, 240) / 255.0;
const vec3 nord6 = vec3(236, 239, 244) / 255.0;

const float SPEED = 0.5;
const float WIND = 3.0;
const float MAX_DEPTH = 2.0;
const float DEPTH_STEP = 0.2;
const float TIME_OFFSET = 0.0;

//////-- END OF CONFIGURATION --//////

const float TAU = 6.2831853071796;

float hash(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise(in vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);

    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

    float va = hash(i + vec2(0.0, 0.0));
    float vb = hash(i + vec2(1.0, 0.0));
    float vc = hash(i + vec2(0.0, 1.0));
    float vd = hash(i + vec2(1.0, 1.0));

    float k0 = va;
    float k1 = vb - va;
    float k2 = vc - va;
    float k4 = va - vb - vc + vd;

    return va + (vb - va) * u.x + (vc - va) * u.y + (va - vb - vc + vd) * u.x * u.y;
}

vec3 noised(in vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);

    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);

    float va = hash(i + vec2(0.0, 0.0));
    float vb = hash(i + vec2(1.0, 0.0));
    float vc = hash(i + vec2(0.0, 1.0));
    float vd = hash(i + vec2(1.0, 1.0));

    float k0 = va;
    float k1 = vb - va;
    float k2 = vc - va;
    float k4 = va - vb - vc + vd;

    return vec3(va + (vb - va) * u.x + (vc - va) * u.y + (va - vb - vc + vd) * u.x * u.y, // value
    du * (u.yx * (va - vb - vc + vd) + vec2(vb, vc) - va));     // derivative
}

/////////////////////////////////////////////////////////////////////////////////
// credit: Emil https://www.shadertoy.com/view/Mdt3Df                          //
float snow(vec2 coord, float depth, float time, float speed) {
    float snow = 0.0;
    float gradient = (1.0 - float(coord.y / iResolution.x)) * 0.4;
    float random = fract(sin(dot(coord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    for (int k = 0;k < 6; k++) {
        for (int i = 0;i < 20 && i < int(depth * 4.0); i++) {
            float cellSize = 2.0 + (float(i) * 3.0);
            float downSpeed = 0.3 + (sin(time * 0.4 + float(k + i * 20)) + 1.0) * 0.00008;
            vec2 uv = (coord.xy / iResolution.x) + vec2(0.01 * sin((time + float(k * 6185)) * 0.6 + float(i)) * (5.0 / float(i)) + time * speed * 0.3, downSpeed * (time + float(k * 1352)) * (1.0 / float(i)));
            vec2 uvStep = (ceil((uv) * cellSize - vec2(0.5, 0.5)) / cellSize);
            float x = fract(sin(dot(uvStep.xy, vec2(12.9898 + float(k) * 12.0, 78.233 + float(k) * 315.156))) * 43758.5453 + float(k) * 12.0) - 0.5;
            float y = fract(sin(dot(uvStep.xy, vec2(62.2364 + float(k) * 23.0, 94.674 + float(k) * 95.0))) * 62159.8432 + float(k) * 12.0) - 0.5;
            float randomMagnitude1 = sin(time * 2.5) * 0.7 / cellSize;
            float randomMagnitude2 = cos(time * 2.5) * 0.7 / cellSize;
            float d = 5.0 * distance((uvStep.xy + vec2(x * sin(y), y) * randomMagnitude1 + vec2(y, x) * randomMagnitude2), uv.xy);
            float omiVal = fract(sin(dot(uvStep.xy, vec2(32.4691, 94.615))) * 31572.1684);
            if (omiVal < 0.08 ? true : false) {
                float newd = (x + 1.0) * 0.4 * clamp(1.2 - d * (15.0 + (x * 6.3)) * (cellSize / 1.4), 0.0, 1.0);
                snow += newd / float(i) * 4.0;
            }
        }
    }

    return snow * noise( (coord / iResolution.y) * 10.0 + iTime);
}                                                                              //
/////////////////////////////////////////////////////////////////////////////////

const int OCTAVES = 9;

void fbmd(in vec2 st, float h, float dist, out float value, out vec2 grad) {
    const float gain = 0.5;
    const float gaind = 0.4;
    const float lacunarity = 2.0;
    float scale = (1.0 - pow(gain, float(OCTAVES))) / (1.0 - gain);
    float scaled = (1.0 - gaind) / (1.0 - pow(gaind, float(OCTAVES)));
    value = 0.0;
    grad = vec2(0);
    float amplitude = 1.0;
    float amplituded = 1.0;
    float frequency = 1.;
    float remaining_amp = scale;
    for (int i = 0; i < OCTAVES + int(log2(1.0 / dist)); i++) {
        vec3 n = noised(st * frequency + vec2(i));
        value += amplitude * n.r;
        grad += amplituded * frequency * n.gb;
        remaining_amp -= amplitude;
        if (h > value + remaining_amp) {
            value = 0.0;
            return;
        }
        frequency *= lacunarity;
        amplitude *= gain;
        amplituded *= gaind;
    }
    value /= scale;
    grad *= scaled;
}

void terraind(vec2 pos, float h, float dist, out float value, out vec2 grad) {
    const float a = 0.2;
    const float b = 0.05;
    float c = -0.5 - 0.5 * pos.y * b + pos.y * a + a * b * pos.y * pos.y;
    float d = (1.0 + pos.y * b);
    fbmd(pos * 0.4, (h - c) / d, dist, value, grad); // [0; 1]
    value = d * value + c;
    grad *= 0.4;
    grad.x = (b * pos.y + 1.0) * grad.x;
    grad.y = (b * pos.y + 1.0) * grad.y + b * value + 2.0 * a * b * pos.y + a - 0.5 * b;
}

void main() {
    vec2 fragCoord = FlutterFragCoord().xy;
    float xpos = (fragCoord.x - iResolution.x / 2.0) / (iResolution.y / 2.0);
    float ypos = (fragCoord.y - iResolution.y / 2.0) / (iResolution.y / 2.0);
    vec2 pos = vec2(xpos, inverter * ypos);//(fragCoord.xy - iResolution.xy/2.0) / (iResolution.y/2.0);

    pos.y -= 0.5;

    float depth = 1000.0;

    float time = (iTime + TIME_OFFSET) * SPEED;
    float terr;
    vec2 grad;
    int iter = 0;

    vec3 col = mix(nord6, nord6, smoothstep(-0.5, 1.0, pos.y));
    for (float z = 0.0; z <= MAX_DEPTH; z += DEPTH_STEP) {
        vec2 p = vec2(pos.x + time / (1.0 + z), z) * (1.0 + z);
        terraind(p, pos.y + 1.2, 1.0 + z, terr, grad);
        if (pos.y + 1.2 < terr) {
            float terrtrue;
            terraind(p + vec2(0, (pos.y + 1.0) - terr) * (1.0 + z), -10.0, 1.0 + z, terrtrue, grad);
            float flatness = smoothstep(0.6, 0.5, length(grad));
            vec3 ground = mix(nord3, nord6, flatness * 0.7);

            #if defined(AMBIENT_OCCLUSION) || defined(SHADING)
            vec3 normal = normalize(- vec3(grad.x, -1.0, grad.y));
            #endif

            #ifdef AMBIENT_OCCLUSION
            float ao = 1.0 / abs(terraind(p + normal.xz).r - (terr + normal.y));
            ground *= clamp(1.0 - ao * 0.2 + 0.15, 0.0, 1.0);
            #endif
            #ifdef SHADING
            ground *= max(0.0, min(1.0, 0.3 + max(0.0, dot(normalize(vec3(-1, 1.5, 0.5)), normal))));
            #endif
            col = mix(ground, col, min(z / MAX_DEPTH * 0.95, 1.0));
            //col = ground;
            // col = mix(ground, col, min((z*z)/MAX_DEPTH*0.6, 1.0));
            //col = normal;
            depth = 1.0 + z * 2.5;
            break;
        }
    }

    col = mix(col, nord6, noise(pos + vec2(time * SPEED * WIND, 0)) * 0.4);

    //    float snow = snow(gl_FragCoord.xy, depth, time/SPEED, SPEED*WIND)*10.0;
    vec2 invertedcoord = vec2(FlutterFragCoord().x, inverter * FlutterFragCoord().y);
    float snow = snow(invertedcoord, depth, time / SPEED, SPEED * WIND) * 10.0;
    col = mix(col, nord6, min(1.0, snow));
    col += snow * (pos.y + 1.0) * 0.1;

    fragColor = vec4(col, 1);
}
