/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */
"use strict";

/////////////////////AI.js///////////////
/* 

AI, Behaviour routines for grid and 3d based games           
                                           
dependencies: 
  Prototype LS 
  ENGINE      
  GRID
        
*/
//////////////////////////////////////////
/*  

TODO:

knownBugs:
      
*/
/////////////////////////////////////////

const AI = {
    VERSION: "3.03",
    CSS: "color: silver",
    VERBOSE: false,
    INI: {
        CHANGE_ADVANCER_TO_HUNT_MIN_DISTANCE: 3,
    },
    referenceEntity: null,
    immobileWander: true,
    changeAdvancerToHuntDistance(distance) {
        AI.INI.CHANGE_ADVANCER_TO_HUNT_MIN_DISTANCE = distance;
    },
    changeAdvancerToHuntImmediatelly() {
        this.changeAdvancerToHuntDistance(Infinity);
    },
    initialize(ref, setting = "3D3") {
        this.referenceEntity = ref;
        if (setting !== "3D" && setting !== "2D" && setting !== "3D3") setting = "2D";
        this.setting = setting;
    },
    getPosition(enemy) {
        switch (this.setting) {
            case "2D": return Grid.toClass(enemy.moveState.pos);
            case "3D": return Vector3.toGrid(enemy.moveState.pos);
            case "3D3": return Grid3D.toClass(enemy.moveState.grid);
            default: return enemy.moveState.pos;
        }
    },
    getGridValue(enemy) {
        let gridValue = GROUND_MOVE_GRID_EXCLUSION;
        if (enemy.fly > 0.0) {
            gridValue = AIR_MOVE_GRID_EXCLUSION;
        }
        return gridValue;
    },
    wanderer(enemy) {
        /**
         * works for 2D and 3D
         */
        let gridValue = this.getGridValue(enemy);
        gridValue = gridValue.sum();
        const enemyGrid = this.getPosition(enemy);
        const directions = enemy.parent.map.GA.getDirectionsIfNot(enemyGrid, gridValue, enemy.fly, enemy.moveState.dir.mirror());
        //if (AI.VERBOSE) console.info(enemy.name, enemy.id, "WANDERER", enemy.moveState.pos, "gridValue", gridValue, "dirs", directions, "this.getPosition(enemy)", this.getPosition(enemy));
        if (directions.length) {
            const randomDir = directions.chooseRandom();
            if (randomDir.constructor.name !== "Vector3D" && randomDir.constructor.name !== "Vector") throw new Error("WTF!");
            return [randomDir];
        } else {
            const fallBackDir = enemy.moveState.dir.mirror();
            const newGrid = enemyGrid.add(fallBackDir);
            if (enemy.parent.map.GA.check(newGrid, gridValue)) return this.immobile(enemy, true);
            return [fallBackDir];
        }
    },
    wanderer1D(enemy, ARG) {
        //ARG not used
        const gridValue = GRID2D_SIDEVIEW.sum();         // 1D wanderer expects to be used only in 2D games
        const enemyGrid = this.getPosition(enemy);
        const dir = enemy.parent.map.GA.continueOrFlip(enemy.moveState.dir, enemyGrid, gridValue, enemy.fly);
        return [dir];
    },
    immobile(enemy, wasWandering = false) {
        //if (this.VERBOSE) console.warn(`${enemy.name}-${enemy.id} IMMOBILE`);
        if (!wasWandering && AI.immobileWander) return this.wanderer(enemy);  // preventing endless recursion
        return [NOWAY3];
    },
    ascent(enemy) {
        //if (this.VERBOSE) console.warn(`${enemy.name}-${enemy.id} Ascending`);
        return [ABOVE3];
    },
    creep(enemy) {
        return [LEFT3];
    },
    sentinel(enemy, ARG) {
        /**
         * sentinel is immobile but shoots, and avoids friendly fire
         * shoot dir:
         */
        let playerPosition = Grid3D.toClass(ARG.playerPosition);                                    // grid coordinates
        let grid = this.getPosition(enemy);
        this.shootBullet(enemy, playerPosition, grid);
        return [NOWAY3];
    },
    interceptor(enemy, ARG) {
        /**
         * assumption: interceptor creeps in -x dir, and reduces deistance to hero, trying to reach to the same plane > line
         * assumption: shoot resolution, if no friendly fire
         */

        let _goto;
        let playerPosition = Grid3D.toClass(ARG.playerPosition);                                    // grid coordinates
        let grid = this.getPosition(enemy);                                                         //grid coordinates
        if (grid.x <= playerPosition.x) {
            //console.error("interceptor early exit", enemy.id, enemy.name);
            return [LEFT3];     //creep forward, no shooting anymore
        }

        if (probable(enemy.huntProbability)) {
            //console.log("interceptor hunting", enemy.id, enemy.name);
            const GA = enemy.parent.map.GA;
            const path = GRID.pathFromNodeMap3D(grid, GA.airNodeMap);
            const dirs = GRID.directionsFromPath(path);
            _goto = GRID.getUnifiedDirFromPathDirections(dirs);

            /** check for walls and simplify _goto */
            let nextGrid = grid.add(_goto);
            if (!GA.airNodeMap[nextGrid.x][nextGrid.y][nextGrid.z] || nextGrid.y <= 0) {
                _goto.y = 0;
                nextGrid = grid.add(_goto);
                if (!GA.airNodeMap[nextGrid.x][nextGrid.y][nextGrid.z]) _goto.z = 0;
            }
        } else {
            //console.info("interceptor creeping", enemy.id, enemy.name);
            _goto = LEFT3;
        }

        //if (this.VERBOSE) console.info(`...${enemy.name}-${enemy.id} interceptor -> _goto:`, JSON.stringify(_goto), "strategy", enemy.behaviour.strategy, "_goto cons", _goto.constructor.name);

        this.shootBullet(enemy, playerPosition, grid);

        return [_goto];

    },
    shootBullet(enemy, playerPosition, grid) {
        const dX = grid.x - playerPosition.x;

        //console.warn("can enemy shoots?, dX", dX, dX <= enemy.shootDistance);

        if (dX > enemy.shootDistance) {
            enemy.canShoot = false;
            return;
        }

        const IA = enemy.parent.map.enemyIA;
        let sourceIndex = IA.gridToIndex(grid);

        /** only if the creep direction is clear, no friendly fire allowed */
        if (IA.emptyGrids(sourceIndex - dX, dX)) {
            enemy.canShoot = true;
            //console.warn("shootBullet from", grid, "to", playerPosition);
            return;
        }
        enemy.canShoot = false;
    },
    hunt(enemy, exactPosition) {
        if (this.VERBOSE) console.warn("...hunt", enemy.name, enemy.id, "exactPosition", exactPosition);
        if (exactPosition.hasOwnProperty("exactPlayerPosition")) exactPosition = exactPosition.exactPlayerPosition;
        let nodeMap = enemy.parent.map.GA.nodeMap;
        let grid = this.getPosition(enemy);
        if (this.VERBOSE) console.log(".....enemy position grid", grid);
        let _goto = nodeMap[grid.x][grid.y][grid.z]?._goto || NOWAY3;
        if (this.VERBOSE) console.info(`...${enemy.name}-${enemy.id} hunting -> _goto:`, _goto, "strategy", enemy.behaviour.strategy, "node", JSON.stringify(nodeMap[grid.x][grid.y][grid.z]));
        if (GRID.same3D(_goto, NOWAY3) && (this.setting === "3D" || this.setting === "3D3")) return this.hunt_FP(enemy, exactPosition);
        return [_goto];
    },
    hunt_FP(enemy, exactPosition) {
        if (this.VERBOSE) console.error(enemy.name, enemy.id, "..hunt_FP: exactPosition", exactPosition, "distance:", enemy.distance, "enemy.moveState.pos", enemy.moveState.pos);
        if (!enemy.distance) {
            if (this.VERBOSE) console.warn("..terminating hunt - null distance");
            return this.immobile(enemy);
        }

        const enemyPos = this.getPosition(enemy);
        const player3DGrid = Vector3.to_Grid3D(exactPosition);
        if (!GRID.sameFloor(enemyPos, player3DGrid)) return this.immobile(enemy);

        /** this is still 2D plane , only works if they are on the same plane */
        const pPos = Vector3.to_FP_Grid(exactPosition);
        const ePos = Vector3.to_FP_Grid(enemy.moveState.pos);
        const direction = ePos.direction(pPos);
        let orto = direction.ortoAlign();
        orto = orto.toVector3D();                                               // adding z=0 for 3D compatibility, but this still only works on the plane!!!
        const landingGrid = Grid3D.toClass(enemy.moveState.endPos.add(orto));   //move was just completed, so endPos!!
        const GA = enemy.parent.map.GA;
        const nextGridBlocked = GA.check(landingGrid, GROUND_MOVE_GRID_EXCLUSION.sum());
        if (nextGridBlocked) return this.immobile(enemy);

        if (this.VERBOSE) console.log("pPos", pPos, "ePos", ePos, "direction", direction, "enemy.distance", enemy.distance, "enemy.moveState.startPos", enemy.moveState.startPos, "orto", orto, "landingGrid", landingGrid, "nextGridBlocked", nextGridBlocked);
        if (this.VERBOSE) console.info(`${enemy.name}-${enemy.id} FP hunt`, orto, "strategy", enemy.behaviour.strategy);

        return [orto];
    },
    hunt2D(enemy, player) {
        if (this.VERBOSE) console.warn("...hunt", enemy.name, enemy.id, "player", player);
        const nodeMap = enemy.parent.map.GA.nodeMap;
        let grid = this.getPosition(enemy);
        if (this.VERBOSE) console.log(".....enemy position grid", grid);
        let _goto = nodeMap[grid.x][grid.y]?.goto || NOWAY;
        if (this.VERBOSE) console.info(`...${enemy.name}-${enemy.id} hunting2D -> _goto:`, _goto, "strategy", enemy.behaviour.strategy, "node", JSON.stringify(nodeMap[grid.x][grid.y]));
        return [_goto];
    },
    crossroader(enemy, playerPosition, dir, block, exactPosition) {
        playerPosition = Grid3D.toClass(playerPosition);
        if (this.VERBOSE) console.log("\n------------------------------");
        if (this.VERBOSE) console.info(`Crossroader analysis for ${enemy.name}-${enemy.id}, player position: ${JSON.stringify(playerPosition)}, enemy.ms.endPos: ${JSON.stringify(enemy.moveState.endPos)}`);

        let goal, _;
        [goal, _] = enemy.parent.map.GA.findNextCrossroad(playerPosition, dir, enemy.fly);
        if (this.VERBOSE) console.log(`.. ${enemy.name}-${enemy.id} goal`, goal, "strategy", enemy.behaviour.strategy);

        if (goal === null || enemy.parent.map.GA.isOutOfBounds(goal)) {
            return this.hunt(enemy, exactPosition);
        }

        const goalNode = enemy.parent.map.GA.nodeMap[goal.x][goal.y][goal.z];
        if (!goalNode) return this.hunt(enemy, exactPosition);

        /** what if goal takes you further away - advancer! */
        const new_distance = goalNode.distance;
        if (this.VERBOSE) console.warn(`.. ${enemy.name}-${enemy.id} new_distance  from goal`, new_distance, "current distance", enemy.distance);
        if (enemy.distance < this.INI.CHANGE_ADVANCER_TO_HUNT_MIN_DISTANCE && new_distance > enemy.distance) {
            if (this.VERBOSE) console.warn("... overriding behavior -> hunt");
            return this.hunt(enemy, exactPosition);
        }

        const gridValue = this.getGridValue(enemy);
        const Astar = enemy.parent.map.GA.findPath_AStar_fast(this.getPosition(enemy), goal, gridValue, "exclude", enemy.fly, block);
        if (this.VERBOSE) console.log(`.. ${enemy.name}-${enemy.id} Astar`, Astar);

        if (Astar === null) return this.immobile(enemy);
        if (Astar === 0) return this.hunt(enemy, exactPosition);

        let path = GRID.pathFromNodeMap3D(goal, Astar);
        let directions = GRID.directionsFromPath(path, 1);
        return directions;
    },
    hunter(enemy, ARG) {
        return this.hunt(enemy, ARG.exactPlayerPosition);
    },
    hunter2D(enemy, ARG) {
        return this.hunt2D(enemy, ARG.player);
    },
    follower(enemy, ARG) {
        return this.crossroader(enemy, ARG.playerPosition, ARG.currentPlayerDir.mirror(), ARG.block, ARG.exactPlayerPosition);
    },
    advancer(enemy, ARG) {
        return this.crossroader(enemy, ARG.playerPosition, ARG.currentPlayerDir, ARG.block, ARG.exactPlayerPosition);
    },
    runAway(enemy) {
        console.error("running away - untested", enemy);
        let nodeMap = enemy.parent.map.GA.nodeMap;
        let grid = this.getPosition(enemy);
        let directions = enemy.parent.map.GA.getDirectionsFromNodeMap(grid, nodeMap, enemy.fly, nodeMap[grid.x][grid.y][grid.z]._goto);
        directions.push(NOWAY3);
        let distances = [];
        for (const dir of directions) {
            let nextGrid = grid.add(dir);
            distances.push(nodeMap[nextGrid.x][nextGrid.y][nextGrid.z].distance);
        }
        let maxDistance = Math.max(...distances);
        return [directions[distances.indexOf(maxDistance)]];
    },
    _goto(enemy) {
        const gridValue = this.getGridValue(enemy);
        const goal = enemy.guardPosition; // should be set in SPAWN!
        const Astar = enemy.parent.map.GA.findPath_AStar_fast(this.getPosition(enemy), goal, gridValue, "exclude", enemy.fly);

        if (Astar === null) {
            return this.immobile(enemy);
        }
        if (Astar === 0) {
            if (enemy.behaviour.complex("passive")) {
                enemy.behaviour.cycle("passive");
                enemy.behaviour.strategy = enemy.behaviour.getPassive();
                return this.immobile(enemy);
            } else {
                //should be obsolete
                console.error("This should have never happened to", enemy);
                return this.hunt(enemy);
            }
        }

        let path = GRID.pathFromNodeMap3D(goal, Astar);
        let directions = GRID.directionsFromPath(path);
        return directions;
    },
    circler(enemy) {
        /** not updated to 3D !!!! */
        let currentGrid = this.getPosition(enemy);
        let gridPath = [currentGrid];
        let firstDir = ENGINE.directions.chooseRandom();
        const rs = randomSign();
        let index = firstDir.isInAt(ENGINE.circle);
        for (let off = 0; off < ENGINE.circle.length + 1; off++) {
            let curIndex =
                (ENGINE.circle.length + index + rs * off) % ENGINE.circle.length;
            gridPath.push(currentGrid.add(ENGINE.circle[curIndex]));
        }
        gridPath.push(currentGrid);
        let directions = GRID.directionsFromPath(gridPath);
        return directions;
    },
    shoot(enemy, ARG) {
        //console.info("********************** SHOOT **********************");
        if (this.VERBOSE) console.warn(`..${enemy.name}-${enemy.id} tries to shoot.`);
        if (enemy.caster) {
            if (enemy.mana >= Missile.calcMana(enemy.magic)) {

                const GA = enemy.parent.map.GA;
                const IA = enemy.parent.map.enemyIA;
                const enemyPos = this.getPosition(enemy);
                const player3DGrid = Vector3.to_Grid3D(ARG.exactPlayerPosition);

                if ((enemy.shoot3D || GRID.sameFloor(enemyPos, player3DGrid)) && GRID.vision3D(enemyPos, player3DGrid, GA) && GRID.freedom3D(enemyPos, player3DGrid, IA)) enemy.canShoot = true;
                if (this.VERBOSE) console.info(`..${enemy.name}-${enemy.id} can shoot: ${enemy.canShoot}`);

                if (enemy.distance) {
                    return this.hunt(enemy, ARG.exactPlayerPosition);
                } else return this.immobile(enemy);

            } else {
                this.caster = false;
                if (enemy.weak()) {
                    enemy.behaviour.set("active", "runAway");
                } else {
                    enemy.behaviour.set("active", "hunt");
                }
                return this.immobile(enemy);
            }
        } else {
            return this.keepTheDistance(enemy, ARG);
        }
    },
    keepTheDistance(enemy, ARG) {
        //console.info("############# KEEPING THE DISTANCE ##############");
        const map = enemy.parent.map;
        const grid = this.getPosition(enemy);
        const playerGrid = Grid3D.toClass(ARG.playerPosition);
        const directions = map.GA.getDirectionsFromNodeMap(grid, map.GA.nodeMap, enemy.fly);
        let possible = [];
        let max = [];
        let curMax = 0;
        for (let i = 0; i < directions.length; i++) {
            const test = grid.add(directions[i]);
            const distance = test.distanceDiagonal(playerGrid);
            if (distance === enemy.stalkDistance) possible.push(directions[i]);
            if (distance > curMax) {
                max.clear();
                curMax = distance;
                max.push(directions[i]);
            } else if (distance === curMax) max.push(directions[i]);
        }
        if (possible.length > 0) {
            return [possible.chooseRandom()];
        } else if (max.length > 0) {
            return [max.chooseRandom()];
        } else return this.immobile(enemy);
    },
    shadower(enemy, ARG) {
        /** not updated to 3D !!!! */
        let gridValue = this.getGridValue(enemy);
        const directions = enemy.parent.map.GA.getDirectionsIfNot(this.getPosition(enemy), gridValue, enemy.moveState.dir.mirror());
        if (directions.length === 1) return [directions[0]];
        if (enemy.moveState.goingAway(ARG.MS) || enemy.moveState.towards(ARG.MS, enemy.tolerance)) {
            //if going away or not coming towards, take HERo's dir if possible
            if (ARG.MS.dir.isInAt(directions) !== -1) {
                return [ARG.MS.dir];
            }
        } else {
            //else take opposite dir
            let contra = ARG.MS.dir.mirror();
            if (contra.isInAt(directions) !== -1) {
                return [contra];
            }
        }
        //remaining: take direction in which the distance is largest
        let solutions = enemy.moveState.endGrid.directionSolutions(ARG.MS.homeGrid);
        let selected = solve();
        if (selected) return [selected];
        return [directions.chooseRandom()];

        function solve() {
            for (let q = 0; q < 2; q++) {
                if (solutions[q].dir.isInAt(directions) !== -1)
                    return solutions[q].dir;
            }
            return null;
        }
    },
    prophet(enemy, ARG) {
        /** not updated to 3D !!!! */
        let firstCR, lastDir;
        [firstCR, lastDir] = enemy.parent.map.GA.findNextCrossroad(ARG.playerPosition, ARG.currentPlayerDir, enemy.fly);
        let directions = enemy.parent.map.GA.getDirectionsIfNot(firstCR, MAPDICT.WALL, enemy.fly, lastDir.mirror());
        let crossroads = [];
        let secondCR, _;
        for (let dir of directions) {
            [secondCR, _] = enemy.parent.map.GA.findNextCrossroad(firstCR.add(dir), dir, enemy.fly);
            crossroads.push(secondCR);
        }
        let distances = [];
        let paths = [];
        let gridValue = this.getGridValue(enemy);
        for (let cross of crossroads) {
            const Astar = enemy.parent.map.GA.findPath_AStar_fast(this.getPosition(enemy), cross, gridValue, "exclude", enemy.fly, ARG.block);

            if (Astar === null) {
                return this.immobile(enemy);
            }
            if (Astar === 0) {
                return this.hunt(enemy, ARG.exactPlayerPosition);
            }

            distances.push(Astar[cross.x][cross.y].path);
            paths.push(Astar);
        }

        let minIndex = distances.indexOf(Math.min(...distances));
        let path = GRID.pathFromNodeMap(crossroads[minIndex], paths[minIndex]);
        let finalDirections = GRID.directionsFromPath(path, 1);
        return finalDirections;
    },
};

