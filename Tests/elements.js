// -- main --
/**
 * 
 */

const EXT_MAPDICT = {
    // 1-255 shape index    ; 2**0 - 2**8 -1
    SHAPE_MASK: 0b0000000011111111, //255
    WEDGE: 1,

    // unused
    UNUSED8: 2 ** 8,                // 256
    UNUSED9: 2 ** 9,                // 512
    UNUSED10: 2 ** 10,              // 1024

    USED: 2 ** 11,                  // 2048, 0 EGA not used, 1 EGA used
    YAW_SHIFT: 12,
    YAW_MASK: 0b0011000000000000,
    YAW_MASK1: 2 ** 12,             // 4096,  0, +0°, 1: +90°
    YAW_MASK2: 2 ** 13,             // 8192,  0, +0°, +180°
    FLIP_SHIFT: 14,
    FLIP_MASK: 0b0100000000000000,
    FLIP: 2 ** 14,                  // 16384: 0, floor, 1 ceiling

    BLOCKED15: 2 ** 15,             // 32768 - keep unset for safe serialization
    getShapeIndex(val) {
        return val & this.SHAPE_MASK;
    },
    yawToAngle(yaw) {
        let angle = yaw & this.YAW_MASK;
        angle >>>= this.YAW_SHIFT;
        return angle * 90;
    },
    angleToYaw(angle) {
        let yaw = (angle / 90) >>> 0;
        yaw <<= this.YAW_SHIFT;
        return yaw;
    },
    toFlip(flip) {
        flip <<= this.FLIP_SHIFT;
        return flip;
    },
    getFlip(value) {
        let flip = value & this.FLIP_MASK;
        flip >>>= this.FLIP_SHIFT;
        return flip;
    },
    set(shapeIndex, angle, flip = 0) {
        shapeIndex &= this.SHAPE_MASK;
        console.warn(shapeIndex);
        let value = shapeIndex | this.angleToYaw(angle);
        console.warn("..value, this.angleToYaw(angle)", value, this.angleToYaw(angle));
        value |= this.toFlip(flip);
        console.warn("..value, this.toFlip(flip)", value, this.toFlip(flip));
        value |= this.USED;
        return value;

    },
    getAll(value) {
        return [this.getShapeIndex(value), this.yawToAngle(value), this.getFlip(value)];
    },
    isUsed(value) {
        return value & this.USED;
    },
};



$(function () {
    console.clear();
    console.info("*****************************************");
    console.info("*****************************************");

    const testShape = 3;
    console.log("testShape", EXT_MAPDICT.getShapeIndex(testShape));
    const yawTest = 0b0011000000000000;
    console.log("yawTest", EXT_MAPDICT.yawToAngle(yawTest));
    const angleTest = 270;
    console.log("angleTest", EXT_MAPDICT.angleToYaw(angleTest), EXT_MAPDICT.angleToYaw(angleTest) === yawTest);

    const flipTest = 1;
    console.log("flipTest", EXT_MAPDICT.toFlip(flipTest));

    const finalTest1 = EXT_MAPDICT.set(5, 180, 1);
    console.log("finalTest1", finalTest1);
    const [index, angle, flip] = EXT_MAPDICT.getAll(finalTest1);
    console.log("index, angle, flip", index, angle, flip);

    console.info("*****************************************");
});