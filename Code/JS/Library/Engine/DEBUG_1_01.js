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
    AUTO_TEST: false,
    VERSION: "1.1",
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
    displayInv() {
        HERO.inventory.scroll.display();
        const list = [];
        for (const item of HERO.inventory.item) {
            list.push(item.name);
        }
        console.info("items", list);
        console.log(`"${list.join('", "')}"`);
    },
    killStatus() {
        console.log("-------------------------------------------");
        console.warn("level:", GAME.level, "totalKills", MAP[GAME.level].map.totalKills, "killsRequiredToStopSpawning", MAP[GAME.level].map.killsRequiredToStopSpawning, "stopped", MAP[GAME.level].map.stopSpawning, "delay", MAP[GAME.level].map.spawnDelay,
            "killCount", MAP[GAME.level].map.killCount, "killCountdown", MAP[GAME.level].map.killCountdown, "maxSpawned", MAP[GAME.level].map.maxSpawned, "lairs:", LAIR.POOL.length
        );
        console.info("monsterList", MAP[GAME.level].monsterList);
    },
    displayCompleteness() {
        console.log("-------------------------------------------");
        console.log("HERO position", Vector3.toGrid(HERO.player.pos));
        const remains = ITEM3D.POOL.filter(el => el.active);
        if (remains.length > 0) {
            console.log("remains", remains);
            console.log("---- remaining items ----");
            for (const item of remains) {
                console.log(item.id, item.name, item.grid, item.instanceIdentification, "category", item.category);
            }
        }
        console.log("-------------------------------------------");
        const int_decals = INTERACTIVE_DECAL3D.POOL.filter(el => el.interactive);
        if (int_decals.length > 0) {
            console.log("int_decals", int_decals);
            for (const ent of int_decals) {
                console.log(ent.id, ent.name, ent.grid, "wants", ent.wants, "gives", ent.gives, "which", ent.which, "int.cat", ent.interactionCategory, "price", ent.price);
            }
        }
        console.log("-------------------------------------------");
        const dynamic = DYNAMIC_ITEM3D.POOL.filter(el => el);
        if (dynamic.length > 0) {
            console.log("dynamic", dynamic);
            for (const din of dynamic) {
                console.log(din.id, din.name, din.grid);
            }
        }
        console.log("-------------------------------------------");
        for (const gate of INTERACTIVE_BUMP3D.POOL) {
            console.log(gate.name, gate.grid, gate.destination.level, gate.color, "dest", gate.destination, "to", MAP[gate.destination.level].name);
        }

        console.info("**** HERO experience ****");
        console.log("------ EXP ------");
        for (const type of ["attack", "defense", "magic"]) {
            console.log(type, ":", HERO[`${type}Exp`], " /", HERO[`${type}ExpGoal`]);
        }
        console.log("------------");
    },
    dropItem(name) {
        for (const [index, item] of HERO.inventory.item.entries()) {
            if (item.name === name) {
                HERO.inventory.item.splice(index, 1);
                console.warn("..removed", index, item);
                break;
            }
        }
        TITLE.keys();
    },
    getItem(name) {
        const item = new NamedInventoryItem(name, name);
        HERO.inventory.item.push(item);
        console.warn("..added", item);
        TITLE.keys();
    },

    //testing
    automaticTests(maxLevel) {
        console.time("automaticTests");
        console.info("***** Automatic level testing *****");
        for (let level = 1; level <= maxLevel; level++) {
            console.log("testing level", level);
            GAME.level = level;
            GAME.levelStart();
            GAME.frameDraw(17);
        }
        console.info("***** Automatic level testing END *****");
        console.timeEnd("automaticTests");
    },

    //function placeholders
    checkPoint() { },

};

Object.seal(DEBUG);
/** *********************************************** */
console.log(`%cDEBUG ${DEBUG.VERSION} ready.`, "color: #66b612");