class Behaviour {
    constructor(
        passsiveDistance = 7,
        passiveQueue = ["wanderer"],
        activeDistance = 4,
        activeQueue = ["hunt"]
    ) {
        this.passive = {};
        this.active = {};
        this.passive.distance = passsiveDistance;
        this.passive.queue = passiveQueue;
        this.active.distance = activeDistance;
        this.active.queue = activeQueue;
        this.strategy = this.getPassive();
        this.passiveInitial = this.passive.queue[0];
        console.assert(this.active.distance < this.passive.distance, this);
    }
    set(type, behaviour) {
        this[type].queue = [behaviour];
        this.strategy = behaviour;
    }
    complex(type) {
        return this[type].queue.length > 1;
    }
    cycle(type) {
        this[type].queue.push(this[type].queue.shift());
    }
    getPassive() {
        return this.passive.queue[0];
    }
    getActive() {
        return this.active.queue[0];
    }
    restorePassive() {
        while (this.getPassive() !== this.passiveInitial) {
            this.cycle("passive");
        }
    }
    manage(enemy, distance, passiveFlag = false) {
        if (passiveFlag || !distance) {
            this.strategy = this.getPassive();
            return;
        }
        if (distance <= this.active.distance && this.strategy === this.getPassive()) {
            this.strategy = this.getActive();
            enemy.dirStack.clear();
        }
        if (distance >= this.passive.distance && this.strategy === this.getActive()) {
            if (this.complex("passive")) {
                this.restorePassive();
            }
            this.strategy = this.getPassive();
            enemy.dirStack.clear();
        }
        if (AI.VERBOSE) console.info("Behavior strategy selected:", this.strategy, "for distance", distance);
        return;
    }
}

//END
console.log(`%cAI ${AI.VERSION} loaded.`, AI.CSS);