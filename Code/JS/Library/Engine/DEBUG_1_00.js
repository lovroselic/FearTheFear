/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */
/*jshint esversion: 11 */
"use strict";


const DEBUG = {
    FPS: false,
    VERBOSE: false,
    _2D_display: false,
    pos_display: false,
    BB_display: false,
    INVINCIBLE: false,
    INF_LIVES: false,
    STAY_ALIVE: false,                     // stay alive after lives == 0
    keys: false,
    max17: false,
    VERSION: "1.0",
    calledFunction() {
        const caller = new Error().stack
            ?.split("\n")[2]
            ?.trim();

        console.log("Called by:", caller);
    },
    calledStack(begin = 0, end = 3) {
        const off = 2;
        const stack = new Error().stack
            ?.split("\n")
            .filter(line => !/^Error\b/.test(line))
            .slice(off + begin, off + end)
            .join("\n");

        console.log(stack);
    },
    displaySpriteArea(area, layer = "fill") {
        ENGINE.drawArea(LAYER[layer], area, "#FF0000");
    },
    displayGridBoundaries(grid, layer = "fill") {
        const area = grid.toArea();
        ENGINE.drawArea(LAYER[layer], area, "#2e15c0");
    },
    halt(message = "HERE") {
        ENGINE.GAME.stopAnimation = true;
        throw new Error(message);
    },
    killAll() {
        console.note("Killing all enemies.");
        ENEMY2D.POOL.clear();
        ENTITY3D.POOL.clear();
    },
};

Object.seal(DEBUG);
/** *********************************************** */
console.log(`%cDEBUG ${DEBUG.VERSION} ready.`, "color: #66b612");