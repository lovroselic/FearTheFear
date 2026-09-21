/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */
/*jshint -W083 */
"use strict";

/** Elements */


/**
 * format: array of objects
 * {
 *  shapeName: string shape name
 *  collisionMode: enum COLLISION_MODE
 * }
 */

var ElementsToCompile = [];                         // required elements will be provided in asset file


const COLLISION_MODE = Object.freeze({
    NONE: "NONE",
    CELL: "CELL",               // Existing complete-grid collision.
    BOUNDS: "BOUNDS",           // Six planes generated from the element's min/max bounds.
    CONVEX: "CONVEX",           // Unique planes compiled from one convex proxy mesh.
    MESH: "MESH",               // Reserved for rare cases that truly require triangles.
});

const ELEMENT = {
    VERSION: "1.00",
    CSS: "color: silver",
    DEBUG: true,

    compileElementsToPlanes(arr = ElementsToCompile) {
        for (const EL of arr) {
            const planes = this.compileElementPlanes(ELEMENT[EL.shapeName], EL.shapeName);
            this[EL.shapeName].planes = planes;
            this[EL.shapeName].collisionMode = EL.collisionMode;
        }
    },

    readElementVertex(positions, index) {
        const offset = index * 3;
        const x = positions[offset];
        const y = positions[offset + 1];
        const z = positions[offset + 2];

        return { x, y, z };
    },
    planeDot(a, b) {
        return (a.x * b.x + a.y * b.y + a.z * b.z);
    },
    planeSubtract(a, b) {
        return {
            x: a.x - b.x,
            y: a.y - b.y,
            z: a.z - b.z,
        };
    },
    planeCross(a, b) {
        return {
            x: a.y * b.z - a.z * b.y,
            y: a.z * b.x - a.x * b.z,
            z: a.x * b.y - a.y * b.x,
        };
    },
    planeNormalize(vector) {
        const length = Math.hypot(vector.x, vector.y, vector.z);
        if (length < 1E-10) return null;

        return { x: vector.x / length, y: vector.y / length, z: vector.z / length, };
    },
    planesAreEqual(a, b) {

        const NORMAL_EPSILON = 1E-5;
        const DISTANCE_EPSILON = 1E-5;
        const normalSimilarity = this.planeDot(a.normal, b.normal);          // A dot product close to 1 means that they point in almost exactly        the same direction.
        const sameNormal = normalSimilarity >= 1 - NORMAL_EPSILON;
        const sameDistance = Math.abs(a.d - b.d) <= DISTANCE_EPSILON;

        return sameNormal && sameDistance;
    },

    compileElementPlanes(element, shapeName = "UNKNOWN") {
        const MAX_PLANES = 6;
        const CONVEXITY_EPSILON = 1E-5;

        if (!element) throw new Error(`${shapeName}: element does not exist.`);

        const positions = element.positions;
        const indices = element.indices;
        const vertexCount = positions.length / 3;
        const sourceTriangleCount = indices.length / 3;
        const planes = [];

        // Process one triangle at a time. Every three indices describe one triangle.
        for (let i = 0; i < indices.length; i += 3) {

            const triangleNumber = i / 3;
            const indexA = indices[i];
            const indexB = indices[i + 1];
            const indexC = indices[i + 2];

            const a = this.readElementVertex(positions, indexA, shapeName);
            const b = this.readElementVertex(positions, indexB, shapeName);
            const c = this.readElementVertex(positions, indexC, shapeName);

            // Construct two triangle edges originating from A.
            const ab = this.planeSubtract(b, a);
            const ac = this.planeSubtract(c, a);


            // The cross product produces the geometric triangle normal. Triangle winding determines its direction.
            const normal = this.planeNormalize(this.planeCross(ab, ac));

            /*
                A missing normal means the triangle has no area.
        
                Possible causes:
                - two identical vertices;
                - three collinear vertices;
                - broken indices.
            */
            if (normal === null) {
                throw new Error(
                    `${shapeName}: triangle ${triangleNumber} ` +
                    `is degenerate. Indices: ` +
                    `${indexA}, ${indexB}, ${indexC}.`
                );
            }

            /*
                Plane equation: dot(normal, point) = d
                Vertex A is on the plane, so: d = dot(normal, A)
            */
            const d = this.planeDot(normal, a);
            const candidatePlane = { normal, d, sourceTriangles: [triangleNumber], };

            /*
                A rectangular face normally contains two triangles.
                Both triangles produce the same plane, so we keep only one.
            */
            let existingPlane = null;

            for (const plane of planes) {
                if (this.planesAreEqual(candidatePlane, plane)) {
                    existingPlane = plane;
                    break;
                }
            }

            if (existingPlane) {
                existingPlane.sourceTriangles.push(triangleNumber);
            } else {
                planes.push(candidatePlane);
            }
        }

        if (this.DEBUG) {
            if (planes.length > MAX_PLANES) {
                throw new Error(
                    `${shapeName}: compiled ${planes.length} planes; ` +
                    `maximum permitted is ${MAX_PLANES}.`
                );
            }

            /*
                Validate convexity and winding.
                For a closed convex mesh with outward-facing normals, every vertex
                must be on or behind every plane: dot(normal, vertex) <= d
            */
            for (let planeIndex = 0; planeIndex < planes.length; planeIndex++) {
                const plane = planes[planeIndex];

                for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {

                    const vertex = this.readElementVertex(positions, vertexIndex, shapeName);
                    const distance = this.planeDot(plane.normal, vertex) - plane.d;

                    /*
                        Positive distance means the vertex is in front of an
                        outward-facing plane.
                        That should be impossible for a convex object.
                    */
                    if (distance > CONVEXITY_EPSILON) {
                        throw new Error(
                            `${shapeName}: convexity validation failed. ` +
                            `Vertex ${vertexIndex} is outside plane ` +
                            `${planeIndex}, created from triangle ` +
                            `${plane.sourceTriangles[0]}. ` +
                            `The mesh may be concave or incorrectly wound.`
                        );
                    }
                }
            }
        }

        return {
            shapeName,
            sourceTriangleCount,
            planeCount: planes.length,
            planes,
        };
    },


    getMinY(element) {
        let minY = Infinity;
        for (let i = 0; i < element.positions.length; i += 3) {
            if (element.positions[i + 1] < minY) {
                minY = element.positions[i + 1];
            }
        }
        return minY;
    },
    getExtremity(element, dim, type) {
        let offset = null;
        let sign = null;
        switch (dim) {
            case "x":
                offset = 0;
                break;
            case "y":
                offset = 1;
                break;
            case "z":
                offset = 2;
                break;
            default: throw new Error(`Wrong dimension ${dim}. x, y,z allowed.`);
        }
        switch (type) {
            case "min":
                sign = 1;
                break;
            case "max":
                sign = -1;
                break;
            default: throw new Error(`Wrong type ${type}. min, max allowed.`);
        }
        let extremity = sign * Infinity;
        for (let i = 0; i < element.positions.length; i += 3) {
            if (element.positions[i + offset] * sign < extremity) {
                extremity = element.positions[i + offset];
            }
        }
        return extremity;
    },
    getBoundingBox(element) {
        const max = Array(-Infinity, -Infinity, -Infinity);
        const min = Array(Infinity, Infinity, Infinity);
        for (let i = 0; i < element.positions.length; i += 3) {
            for (let j = 0; j < 3; j++) {
                if (element.positions[i + j] < min[j]) {
                    min[j] = element.positions[i + j];
                }
                if (element.positions[i + j] > max[j]) {
                    max[j] = element.positions[i + j];
                }
            }
        }
        return new BoundingBox(max, min);
    },
    getSurfaceProjection(element, scale) {
        if (!element.boundingBox) element.boundingBox = this.getBoundingBox(element);
        const BB = element.boundingBox;
        const W = (BB.max.x - BB.min.x) * scale;
        const H = (BB.max.z - BB.min.z) * scale;
        return { W: W, H: H };
    },
    _bb_for_internal_elements() {
        for (const el of this.internalElements) {
            this[el].boundingBox = this.getBoundingBox(this[el]);
        }
    },
    internalElements: [
        "FRONT_FACE", "BACK_FACE", "RIGHT_FACE", "LEFT_FACE", "TOP_FACE", "BOTTOM_FACE",
        "CUBE", "CUBE_80", "CUBE_60", "CUBE_40", "CUBE_20", "CUBE_SM", "CUBE_CENTERED",
        "BAR", "WEDGE",
    ],
    FRONT_FACE: {
        positions: [0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0],
        indices: [0, 1, 2, 0, 2, 3],
        textureCoordinates: [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0],
        vertexNormals: [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0]
    },
    BACK_FACE: {
        positions: [0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0],
        indices: [0, 1, 2, 0, 2, 3],
        textureCoordinates: [1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,],
        vertexNormals: [0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0]
    },
    RIGHT_FACE: {
        positions: [1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0],
        indices: [0, 1, 2, 0, 2, 3],
        textureCoordinates: [1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0],
        vertexNormals: [1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0]
    },
    LEFT_FACE: {
        positions: [0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0],
        indices: [0, 1, 2, 0, 2, 3],
        textureCoordinates: [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0],
        vertexNormals: [-1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0],
    },
    TOP_FACE: {
        positions: [0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0],
        indices: [0, 2, 1, 0, 3, 2],
        textureCoordinates: [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0],
        vertexNormals: [0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0],
    },
    BOTTOM_FACE: {
        positions: [0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0],
        indices: [0, 1, 2, 0, 2, 3],
        textureCoordinates: [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0],
        vertexNormals: [0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0]
    },
    CUBE: {
        positions: [
            // Front face
            0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0,
            // Back face
            0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,
            // Top face
            0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0,
            // Bottom face
            0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0,
            // Right face
            1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0,
            // Left face
            0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0,
        ],
        indices: [
            0, 1, 2, 0, 2, 3, // front
            4, 5, 6, 4, 6, 7, // back
            8, 9, 10, 8, 10, 11, // top
            12, 13, 14, 12, 14, 15, // bottom
            16, 17, 18, 16, 18, 19, // right
            20, 21, 22, 20, 22, 23, // left
        ],
        textureCoordinates: [
            // Front
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            // Back
            0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0,
            // Top
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            // Bottom
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            // Right
            0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0,
            // Left
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        ],
        vertexNormals: [
            // Front
            0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
            // Back
            0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
            // Top
            0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
            // Bottom
            0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
            // Right
            1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            // Left
            -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
        ],
    },
    CUBE_80: {
        positions: [
            // Front face
            0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.8, 1.0, 0.0, 0.8, 1.0,
            // Back face
            0.0, 0.0, 0.0, 0.0, 0.8, 0.0, 1.0, 0.8, 0.0, 1.0, 0.0, 0.0,
            // Top face
            0.0, 0.8, 0.0, 0.0, 0.8, 1.0, 1.0, 0.8, 1.0, 1.0, 0.8, 0.0,
            // Bottom face
            0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0,
            // Right face
            1.0, 0.0, 0.0, 1.0, 0.8, 0.0, 1.0, 0.8, 1.0, 1.0, 0.0, 1.0,
            // Left face
            0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.8, 1.0, 0.0, 0.8, 0.0,
        ],
        indices: [
            0, 1, 2, 0, 2, 3, // front
            4, 5, 6, 4, 6, 7, // back
            8, 9, 10, 8, 10, 11, // top
            12, 13, 14, 12, 14, 15, // bottom
            16, 17, 18, 16, 18, 19, // right
            20, 21, 22, 20, 22, 23, // left
        ],
        textureCoordinates: [
            // Front
            0.0, 0.0, 1.0, 0.0, 1.0, 0.8, 0.0, 0.8,
            // Back
            0.0, 0.0, 0.0, 0.8, 1.0, 0.8, 1.0, 0.0,
            // Top
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            // Bottom
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            // Right
            0.0, 0.0, 0.0, 0.8, 1.0, 0.8, 1.0, 0.0,
            // Left
            0.0, 0.0, 1.0, 0.0, 1.0, 0.8, 0.0, 0.8,
        ],
        vertexNormals: [
            // Front
            0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
            // Back
            0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
            // Top
            0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
            // Bottom
            0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
            // Right
            1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            // Left
            -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
        ],
    },
    CUBE_60: {
        positions: [
            // Front face
            0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.6, 1.0, 0.0, 0.6, 1.0,
            // Back face
            0.0, 0.0, 0.0, 0.0, 0.6, 0.0, 1.0, 0.6, 0.0, 1.0, 0.0, 0.0,
            // Top face
            0.0, 0.6, 0.0, 0.0, 0.6, 1.0, 1.0, 0.6, 1.0, 1.0, 0.6, 0.0,
            // Bottom face
            0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0,
            // Right face
            1.0, 0.0, 0.0, 1.0, 0.6, 0.0, 1.0, 0.6, 1.0, 1.0, 0.0, 1.0,
            // Left face
            0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.6, 1.0, 0.0, 0.6, 0.0,
        ],
        indices: [
            0, 1, 2, 0, 2, 3, // front
            4, 5, 6, 4, 6, 7, // back
            8, 9, 10, 8, 10, 11, // top
            12, 13, 14, 12, 14, 15, // bottom
            16, 17, 18, 16, 18, 19, // right
            20, 21, 22, 20, 22, 23, // left
        ],
        textureCoordinates: [
            // Front
            0.0, 0.0, 1.0, 0.0, 1.0, 0.6, 0.0, 0.6,
            // Back
            0.0, 0.0, 0.0, 0.6, 1.0, 0.6, 1.0, 0.0,
            // Top
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            // Bottom
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            // Right
            0.0, 0.0, 0.0, 0.6, 1.0, 0.6, 1.0, 0.0,
            // Left
            0.0, 0.0, 1.0, 0.0, 1.0, 0.6, 0.0, 0.6,
        ],
        vertexNormals: [
            // Front
            0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
            // Back
            0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
            // Top
            0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
            // Bottom
            0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
            // Right
            1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            // Left
            -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
        ],
    },
    CUBE_40: {
        positions: [
            // Front face
            0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.4, 1.0, 0.0, 0.4, 1.0,
            // Back face
            0.0, 0.0, 0.0, 0.0, 0.4, 0.0, 1.0, 0.4, 0.0, 1.0, 0.0, 0.0,
            // Top face
            0.0, 0.4, 0.0, 0.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 0.0,
            // Bottom face
            0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0,
            // Right face
            1.0, 0.0, 0.0, 1.0, 0.4, 0.0, 1.0, 0.4, 1.0, 1.0, 0.0, 1.0,
            // Left face
            0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.4, 1.0, 0.0, 0.4, 0.0,
        ],
        indices: [
            0, 1, 2, 0, 2, 3, // front
            4, 5, 6, 4, 6, 7, // back
            8, 9, 10, 8, 10, 11, // top
            12, 13, 14, 12, 14, 15, // bottom
            16, 17, 18, 16, 18, 19, // right
            20, 21, 22, 20, 22, 23, // left
        ],
        textureCoordinates: [
            // Front
            0.0, 0.0, 1.0, 0.0, 1.0, 0.4, 0.0, 0.4,
            // Back
            0.0, 0.0, 0.0, 0.4, 1.0, 0.4, 1.0, 0.0,
            // Top
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            // Bottom
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            // Right
            0.0, 0.0, 0.0, 0.4, 1.0, 0.4, 1.0, 0.0,
            // Left
            0.0, 0.0, 1.0, 0.0, 1.0, 0.4, 0.0, 0.4,
        ],
        vertexNormals: [
            // Front
            0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
            // Back
            0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
            // Top
            0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
            // Bottom
            0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
            // Right
            1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            // Left
            -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
        ],
    },
    CUBE_20: {
        positions: [
            // Front face
            0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.2, 1.0, 0.0, 0.2, 1.0,
            // Back face
            0.0, 0.0, 0.0, 0.0, 0.2, 0.0, 1.0, 0.2, 0.0, 1.0, 0.0, 0.0,
            // Top face
            0.0, 0.2, 0.0, 0.0, 0.2, 1.0, 1.0, 0.2, 1.0, 1.0, 0.2, 0.0,
            // Bottom face
            0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0,
            // Right face
            1.0, 0.0, 0.0, 1.0, 0.2, 0.0, 1.0, 0.2, 1.0, 1.0, 0.0, 1.0,
            // Left face
            0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.2, 1.0, 0.0, 0.2, 0.0,
        ],
        indices: [
            0, 1, 2, 0, 2, 3, // front
            4, 5, 6, 4, 6, 7, // back
            8, 9, 10, 8, 10, 11, // top
            12, 13, 14, 12, 14, 15, // bottom
            16, 17, 18, 16, 18, 19, // right
            20, 21, 22, 20, 22, 23, // left
        ],
        textureCoordinates: [
            // Front
            0.0, 0.0, 1.0, 0.0, 1.0, 0.2, 0.0, 0.2,
            // Back
            0.0, 0.0, 0.0, 0.2, 1.0, 0.2, 1.0, 0.0,
            // Top
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            // Bottom
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            // Right
            0.0, 0.0, 0.0, 0.2, 1.0, 0.2, 1.0, 0.0,
            // Left
            0.0, 0.0, 1.0, 0.0, 1.0, 0.2, 0.0, 0.2,
        ],
        vertexNormals: [
            // Front
            0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
            // Back
            0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
            // Top
            0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
            // Bottom
            0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
            // Right
            1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            // Left
            -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
        ],
    },
    CUBE_SM: {
        positions: [
            // Front face
            0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0,
            // Back face
            0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,
            // Top face
            0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0,
            // Bottom face
            0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0,
            // Right face
            1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0,
            // Left face
            0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0,
        ],
        indices: [
            0, 1, 2, 0, 2, 3, // front
            4, 5, 6, 4, 6, 7, // back
            8, 9, 10, 8, 10, 11, // top
            12, 13, 14, 12, 14, 15, // bottom
            16, 17, 18, 16, 18, 19, // right
            20, 21, 22, 20, 22, 23, // left
        ],
        textureCoordinates: [
            // Front
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            // Back
            0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0,
            // Top
            0.0, 0.0, 0.05, 0.0, 0.05, 0.05, 0.0, 0.05,
            // Bottom
            0.0, 0.0, 0.05, 0.0, 0.5, 0.05, 0.0, 0.05,
            // Right
            0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0,
            // Left
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        ],
        vertexNormals: [
            // Front
            0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
            // Back
            0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
            // Top
            0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
            // Bottom
            0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
            // Right
            1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            // Left
            -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
        ],
    },
    CUBE_CENTERED: {
        positions: [
            // Front face
            -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,

            // Back face
            -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,

            // Top face
            -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,

            // Bottom face
            -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,

            // Right face
            1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,

            // Left face
            -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
        ],
        indices: [
            0, 1, 2, 0, 2, 3, // front
            4, 5, 6, 4, 6, 7, // back
            8, 9, 10, 8, 10, 11, // top
            12, 13, 14, 12, 14, 15, // bottom
            16, 17, 18, 16, 18, 19, // right
            20, 21, 22, 20, 22, 23, // left
        ],
        textureCoordinates: [
            // Front
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            // Back
            0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0,
            // Top
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            // Bottom
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            // Right
            0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0,
            // Left
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        ],
        vertexNormals: [
            // Front
            0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
            // Back
            0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
            // Top
            0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
            // Bottom
            0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
            // Right
            1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            // Left
            -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
        ],
    },
    BAR: {
        positions: [
            // Front face
            -1.0, -0.5, 0.5, 1.0, -0.5, 0.5, 0.8, 0.5, 0.4, -0.8, 0.5, 0.4,

            // Back face
            -1.0, -0.5, -0.5, -0.8, 0.5, -0.4, 0.8, 0.5, -0.4, 1.0, -0.5, -0.5,

            // Top face
            -0.8, 0.5, -0.4, -0.8, 0.5, 0.4, 0.8, 0.5, 0.4, 0.8, 0.5, -0.4,

            // Bottom face
            -1.0, -0.5, -0.5, 1.0, -0.5, -0.5, 1.0, -0.5, 0.5, -1.0, -0.5, 0.5,

            // Right face
            1.0, -0.5, -0.5, 0.8, 0.5, -0.4, 0.8, 0.5, 0.4, 1.0, -0.5, 0.5,

            // Left face
            -1.0, -0.5, -0.5, -1.0, -0.5, 0.5, -0.8, 0.5, 0.4, -0.8, 0.5, -0.4,
        ],
        indices: [
            0, 1, 2, 0, 2, 3, // front
            4, 5, 6, 4, 6, 7, // back
            8, 9, 10, 8, 10, 11, // top
            12, 13, 14, 12, 14, 15, // bottom
            16, 17, 18, 16, 18, 19, // right
            20, 21, 22, 20, 22, 23, // left
        ],
        textureCoordinates: [
            // Front
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            // Back
            0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0,
            // Top
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            // Bottom
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            // Right
            0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0,
            // Left
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        ],
        vertexNormals: [
            // Front
            0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
            // Back
            0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
            // Top
            0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
            // Bottom
            0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
            // Right
            1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            // Left
            -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
        ],
    },
    WEDGE: {
        positions: [

            // Back face: z = 0
            0.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.5, 1.0, 0.0,
            0.5, 0.0, 0.0,

            // Left face: x = 0
            0.0, 0.0, 0.0,
            0.0, 0.0, 0.5,
            0.0, 1.0, 0.5,
            0.0, 1.0, 0.0,

            // Diagonal face: x + z = 0.5
            0.5, 0.0, 0.0,
            0.5, 1.0, 0.0,
            0.0, 1.0, 0.5,
            0.0, 0.0, 0.5,

            // Top face: y = 1
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.5,
            0.5, 1.0, 0.0,

            // Bottom face: y = 0
            0.0, 0.0, 0.0,
            0.5, 0.0, 0.0,
            0.0, 0.0, 0.5,

        ],

        indices: [

            // Back
            0, 1, 2,
            0, 2, 3,

            // Left
            4, 5, 6,
            4, 6, 7,

            // Diagonal
            8, 9, 10,
            8, 10, 11,

            // Top
            12, 13, 14,

            // Bottom
            15, 16, 17,

        ],

        textureCoordinates: [

            // Back: width 0.5, height 1
            0.0, 0.0,
            0.0, 1.0,
            0.5, 1.0,
            0.5, 0.0,

            // Left: depth 0.5, height 1
            0.0, 0.0,
            0.5, 0.0,
            0.5, 1.0,
            0.0, 1.0,

            // Diagonal: length sqrt(0.5)
            0.0, 0.0,
            0.0, 1.0,
            0.7071067812, 1.0,
            0.7071067812, 0.0,

            // Top
            0.0, 0.0,
            0.0, 0.5,
            0.5, 0.0,

            // Bottom
            0.0, 0.0,
            0.5, 0.0,
            0.0, 0.5,

        ],

        vertexNormals: [

            // Back: -Z
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,

            // Left: -X
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,

            // Diagonal: normalized (+X, 0, +Z)
            0.7071067812, 0.0, 0.7071067812,
            0.7071067812, 0.0, 0.7071067812,
            0.7071067812, 0.0, 0.7071067812,
            0.7071067812, 0.0, 0.7071067812,

            // Top: +Y
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,

            // Bottom: -Y
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,

        ],

    },
};

//END
console.log(`%cELEMENT ${ELEMENT.VERSION} loaded.`, ELEMENT.CSS);