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
    VERSION: "4.00",
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
    getNodeMap(enemy) {
        const GA = enemy.parent.map.GA;
        return enemy.fly > 0 ? GA.airNodeMap : GA.nodeMap;
    },
    getMoveGrid(enemy) {
        if (this.setting === "3D3" && !(enemy.fly > 0)) {
            return enemy.moveState.getFeetGrid();
        }
        return this.getPosition(enemy);
    },
    getNode(nodeMap, grid) {
        return this.setting === "3D3"
            ? nodeMap[grid.x]?.[grid.y]?.[grid.z]
            : nodeMap[grid.x]?.[grid.y];
    },
    getDirections(enemy, leaveOut = null, grid = this.getMoveGrid(enemy)) {
        const GA = enemy.parent.map.GA;
        return this.setting === "3D3"
            ? GA.getDirectionsIfNot(grid, enemy.fly, leaveOut)
            : GA.getDirectionsFromNodeMap(grid, this.getNodeMap(enemy), leaveOut);
    },
    findPath(enemy, goal, block = []) {
        return enemy.parent.map.GA.findPath_AStar_nodeMap(
            this.getMoveGrid(enemy), goal, this.getNodeMap(enemy), enemy.fly, block
        );
    },
    getPathDirections(goal, nodeMap, cut = false) {
        const path = this.setting === "3D3"
            ? GRID.pathFromNodeMap3D(goal, nodeMap)
            : GRID.pathFromNodeMap(goal, nodeMap);
        return GRID.directionsFromPath(path, cut);
    },
    wanderer(enemy) {
        let directions = this.getDirections(enemy, enemy.moveState.dir.mirror());
        if (!directions.length) directions = this.getDirections(enemy);
        if (!directions.length) return this.immobile(enemy, true);
        return [directions.chooseRandom()];
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
        let grid = this.getPosition(enemy);                                                         // grid coordinates
        if (grid.x <= playerPosition.x) {
            return [LEFT3];                                                                         // creep forward, no shooting anymore
        }

        if (probable(enemy.huntProbability)) {
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
            _goto = LEFT3;
        }

        //if (this.VERBOSE) console.info(`...${enemy.name}-${enemy.id} interceptor -> _goto:`, JSON.stringify(_goto), "strategy", enemy.behaviour.strategy, "_goto cons", _goto.constructor.name);
        this.shootBullet(enemy, playerPosition, grid);
        return [_goto];

    },
    shootBullet(enemy, playerPosition, grid) {
        const dX = grid.x - playerPosition.x;

        if (dX > enemy.shootDistance) {
            enemy.canShoot = false;
            return;
        }

        const IA = enemy.parent.map.enemyIA;
        let sourceIndex = IA.gridToIndex(grid);

        /** only if the creep direction is clear, no friendly fire allowed */
        if (IA.emptyGrids(sourceIndex - dX, dX)) {
            enemy.canShoot = true;
            return;
        }
        enemy.canShoot = false;
    },
    hunt(enemy, exactPosition) {
        exactPosition = exactPosition?.exactPlayerPosition ?? exactPosition;
        const nodeMap = this.getNodeMap(enemy);
        const node = this.getNode(nodeMap, this.getMoveGrid(enemy));
        const dir = node?.goto ?? NOWAY3;

        if (GRID.same3D(dir, NOWAY3) && (this.setting === "3D" || this.setting === "3D3")) {
            return this.hunt_FP(enemy, exactPosition);
        }
        return [dir];
    },
    hunt_FP(enemy, exactPosition) {
        const node = this.getNode(this.getNodeMap(enemy), this.getMoveGrid(enemy));
        if (!exactPosition || !Number.isFinite(node?.distance)) return this.immobile(enemy);


        if (enemy.fly > 0 && this.setting === "3D3") {
            const directions = this.getDirections(enemy);
            const current = Vector3.to_FP_Grid3D(enemy.moveState.pos);
            const target = Vector3.to_FP_Grid3D(exactPosition);
            let best = null;
            let bestScore = 0;

            for (const dir of directions) {
                const score = dir.x * (target.x - current.x)
                    + dir.y * (target.y - current.y)
                    + dir.z * (target.z - current.z);
                if (score > bestScore) {
                    bestScore = score;
                    best = dir;
                }
            }
            return best ? [best] : this.immobile(enemy);
        }

        const current = Vector3.to_FP_Grid(enemy.moveState.pos);
        const target = Vector3.to_FP_Grid(exactPosition);
        if (current.same(target)) return [NOWAY3];
        return [current.direction(target).ortoAlign().toVector3D()];
    },
    hunt2D(enemy, player) {
        const node = this.getNode(this.getNodeMap(enemy), this.getMoveGrid(enemy));
        return [node?.goto ?? NOWAY];
    },
    crossroader(enemy, playerPosition, dir, block, exactPosition) {
        playerPosition = Grid3D.toClass(playerPosition);
        const GA = enemy.parent.map.GA;
        const [goal] = GA.findNextCrossroad(playerPosition, dir, enemy.fly);
        if (!goal || GA.isOutOfBounds(goal)) return this.hunt(enemy, exactPosition);

        const nodeMap = this.getNodeMap(enemy);
        const goalNode = this.getNode(nodeMap, goal);
        if (!goalNode) return this.hunt(enemy, exactPosition);

        const distance = this.getNode(nodeMap, this.getMoveGrid(enemy))?.distance;
        if (distance < this.INI.CHANGE_ADVANCER_TO_HUNT_MIN_DISTANCE && goalNode.distance > distance) {
            return this.hunt(enemy, exactPosition);
        }

        const Astar = this.findPath(enemy, goal, block);
        if (Astar === null) return this.immobile(enemy);
        if (Astar === 0) return this.hunt(enemy, exactPosition);
        return this.getPathDirections(goal, Astar, 1);
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
        const nodeMap = this.getNodeMap(enemy);
        const grid = this.getMoveGrid(enemy);
        const node = this.getNode(nodeMap, grid);
        if (!node) return this.immobile(enemy);

        const directions = this.getDirections(enemy, node.goto ?? null);
        directions.push(this.setting === "3D3" ? NOWAY3 : NOWAY);
        let best = directions[0];
        let maxDistance = -Infinity;

        for (const dir of directions) {
            const distance = this.getNode(nodeMap, grid.add(dir))?.distance;
            if (distance > maxDistance) {
                maxDistance = distance;
                best = dir;
            }
        }
        return [best];
    },
    _goto(enemy, ARG) {
        const goal = enemy.guardPosition;
        const Astar = this.findPath(enemy, goal);
        if (Astar === null) return this.immobile(enemy);

        if (Astar === 0) {
            if (enemy.behaviour.complex("passive")) {
                enemy.behaviour.cycle("passive");
                enemy.behaviour.strategy = enemy.behaviour.getPassive();
                return this.immobile(enemy);
            }
            return this.hunt(enemy, ARG?.exactPlayerPosition);
        }

        return this.getPathDirections(goal, Astar);
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
        const grid = this.getMoveGrid(enemy);
        const playerGrid = Grid3D.toClass(ARG.playerPosition);
        const directions = this.getDirections(enemy);
        const possible = [];
        let furthest = [];
        let maxDistance = -Infinity;

        for (const dir of directions) {
            const distance = grid.add(dir).distanceDiagonal(playerGrid);
            if (distance === enemy.stalkDistance) possible.push(dir);
            if (distance > maxDistance) {
                maxDistance = distance;
                furthest = [dir];
            } else if (distance === maxDistance) {
                furthest.push(dir);
            }
        }

        if (possible.length) return [possible.chooseRandom()];
        if (furthest.length) return [furthest.chooseRandom()];
        return this.immobile(enemy);
    },

    shadower(enemy, ARG) {
        const directions = this.getDirections(enemy, enemy.moveState.dir.mirror());
        if (!directions.length) return this.immobile(enemy, true);
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
        const GA = enemy.parent.map.GA;
        const [firstCR, lastDir] = GA.findNextCrossroad(
            ARG.playerPosition, ARG.currentPlayerDir, enemy.fly
        );
        if (!firstCR) return this.hunt(enemy, ARG.exactPlayerPosition);

        const directions = this.getDirections(enemy, lastDir.mirror(), firstCR);
        let bestGoal = null;
        let bestPath = null;
        let bestLength = Infinity;

        for (const dir of directions) {
            const [goal] = GA.findNextCrossroad(firstCR.add(dir), dir, enemy.fly);
            if (!goal) continue;

            const Astar = this.findPath(enemy, goal, ARG.block);
            if (Astar === 0) return this.hunt(enemy, ARG.exactPlayerPosition);
            if (Astar === null) continue;

            const length = this.getNode(Astar, goal).path;
            if (length < bestLength) {
                bestLength = length;
                bestGoal = goal;
                bestPath = Astar;
            }
        }

        return bestPath
            ? this.getPathDirections(bestGoal, bestPath, 1)
            : this.immobile(enemy);
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