/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */
"use strict";

///////////////////////////////////////////////
//                                           //
//           LS matrix                       //
//          uses glMatrix                    //
//           wraps glMatrix and extends      //
// it for use with other LS libs             //
//                                           //
///////////////////////////////////////////////

/**
 * https://glmatrix.net/docs/
 */

const LS_matrix = {
    VERSION: "1.5",
    CSS: "color: red",
};

class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.array = glMatrix.vec3.fromValues(x, y, z);
        this.refresh();
    }
    static from_grid3D(grid) {
        return new Vector3(grid.x, grid.z, grid.y);         //swaps y and Z, ignores FP and INT, works for both
    }
    static from_array(arr) {
        return new Vector3(arr[0], arr[1], arr[2]);
    }
    static from_2D_dir(dir, y = 0) {
        return new Vector3(dir.x, y, dir.y);
    }
    static from_3D_dir(dir) {
        return new Vector3(dir.x, dir.z, dir.y);            //swaps y and Z
    }
    static from_Grid(grid, y = 0) {
        return new Vector3(grid.x, y, grid.y);
    }
    static to_FP_Grid(v) {
        return new FP_Grid(v.x, v.z);
    }
    static toGrid(v) {
        return new Grid(v.x, v.z);
    }
    static toVector(v) {
        return new Vector(v.x, v.z);
    }
    static to_FP_Vector(v) {
        return new FP_Vector(v.x, v.z);
    }
    static to_Grid3D(v) {
        return new Grid3D(v.x, v.z, v.y);                   //swaps y and Z
    }
    static to_FP_Grid3D(v) {
        return new FP_Grid3D(v.x, v.z, v.y);                //swaps y and Z
    }
    static to_Vector3D (v){
        return new Vector3D(v.x, v.y, v.z);                 //y,z keeping position
    }
    same(vector3) {
        return (
            this.x === vector3.x &&
            this.y === vector3.y &&
            this.z === vector3.z
        );
    }
    refresh() {
        this.x = this.array[0];
        this.y = this.array[1];
        this.z = this.array[2];
    }
    toArray() {
        this.array = new Float32Array([this.x, this.y, this.z]);
    }
    clone() {
        return new Vector3(this.x, this.y, this.z);
    }
    set_x(x) {
        this.x = x;
        this.toArray();
    }
    set_y(y) {
        this.y = y;
        this.toArray();
    }
    set_z(z) {
        this.z = z;
        this.toArray();
    }
    add_x(x) {
        this.x += x;
        this.toArray();
    }
    add_y(y) {
        this.y += y;
        this.toArray();
    }
    add_z(z) {
        this.z += z;
        this.toArray();
    }
    toPoint() {
        let grid = new FP_Grid(this.x, this.z);
        return grid.toPoint();
    }
    rotate2D(rad) {
        let FPV = new FP_Vector(this.x, this.z);
        return FPV.rotate(rad);
    }
    rotateY(rad) {
        return Vector3.from_2D_dir(this.rotate2D(rad), this.y);
    }
    reverse2D() {
        return Vector3.from_2D_dir(this.rotate2D(Math.PI), this.y);
    }
    translate(vector, length = 1) {
        let x = this.x + length * vector.x;
        let y = this.y + length * vector.y;
        let z = this.z + length * vector.z;
        return new Vector3(x, y, z);
    }
    add(vector, factor = 1) {
        let x = this.x + vector.x * factor;
        let y = this.y + vector.y * factor;
        let z = this.z + vector.z * factor;
        return new Vector3(x, y, z);
    }
    sub(vector, factor = 1) {
        let x = this.x - vector.x * factor;
        let y = this.y - vector.y * factor;
        let z = this.z - vector.z * factor;
        return new Vector3(x, y, z);
    }
    mul(factor) {
        let x = this.x *= factor;
        let y = this.y *= factor;
        let z = this.z *= factor;
        return new Vector3(x, y, z);
    }
    direction(vector) {
        let x = vector.x - this.x;
        let y = vector.y - this.y;
        let z = vector.z - this.z;
        if ([x * x, y * y, z * z].sum() < 1e-6) return new Vector3(0, 0, 0);
        let out = glMatrix.vec3.create();
        glMatrix.vec3.normalize(out, [x, y, z]);
        return Vector3.from_array(out);
    }
    dot(vector) {
        return this.x * vector.x + this.y * vector.y + this.z * vector.z;
    }
    scaleVec3(vec3) {
        if (vec3.constructor.name === "Vector3") vec3 = vec3.array;                   //support arrays and Vector3
        let x = this.x * vec3[0];
        let y = this.y * vec3[1];
        let z = this.z * vec3[2];
        return new Vector3(x, y, z);
    }
    EuclidianDistance(Vector3) {
        return glMatrix.vec3.distance(this.array, Vector3.array);
    }
    normalize(vector3) {
        let out = glMatrix.vec3.create();
        glMatrix.vec3.normalize(out, vector3);
        return Vector3.from_array(out);
    }

    /**
     *
     * @static
     * @param {*} vector3
     * @return {Vector3}  face normal based on dominant dimension, this is not OK in ALL scenarios!
     * @memberof Vector3
     */
    static getFaceNormal(vector3) {
        const arr = vector3.array.map(v => Math.abs(v));
        const maxIndex = arr.indexOf(Math.max(...arr));
        const normal = [0, 0, 0];
        normal[maxIndex] = Math.sign(vector3.array[maxIndex]);
        return Vector3.from_array(normal);
    }

    /**
     * reflectedVector = incomingVector−2 * (incomingVector * surfaceNormal) * surfaceNormal
     *
     * @param {*} surfaceNormal
     * @return {Vector3}  reflected  vector
     * @memberof Vector3
     */
    reflect(surfaceNormal) {
        let reflectedVector = glMatrix.vec3.create();
        let p2 = glMatrix.vec3.create();
        glMatrix.vec3.scale(p2, surfaceNormal.array, -2 * glMatrix.vec3.dot(this.array, surfaceNormal.array));
        glMatrix.vec3.add(reflectedVector, this.array, p2);
        return Vector3.from_array(reflectedVector);
    }

    /**
     *
     * adjusts circle projection inside grid, by calling FP_Grid3D method adjuctCirclePos(r)
     * @param {*} r - entity radius
     * @return {Vector3} 
     * @memberof Vector3
     */
    adjuctCirclePos(r) {
        let FP_grid = Vector3.to_FP_Grid3D(this);
        FP_grid.adjuctCirclePos(r);
        return Vector3.from_grid3D(FP_grid);
    }
}

/** Global Constants */
const DIR_DOWN = Vector3.from_array(glMatrix.vec3.fromValues(0, -1, 0));
const DIR_UP = Vector3.from_array(glMatrix.vec3.fromValues(0, 1, 0));
const DIR_NOWAY = Vector3.from_array(glMatrix.vec3.fromValues(0, 0, 0));
const DIR_FORWARD = Vector3.from_array(glMatrix.vec3.fromValues(1, 0, 0));
const DIR_BACKWARD = Vector3.from_array(glMatrix.vec3.fromValues(-1, 0, 0));
const DIR_RIGHT = Vector3.from_array(glMatrix.vec3.fromValues(0, 0, 1));
const DIR_LEFT = Vector3.from_array(glMatrix.vec3.fromValues(0, 0, -1));
//END
console.log(`%cLS_matrix ${LS_matrix.VERSION} loaded.`, LS_matrix.CSS);