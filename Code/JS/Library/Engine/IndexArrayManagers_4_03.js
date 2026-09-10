/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */
/*jshint esversion: 11 */
"use strict";

/*  

Raycast managers removed - will never be used again
TG refatocred to 2D

TODO:
      
*/

const IndexArrayManagers = {
    VERSION: "4.03",
    VERBOSE: false,
    DEAD_LAPSED_TIME: 5,
    DEADLY_TOUCH: false,
    EE_COLLISION_CHECK: true,
    E_WALL_COLLISION_CHECK: false,          //check enemy wall hits 
};

class IAM {
    constructor() {
        this.POOL = null;
        this.map = null;
        this.IA = null;
        this.reIndexRequired = false;
        this.reIndexSwitch = false;
        this.usingReIndex = false;
    }
    setReindex() {
        this.reIndexRequired = true;
    }
    draw() {
        for (let obj of this.POOL) {
            if (obj) obj.draw(this.map);
        }
    }
    update(lapsedTime) {
        for (let obj of this.POOL) {
            if (obj) obj.update(lapsedTime);
        }
    }
    linkMap(map) {
        this.map = map;
    }
    add(obj) {
        this.POOL.push(obj);
        obj.id = this.POOL.length;
        obj.IAM = this;
        obj.parent = this;                                  //compatibility with AI
    }
    remove(id) {
        this.POOL[id - 1] = null;
    }
    poolToIA(IA) {
        for (const obj of this.POOL) {
            if (!obj) continue;
            let grid = null;

            if (obj.moveState) {
                grid = Grid.toClass(obj.moveState.pos);
            } else if (obj.pos) {
                grid = Vector3.toGrid(obj.pos);
            } else grid = obj.grid;

            if (!IA.has(grid, obj.id)) {
                IA.next(grid, obj.id);
            }
        }
    }
    poolToIA3D(IA) {
        for (const obj of this.POOL) {
            if (!obj) continue;
            let grid = null;

            if (obj.moveState) {
                let initial = Vector3.to_Grid3D(obj.moveState.pos);
                grid = [initial];
                //console.warn(initial, grid);
                //throw "debug"; preparing for multi grid object, not yet finalized
            } else if (obj.pos) {
                grid = [Vector3.to_Grid3D(obj.pos)];
            } else if (obj.grid.constructor.name === "FP_Grid3D") {
                grid = [Grid3D.toClass(obj.grid)];
            } else grid = [obj.grid];


            for (const G of grid) {
                if (!IA.has(G, obj.id)) {
                    IA.next(G, obj.id);
                }
            }
        }
    }
    reIndex() {
        if (!this.reIndexRequired) return;
        if (this.POOL.length === 0) return;
        this.POOL = this.POOL.filter((el) => el !== null);
        for (const [index, obj] of this.POOL.entries()) {
            obj.id = index + 1;
        }
        if (this.reIndexSwitch) this.reIndexRequired = false;
    }
    init(map, hero, game) {
        this.POOL = [];
        this.linkMap(map);
        this.hero = hero || null;
        this.game = game || null;
    }
    isGridFree(grid) {
        return this.map[this.IA].empty(grid);
    }
    clearAll() {
        this.POOL = [];
    }
    show(id) {
        return this.POOL[id - 1];
    }
    associateIA(type, string) {
        if (!this.IA) this.IA = {};
        this.IA[type] = string;
    }
    associateExternal_IAM(type, pointer_to_entity) {
        if (!this.external) this.external = {};
        this.external[type] = pointer_to_entity;
    }
    associateHero(hero) {
        this.hero = hero;
    }
    setup(type = "2D", byte = 2, banks = 1) {
        let map = this.map;
        switch (type) {
            case "2D":
                map[this.IA] = new IndexArray(map.width, map.height, byte, banks);
                this.poolToIA(map[this.IA]);
                break;
            case "3D":
                map[this.IA] = new IndexArray3D(map.width, map.height, map.depth, byte, banks);
                this.poolToIA3D(map[this.IA]);
                break;
            default:
                throw new Error(`wrong type: ${type} for Index Array`);
        }
    }
    clean() {
        for (const obj of this.POOL) {
            if (obj) obj.clean();
        }
    }
    refresh() {
        this.setReindex();
        this.manage();
    }
    find(property, value) {
        for (let obj of this.POOL) {
            if (obj?.[property] === value) return obj.id;
        }
        return null;
    }
    performOnPool(func) {
        for (let obj of this.POOL) {
            if (obj) obj[func]();
        }
    }
    static checkIfProcessesComplete(IAM_list, callback) {
        for (const iam of IAM_list) {
            if (iam.POOL.length) return;
        }
        callback();
    }
    getSize(filter_null = true) {
        if (!filter_null) return this.POOL.length || null;
        const filtered = this.POOL.filter((el) => el !== null);
        return filtered.length;
    }
    exists(id) {
        if (this.POOL[id - 1]) return true;
        return false;
    }
    drawVector2D() {
        for (let obj of this.POOL) {
            if (obj && obj.depth === this.hero.player.depth) obj.drawVector2D(this.map);
        }
    }
}

/** Profile IA Managers */
class Decor extends IAM {
    constructor() {
        super();
        this.IA = "decor_IA";
    }
    poolToIA(IA) {
        return;
    }
    manage(lapsedTime) {
        return;
    }
}

class Profile_Ballistic extends IAM {
    constructor() {
        super();
        this.IA = "ballistic_IA";
        this.reIndexRequired = true;
    }
    poolToIA(IA) {
        return;
    }
    manage(lapsedTime) {
        this.reIndex();
        for (let obj of this.POOL) {
            if (obj) {
                obj.collisionBackground(this.map);
                if (obj === null) continue;
                obj.collisionEntity(this.map);
                if (obj === null) continue;
                obj.move(lapsedTime);
            }
        }
    }
}

class Profile_Actors extends IAM {
    constructor() {
        super();
        this.IA = "profile_actor_IA";
        this.reIndexRequired = true;
    }
    poolToIA(IA) {
        for (const obj of this.POOL) {
            for (let x = Math.max(0, Math.round(obj.moveState.x - obj.actor.width / 2));
                x <= Math.min(this.map.DATA.map.length - 1, Math.round(obj.moveState.x + obj.actor.width / 2));
                x++) {
                IA.next(new Grid(x, 0), obj.id);
            }
        }
    }
    manage(lapsedTime) {
        let map = this.map;
        this.reIndex();
        map[this.IA] = new IndexArray(map.planeLimits.width, 1, 4, 4);
        this.poolToIA(map[this.IA]);
        for (let obj of this.POOL) {
            if (obj && !obj.ignoreByManager) {
                obj.collisionBackground(this.map);
                if (obj === null) continue;
                obj.collisionToActors(this.map);
                if (obj === null) continue;
                obj.move(lapsedTime);
            }
        }
    }
}

/** Pixel (PX) IA Managers */

class Pixel_Actors extends IAM {
    constructor() {
        super();
        this.IA = "pixel_actor_IA";
        this.reIndexRequired = true;
    }
    manage(lapsedTime) {
        let map = this.map;
        this.reIndex();
        map[this.IA] = new IndexArray(map.planeLimits.width, map.planeLimits.height, 4, 4);
        this.poolToIA(map[this.IA]);
        for (let obj of this.POOL) {
            if (obj && !obj.ignoreByManager) {
                obj.collisionToActors(this.map);
                if (obj === null) continue;
                obj.move(lapsedTime);
            }
        }
    }
    poolToIA(IA) {
        for (const obj of this.POOL) {
            for (const grid of obj.moveState.useGrids) {
                if (!IA.has(grid, obj.id)) {
                    IA.next(grid, obj.id);
                }
            }
        }
    }
    collisionFromExternalPool(pool) {
        /**
         * actors in external pool are defined in screen pixel coordinates
         */

        for (let i = pool.length - 1; i >= 0; i--) {
            let obj = pool[i];
            if (obj) {
                const rightLimit = (this.map.planeLimits.width * ENGINE.INI.GRIDPIX) - 1;
                const bottomLimit = (this.map.planeLimits.height * ENGINE.INI.GRIDPIX) - 1;
                const point = new Point(obj.x, obj.y).limit(rightLimit, bottomLimit);
                obj.homeGrid = GRID.pointToGrid(point);
                obj.updateActor();
                let ids = this.map[this.IA].unroll(obj.homeGrid);
                for (const id of ids) {
                    const actor = PIXEL_ACTORS.show(id);
                    if (!actor) continue;
                    let hit = ENGINE.collisionArea(actor.actor, obj.actor);
                    if (hit) {
                        actor.hit(i);
                        obj.hit(i);
                    }
                }
            }
        }
    }
    purge(property, value, arg) {
        let count = 0;
        for (const obj of this.POOL) {
            if (obj) {
                if (obj[property] === value) obj.kill(arg);
                count++;
            }
        }
        return count;
    }
}

/** Texture grid IA Managers -> 2D */

class Ballistic2D extends IAM {
    constructor(enemyIA, entity_IAM) {
        super();
        this.reIndexRequired = true;
        this.enemyIA = enemyIA;
        this.entity_IAM = entity_IAM;
    }
    poolToIA(IA) {
        return;
    }
    manage(lapsedTime) {
        for (const obj of this.POOL) {
            if (obj) {
                obj.manage(lapsedTime);
                obj.collision();
            }
        }
    }
}

class Enemy2D extends IAM {
    constructor() {
        super();
        this.IA = "enemyIA";
        this.reIndexRequired = true;
    }
    poolToIA(IA) {
        for (const obj of this.POOL) {
            if (!obj) continue;

            const area = obj.sprite.area;
            const corners = [
                new Point(area.x, area.y),                              // TL
                new Point(area.x + area.w - 1, area.y),                 // TR
                new Point(area.x + area.w - 1, area.y + area.h - 1),    // BR
                new Point(area.x, area.y + area.h - 1)                  // BL
            ];

            const occupied = new Set();

            for (const corner of corners) {
                const grid = corner.to_Grid();
                const key = `${grid.x},${grid.y}`;
                if (occupied.has(key)) continue;

                occupied.add(key);
                IA.next(grid, obj.id);
            }
        }
    }
    manage(lapsedTime, reference = null) {
        let map = this.map;
        map[this.IA] = new IndexArray(map.width, map.height, 4, 4);
        this.reIndex();
        this.poolToIA(map[this.IA]);
        if (reference) {
            //console.log("reference", reference.moveState.pos);
            GRID.calcDistancesBFS_A(reference.moveState.pos, map, GRID2D_SIDEVIEW);
        }
        for (const entity of this.POOL) {
            if (entity === null) continue;
            entity.manage(lapsedTime, map[this.IA], map, reference);
            entity.setDistanceFromNodeMap(map.GA.nodeMap);
            entity.waiting = false;

            //entity translate position
            if (entity.moveState.moving) {
                if (this.hero.dead) lapsedTime = IndexArrayManagers.DEAD_LAPSED_TIME;
                entity.continueMove(lapsedTime);
                continue;
            }

            //entity/player collision - in player

            //enemy/enemy collision resolution
            if (IndexArrayManagers.EE_COLLISION_CHECK && this.enemy_enemy_collision_resolution(entity, map, lapsedTime)) continue;

            //set behaviour and move
            let distance = entity.distance;
            if (!entity.static) {
                entity.behaviour.manage(entity, distance);
                if (!entity.hasStack()) {

                    let ARG = {
                        player: reference,
                        block: []
                    };

                    entity.dirStack = AI[entity.behaviour.strategy](entity, ARG);
                    if (IndexArrayManagers.VERBOSE) console.info(`${entity.name} ${entity.id} dirStack`, entity.dirStack, "dir", entity.moveState.dir, "strategy", entity.behaviour.strategy, `distance: ${distance}`);
                }
                entity.makeMove();
            }
        }
    }
    enemy_enemy_collision_resolution(entity, map, lapsedTime) {
        const ThisGrid = entity.moveState.homeGrid;
        const EndGrid = entity.moveState.endGrid;
        const Indices = map[this.IA].unroll(ThisGrid);
        if (!GRID.same(ThisGrid, EndGrid)) {
            let add = map[this.IA].unroll(EndGrid);
            Indices.splice(0, -1, ...add);
        }
        let setIndices = new Set(Indices);
        setIndices.delete(entity.id);
        const FilteredIndices = Array.from(setIndices);
        let wait = false;
        entity.sprite.getArea();

        if (FilteredIndices.length > 0) {

            for (let e of FilteredIndices) {
                const compareEntity = this.POOL[e - 1];
                if (compareEntity.petrified) continue;
                const EE_hit = entity.sprite.area.overlap(compareEntity.sprite.area);
                if (EE_hit && compareEntity.distance < entity.distance) {
                    wait = true;
                    entity.waiting = true;
                    entity.manage(lapsedTime);
                    if (IndexArrayManagers.VERBOSE) console.info(`${entity.name}-${entity.id} waiting to continue turn`);
                    break;
                }
            }

            if (wait) return true;
        }
        return false;
    }
    resetToInitial() {
        for (const entity of this.POOL) {
            if (entity) entity.resetToInitial();
        }
    }
}

class Vanishing extends IAM {
    constructor() {
        super();
        this.IA = "vanishing_IA";
        this.reIndexRequired = true;
    }
    poolToIA(IA) {
        for (const obj of this.POOL) {
            IA.next(obj.grid, obj.id);
        }
    }
    manage(lapsedTime) {
        let map = this.map;
        map[this.IA] = new IndexArray(map.width, map.height, 1, 1);
        this.reIndex();
        this.poolToIA(map[this.IA]);
        this.size = this.POOL.length;
        this.update(lapsedTime);
    }
}

class Floor_Object extends IAM {
    /*
    can work with objects that has moveState or just grid
    */
    constructor(byte = 1, banks = 1) {
        super();
        this.IA = `floor_object_IA_${byte}_${banks}`;
        this.reIndexRequired = false;
        this.byte = byte;
        this.banks = banks;
    }
    checkCollisionToHero() {
        const IA = this.map[this.IA];
        const heroGrid = this.hero.player.moveState.homeGrid;

        if (!IA.empty(heroGrid)) {
            const itemID = IA.unroll(heroGrid);                     // by design it can be only single item
            const item = this.show(itemID);

            if (item) {
                const heroArea = this.hero.player.sprite.getArea();
                const itemArea = item.sprite.getArea();
                const hit = heroArea.overlap(itemArea);

                if (hit) {
                    this.remove(itemID);
                    return item;
                }
            }
        }
        return null;
    }
}

class Spawner extends Floor_Object {
    constructor(byte = 1, banks = 1) {
        super();
        this.IA = `spawner`;
        this.timerID = "SpawnerTimer";
        this.timer = null;
    }

    /**
     * IA is static and never changes!
     */
    setIA() {
        let map = this.map;
        map[this.IA] = new IndexArray3D(map.width, map.height, map.depth, this.byte, this.banks);
        this.poolToIA3D();
        this.poolToIA(map[this.IA]);
        this.size = this.POOL.length;
    }

    /**
     * 
     * @param {*} timeout delay between spawns
     * @param {*} assertionFunc asserts the spawning is possible
     * @param {*} spawnFunc actual spawning function
     * @param {*} reference to HERO, defaulrs to null
     */
    configure(timeout, assertionFunc, spawnFunc, reference = null) {
        this.timeout = timeout;
        this.assertionFunc = assertionFunc;
        this.spawnFunc = spawnFunc;
        this.reference = reference;
    }
    set_timeout(timeout) {
        this.timeout = timeout;
    }
    start() {
        this.cooldown();
    }
    cooldown() {
        this.timer = new CountDownMS(this.timerID, this.timeout, this.spawn.bind(this));
    }
    spawn() {
        if (this.assertionFunc()) {
            const nest = this.selectNest();
            if (nest) this.spawnFunc(nest);

        }
        this.cooldown();
    }
    selectNest() {
        /**
         * sort by path distance, 
         * visibility not asserted - that is a problem!
         * returns id of nest or null
         */
        let selected = null;
        let distance = Infinity;
        const refGrid = this.reference.moveState.homeGrid;
        GRID.calcDistancesBFS_A(refGrid, this.map);

        for (let nest of this.POOL) {
            if (nest.outOfSight()) continue;
            let nestDistance = this.map.GA.nodeMap[nest.grid.x][nest.grid.y];
            nest.distance = nestDistance.distance;
            if (nest.distance < distance) {
                distance = nest.distance;
                selected = nest.id;
            }
        }
        return selected;
    }
    stop() {
        this.timer.unregister();
    }
}

class Bump2D extends Floor_Object {
    constructor(byte = 1, banks = 1) {
        super();
        this.IA = `bump_2D`;
    }
    manage() {
        if (!this.reIndexRequired) return;
        let map = this.map;
        map[this.IA] = new IndexArray(map.width, map.height, this.byte, this.banks);
        this.reIndex();
        this.poolToIA(map[this.IA]);
        this.size = this.POOL.length;
    }
}

class Destruction_Animation extends IAM {
    constructor() {
        super();
        this.IA = "destranimIA";
        this.reIndexRequired = true;
    }
    manage(lapsedTime, map = this.map) {
        this.reIndex();
        if (map?.width && map?.height) {
            map[this.IA] = new IndexArray(map.width, map.height, 4, 4);
            this.poolToIA(map[this.IA]);
        }
        for (const anim of this.POOL) {
            if (!anim) continue;
            if (anim.movable) anim.move();
            anim.actor.updateAnimation(lapsedTime);
            if (anim.actor.animationThrough) {
                this.remove(anim.id);
            }
            if (!anim) continue;

        }
    }
}

class Changing_Animation extends IAM {
    constructor() {
        super();
        this.IA = "changeanimIA";
    }
    manage(lapsedTime, map) {
        map = map || this.map;
        map[this.IA] = new IndexArray(map.width, map.height, 4, 4);
        this.reIndex();
        this.poolToIA(map[this.IA]);
        for (const anim of this.POOL) {
            anim.change(lapsedTime);
            if (anim.complete()) {
                CHANGING_ANIMATION.remove(anim.id);
                this.setReindex();
            }
        }
    }
}

/** 3D */
class Decal_IA_3D extends IAM {
    constructor() {
        super();
        this.IA = "decalIA3D";
    }
    poolToIA(IA) {
        for (const decal of this.POOL) {
            if (decal === null) continue;
            IA.next(decal.grid, decal.id);
        }
    }
    manage() {
        let map = this.map;
        map[this.IA] = new IndexArray(map.width, map.height, 2, 1);                             //1 bank, 16bit
        this.poolToIA(map[this.IA]);
    }
    update() {
        this.manage();
    }
}

class Decal3D extends IAM {
    constructor(len = null, IA = null, ri = false) {
        super();
        this.IA = IA;
        this.reIndexRequired = ri;
        this.id_offset = null;
        this.len = len;
        if (this.len) {
            this.id_offset = GLOBAL_ID_MANAGER.offset.last();
            GLOBAL_ID_MANAGER.offset.push(this.id_offset + this.len);
            GLOBAL_ID_MANAGER.IAM.push(this);
        }
    }
    add(obj) {
        this.POOL.push(obj);
        obj.id = this.POOL.length;
        obj.IAM = this;
        obj.parent = this;
        obj.global_id = this.globalId(obj.id);
    }
    globalId(id) {
        if (this.id_offset != null) {
            return id + this.id_offset;
        }
        return null;
    }
    manage(lapsedTime) {
        this.reIndex();
        for (const item of this.POOL) {
            if (item) {
                item.manage(lapsedTime);
            }
        }
    }
    display() {
        console.log("------------------------------------------");
        console.log("Overview:", this.constructor.name);
        console.table(this.POOL, ['name', 'id', 'global_id', 'grid']);
        console.log("------------------------------------------");
    }
    checkCollisionToHero() {
        const IA = this.map.item3D;
        if (!IA) return false;

        const heroGrid = Vector3.to_Grid3D(this.hero.player.pos);

        if (!IA.empty(heroGrid)) {
            const itemID = IA.unroll(heroGrid);                     // by design it can be only single item
            const item = this.show(itemID);
            if (item) {
                const hit = GRID.collisionBoundingBox(this.hero.player.absoluteBoundingBox, item.absoluteBoundingBox);
                if (hit) {
                    this.remove(itemID);
                    return this.hero.hitObstacle();                 // required method on HERO, throw error by design if not implemented
                }
            }
        }
    }
}

class Missile3D extends IAM {
    constructor(enemyIA, entity_IAM) {
        super();
        this.IA = "missileIA";
        this.enemyIA = enemyIA;
        this.entity_IAM = entity_IAM;
        this.reIndexRequired = true;
    }
    draw() {
        for (let obj of this.POOL) {
            if (obj) obj.draw(this.map);
        }
    }
    manage(lapsedTime) {
        this.reIndex();
        this.map[this.IA] = new IndexArray3D(this.map.width, this.map.height, this.map.depth, 4, 4);
        this.poolToIA3D(this.map[this.IA]);
        const GA = this.map.GA;

        for (let obj of this.POOL) {
            if (obj) {
                obj.move(lapsedTime, GA);

                const pos = Vector3.to_FP_Grid(obj.pos);                                                                    //check wall hit
                let [wallHit, point] = obj.bounce3D ? GA.sphereInWallPoint(obj.pos, obj.dir, obj.r) : GA.entityInWallPoint(pos, Vector3.to_FP_Vector(obj.dir), obj.r, obj.depth);    //point is returned in different formats!! Vector3 or FP_Grid respectively
                //console.log(obj.id, "wallHit", wallHit, point);

                if (wallHit) {
                    obj.hitWall(this, point, GA);
                    continue;
                }

                if (this.missile_entity_collision(obj, GA)) continue;                                                       //check entity collision

                const playerHit = GRID.circleCollision3D(this.hero.player.pos, obj.pos, this.hero.player.r + obj.r);        //check player collision
                if (playerHit) {
                    this.hero.hitByMissile(obj);
                    continue;
                }

                this.missile_missile_collision(obj, GA);                                                                    //check missile to missile collision
            }
        }
    }
    missile_missile_collision(obj, GA) {
        const mIA = this.map[this.IA];
        const grid = Vector3.to_Grid3D(obj.pos);
        const possibleMissiles = mIA.unroll(grid);
        possibleMissiles.remove(obj.id);
        if (possibleMissiles.length > 0) {
            for (const id of possibleMissiles) {
                const missile = this.show(id);
                if (!missile) continue;
                if (obj.friendly === missile.friendly) continue;

                const hit = GRID.circleCollision3D(missile.pos, obj.pos, missile.r + obj.r);
                if (hit) {
                    for (const M of [obj, missile]) {
                        if (M.friendly) M.drop(GA);
                        M.explode(this);
                    }
                }
            }
        }
    }
    missile_entity_collision(obj, GA) {
        if (!obj.friendly) return false;
        const IA = this.map[this.enemyIA];
        if (!IA) return false;                                                                                              //there are no enemies
        const grid = Vector3.to_Grid3D(obj.pos);

        if (!IA.empty(grid)) {
            const possibleEnemies = IA.unroll(grid);
            for (let P of possibleEnemies) {
                const monster = this.entity_IAM.POOL[P - 1];
                if (monster === null) return true;
                const monsterHit = GRID.circleCollision3D(monster.moveState.referencePos, obj.pos, monster.r + obj.r);
                if (monsterHit) {
                    monster.hitByMissile(obj, GA);
                    return true;
                }
            }
        }
        return false;
    }
}

class Bullet3D extends IAM {
    constructor(enemyIA, entity_IAM, itemIA, item_IAM) {
        super();
        this.IA = "bulletIA";
        this.enemyIA = enemyIA;
        this.entity_IAM = entity_IAM;
        this.itemIA = itemIA;
        this.item_IAM = item_IAM;
        this.reIndexRequired = true;
    }
    manage(lapsedTime) {
        this.reIndex();
        this.map[this.IA] = new IndexArray3D(this.map.width, this.map.height, this.map.depth, 4, 4);
        this.poolToIA3D(this.map[this.IA]);
        const GA = this.map.GA;

        for (let obj of this.POOL) {
            if (obj) {
                obj.move(lapsedTime, GA);

                const pos = Vector3.to_Grid3D(obj.pos);

                if (GA.isOutOfBounds(pos)) {
                    obj.clean();
                    continue;
                }

                if (GA.check(pos, MAPDICT.WALL)) {              // collision to wall
                    obj.die();
                    continue;
                }

                this.missile_object_collision(obj, pos);
                this.missile_entity_collision(obj, pos);
                this.missile_hero_collision(obj);
            }
        }
    }

    missile_hero_collision(obj) {
        const hit = GRID.collisionPosInBoundingBox(obj.pos, this.hero.player.absoluteBoundingBox);
        if (hit) {
            obj.clean();
            return this.hero.explode();
        }

    }

    missile_entity_collision(obj, grid) {
        const IA = this.map[this.enemyIA];
        if (!IA) return false;

        if (!IA.empty(grid)) {
            const possibleEnemies = IA.unroll(grid);

            for (let P of possibleEnemies) {
                const enemy = this.entity_IAM.show(P);
                if (enemy) {

                    const hit = GRID.collisionPosInBoundingBox(obj.pos, enemy.moveState.absoluteBoundingBox, new FP_Grid3D(), false);
                    if (hit) {
                        obj.clean();
                        enemy.kill(true);
                        break;
                    }
                }
            }
        }
    }

    missile_object_collision(obj, grid) {
        const IA = this.map[this.itemIA];
        if (!IA) return false;

        if (!IA.empty(grid)) {
            const itemID = IA.unroll(grid);                     // by design it can be only single item
            const item = this.item_IAM.show(itemID);
            if (item) {
                const hit = GRID.collisionPosInBoundingBox(obj.pos, item.element.boundingBox, item.grid);
                if (hit) {
                    item.shootInteraction();
                    obj.clean();
                }
            }
        }
    }

}

class ParticleEmmission3D extends IAM {
    constructor() {
        super();
        this.IA = null;
        this.POOL = [];
        this.reIndexRequired = true;
    }
    manage(date) {
        this.reIndex();
        for (const item of this.POOL) {
            if (item) {
                item.update(date);
                if (item.normalized_age > 1) {
                    if (item.callback) item.callback();
                    this.remove(item.id);
                }
            }
        }
    }
}

class FireEmmission3D extends IAM {
    constructor() {
        super();
        this.IA = null;
        this.POOL = [];
        this.reIndexRequired = false; //lives forever!
    }
    manage(date) {
        const hPos = Vector3.to_FP_Grid(this.hero.player.pos);
        let burn = false;
        let damage = 0;
        for (const item of this.POOL) {
            item.update(date);
            if (!burn) {
                if (this.hero.player.depth !== item.depth) continue;
                const iPos = Vector3.to_FP_Grid(item.pos);
                burn = GRID.circleCollision2D(hPos, iPos, item.r + this.hero.player.r);
                if (burn) damage = item.burnDamage;
            }
        }
        if (burn) return this.hero.burn(damage);
    }
}

class Animated_3d_entity extends IAM {
    constructor(usingReIndex = false) {
        super();
        this.POOL = [];
        this.IA = "enemyIA";
        this.usingReIndex = usingReIndex;
        if (this.usingReIndex) this.reIndexSwitch = true;
    }
    useReindex() {
        this.usingReIndex = true;
        this.reIndexSwitch = true;
    }
    resetTime() {
        for (const enemy of this.POOL) {
            if (enemy === null) continue;
            enemy.resetTime();
        }
    }
    poolToIA3D(IA) {
        for (const enemy of this.POOL) {
            if (enemy === null) continue;

            const BB = enemy.moveState.rotatedBoundingBox;
            const LOW = Grid3D.toClass(enemy.moveState.grid.add(new FP_Vector3D(BB.min.x, BB.min.z, BB.min.y)));
            const HI = Grid3D.toClass(enemy.moveState.grid.add(new FP_Vector3D(BB.max.x, BB.max.z, BB.max.y)));

            const grids = [];

            for (let x = LOW.x; x <= HI.x; x++) {
                for (let z = LOW.z; z <= HI.z; z++) {
                    for (let y = LOW.y; y <= HI.y; y++) {
                        grids.push(new Grid3D(x, y, z));
                    }
                }
            }

            for (let grid of grids) {
                IA.next(grid, enemy.id);
            }
        }
    }
    setup() {
        const map = this.map;
        map[this.IA] = new IndexArray3D(map.width, map.height, map.depth, 4, 4);    //3D
        this.poolToIA3D(map[this.IA]);
    }
    manage(lapsedTime, date, flagArray) {
        const map = this.map;
        map[this.IA] = null;
        if (this.POOL.length === 0) return;
        this.reIndex();
        const GA = this.map.GA;
        this.setup();

        const heroRefGrid = Vector3.to_Grid3D(this.hero.player.pos);
        if (GA.isOutOfBounds(heroRefGrid)) return;                                                  // nothing to do if hero is OOB

        GRID.calcDistancesBFS_A_3D(heroRefGrid, map, false, GROUND_MOVE_GRID_EXCLUSION);            //ground exlusion 3d on xy plane, this needs to be separate because of hunting on exact position!
        GRID.calcDistancesBFS_A_3D(heroRefGrid, map, true, AIR_MOVE_GRID_EXCLUSION, "airNodeMap");  //air exclusion fully 3d

        for (const entity of this.POOL) {
            if (entity) {
                entity.reset();
                if (GA.isOutOfBounds(Grid3D.toClass(entity.moveState.grid))) {
                    entity.remove();
                    continue;
                }

                //set distance
                entity.setDistanceFromNodeMap(map.GA.nodeMap);
                entity.setDistanceFromNodeMap(map.GA.airNodeMap, "airDistance");
                if (entity.petrified) continue;

                //enemy/enemy collision resolution
                if (IndexArrayManagers.EE_COLLISION_CHECK && this.enemy_enemy_collision_resolution(entity, map, date)) continue;

                //enemy/player collision
                if (!this.hero.dead || this.hero.player.isJumping) {
                    const EP_hit = this.hero.player.collisionMethod(entity);

                    if (EP_hit) {

                        if (IndexArrayManagers.DEADLY_TOUCH) {
                            entity.kill();
                            this.hero.explode();
                        }

                        if (entity.canAttack) {
                            entity.performAttack(this.hero);
                            if (IndexArrayManagers.VERBOSE) console.info(`${entity.name}-${entity.id} attacking`);
                        }

                        entity.setView(this.hero.player.pos);       // this never runs if IndexArrayManagers.DEADLY_TOUCH
                        entity.update(date);
                        continue;
                    }
                }

                //enemy/wall collision
                if (IndexArrayManagers.E_WALL_COLLISION_CHECK) {
                    if (!entity.ignoreWalls) {
                        const filledGridIndices = entity.inWhichGridIndices();
                        const hit = GA.checkIndicesAny(filledGridIndices, MAPDICT.WALL);
                        if (hit) {
                            entity.kill();
                            continue;
                        }
                    }
                }

                //enemy shoot
                if (!this.hero.dead) {
                    if (entity.canShoot) {
                        if (!entity.preventRotation) entity.setView(this.hero.player.pos);
                        entity.shoot(GA);
                        entity.shootBullet(GA);
                        if (IndexArrayManagers.VERBOSE) console.info(`${entity.name}-${entity.id} shooting`);
                    }
                }

                //enemy translate position
                if (entity.moveState.moving) {
                    if (this.hero.dead) lapsedTime = IndexArrayManagers.DEAD_LAPSED_TIME;
                    GRID.translatePosition3D(entity, lapsedTime);
                    entity.update(date);
                    entity.proximityDistance = null;
                    continue;
                }

                //set behaviour and move
                let passiveFlag = flagArray.includes(true);
                let distance = entity.distance;
                if (entity.caster || entity.flier) {
                    distance = entity.airDistance;
                }

                entity.behaviour.manage(entity, distance, passiveFlag);
                if (!entity.hasStack()) {

                    let ARG = {
                        playerPosition: Vector3.to_FP_Grid3D(this.hero.player.pos),
                        currentPlayerDir: Vector3.to_FP_Vector(this.hero.player.dir).ortoAlign(),
                        exactPlayerPosition: this.hero.player.pos,
                        exactPlayerDir: this.hero.player.dir,
                        block: []
                    };

                    entity.dirStack = AI[entity.behaviour.strategy](entity, ARG);
                    if (IndexArrayManagers.VERBOSE) console.info(`${entity.name} ${entity.id} dirStack`, entity.dirStack, "dir", entity.moveState.dir, "strategy", entity.behaviour.strategy, `distance: ${distance}`);
                }
                entity.makeMove();
            }
        }
    }
    enemy_enemy_collision_resolution(entity, map, date) {
        const ThisGrid = Vector3.to_Grid3D(entity.moveState.pos);
        const EndGrid = Grid3D.toClass(entity.moveState.endPos);
        const Indices = map[this.IA].unroll(ThisGrid);
        if (!GRID.same(ThisGrid, EndGrid)) {
            let add = map[this.IA].unroll(EndGrid);
            Indices.splice(0, -1, ...add);
        }
        let setIndices = new Set(Indices);
        setIndices.delete(entity.id);
        const FilteredIndices = Array.from(setIndices);
        let wait = false;
        if (FilteredIndices.length > 0) {
            if (!entity.proximityDistance) {
                entity.proximityDistance = this.hero.player.pos.EuclidianDistance(entity.moveState.pos);
            }
            for (let e of FilteredIndices) {
                const compareEntity = this.POOL[e - 1];
                if (compareEntity.petrified) continue;
                if (!compareEntity.proximityDistance) compareEntity.proximityDistance = this.hero.player.pos.EuclidianDistance(compareEntity.moveState.pos);

                const EE_hit = GRID.circleCollision3D(entity.moveState.pos, compareEntity.moveState.pos, entity.r + compareEntity.r);

                if (EE_hit && compareEntity.proximityDistance < entity.proximityDistance) {
                    wait = true;
                    entity.update(date);
                    //if (IndexArrayManagers.VERBOSE) console.info(`${entity.name}-${entity.id} waiting to continue turn`);
                    break;
                }
            }

            if (wait) return true;
        }
        return false;
    }
    display() {
        console.log("------------------------------------------");
        console.log(this.constructor.name, "Overview:");
        console.table(this.POOL, ['name', 'id', 'grid', 'distance', 'moveState', 'actor', 'r', 'behaviour']);
        console.log("------------------------------------------");
    }
    analyze() {
        let monsterDict = new DefaultDict(0);
        let XP = 0;
        let gold = 0;
        let ADM = 0;
        let health = 0;
        for (const enemy of this.POOL) {
            if (enemy) {
                monsterDict[enemy.name]++;
                XP += enemy.xp;
                gold += enemy.gold || 0;
                ADM += enemy.attack + enemy.defense + enemy.magic;
                health += enemy.health;
            }
        }

        console.group("ENEMY analysis");
        for (const item in monsterDict) {
            console.log(item, monsterDict[item], Number(monsterDict[item] / this.POOL.length * 100).toFixed(2), "%");
        }
        console.log("------------------------------------------");
        console.log("TOTAL XP:", XP);
        console.log("TOTAL Gold:", gold);
        console.log("TOTAL ADM:", ADM);
        console.log("TOTAL Health:", health);
        console.groupEnd("ENEMY analysis");
    }
}

class Lair3D extends Spawner {
    constructor() {
        super();
    }
    selectNest() {
        return this.POOL.chooseRandom();
    }

}

class ItemDropper3D extends IAM {
    constructor() {
        super();
        this.IA = null;
        this.POOL = [];
        this.reIndexRequired = true;
    }
    manage(lapsedTime) {
        this.reIndex();
        for (const item of this.POOL) {
            if (item) {
                item.move(lapsedTime);
            }
        }
    }
}

/** 1d plane manager */

class PlaneGridEntity1D extends IAM {
    constructor(ia) {
        super();
        this.IA = "enemyIA";
    }
    poolToIA(IA) {
        for (const obj of this.POOL) {
            if (obj) IA.next(obj.moveState.homeGrid, obj.id);
        }
    }
    manage(lapsedTime) {
        let map = this.map;
        map[this.IA] = new IndexArray(map.width, map.height, 4, 4);
        this.update(lapsedTime);
        this.poolToIA(map[this.IA]);
        this.checkPlayerCollision();
    }
    checkPlayerCollision() {
        const grid = this.hero.player.moveState.homeGrid;
        const IA = this.map[this.IA];
        const who = IA.unroll(grid).find(element => {
            const item = PLANE_GRID1D.show(element);
            return item && item.category !== "carrier";
        }) ?? null;

        if (who) {
            const which = PLANE_GRID1D.show(who);
            if (["enemy", "bonus"].includes(which.category)) {
                if (which.sprite.visible) {
                    const whichArea = which.sprite.getArea();
                    const heroArea = this.hero.player.sprite.getArea();
                    const hit = whichArea.overlap(heroArea);

                    if (hit && which.category === "enemy" && this.hero.die) {
                        if (which.perish) this.remove(who);                             // to prevent insta death on continue level
                        return this.hero.die();                                         //else this does silently nothing
                    }
                    if (hit && which.category === "bonus") {
                        this.remove(who);
                        if (this.hero.bonus) return this.hero.bonus(which.score);       //else this does silently nothing 
                    }
                }
            }
        }
    }
}

/** Carrier 2D */

class Carrier2D extends IAM {
    constructor() {
        super();
        this.IA = "carrierIA";
    }
    poolToIA(IA) {
        for (const obj of this.POOL) {
            if (!obj) continue;
            if (!IA.has(obj.grid, obj.id)) IA.next(obj.grid, obj.id);
        }
    }
    manage(lapsedTime) {
        let map = this.map;
        map[this.IA] = new IndexArray(map.width, map.height, 4, 4);
        this.update(lapsedTime);
        this.poolToIA(map[this.IA]);
    }
}

/** GLOBAL ID */

const GLOBAL_ID_MANAGER = {
    offset: [0],
    IAM: [],
    getObject(globalId) {
        if (this.offset.length < 2) return null;
        let idx = 1;
        while (idx < this.offset.length && globalId >= this.offset[idx]) {
            idx++;
        }
        idx--;
        let id = globalId - this.offset[idx];
        return this.IAM[idx].POOL[id - 1];
    }
};

class Store {
    constructor(list) {
        this.list = list;
    }
    storeIAM(map) {
        map.store = {};
        for (const IAM of this.list) {
            map.store[IAM] = {};
            map.store[IAM].POOL = eval(IAM).POOL;
        }
    }
    clearPools() {
        for (const IAM of this.list) {
            eval(IAM).clearAll();
        }
    }
    displayGlobals() {
        for (const IAM of this.list) {
            console.log(IAM, eval(IAM));
        }
    }
    linkMap(map) {
        for (const IAM of this.list) {
            eval(IAM).linkMap(map);
        }
    }
    loadIAM(map) {
        for (const IAM of this.list) {
            eval(IAM).POOL = map.store[IAM].POOL;
        }
    }
}

/**  IAM INSTANCES: SUPER GLOBALS */
const DECOR = new Decor();
const PROFILE_BALLISTIC = new Profile_Ballistic();
const PROFILE_ACTORS = new Profile_Actors();
const PIXEL_ACTORS = new Pixel_Actors();
const ENEMY2D = new Enemy2D();
const BALLISTIC2D = new Ballistic2D("enemyIA", ENEMY2D);
const VANISHING = new Vanishing();
const FLOOR_OBJECT = new Floor_Object();
const FLOOR_OBJECT_WIDE = new Floor_Object(4, 4);
const DESTRUCTION_ANIMATION = new Destruction_Animation();
const CHANGING_ANIMATION = new Changing_Animation();
const BUMP2D = new Bump2D();
const NEST = new Spawner();
const DECAL3D = new Decal3D();
const LIGHTS3D = new Decal3D();
const SUN3D = new Decal3D();
const VANISHING3D = new Decal3D(null, null, true);
const INTERFACE3D = new Decal3D();
const GATE3D = new Decal3D(256);
const ITEM3D = new Decal3D(1024, "item3D");
const EXPLOSION3D = new ParticleEmmission3D();
const FIRE3D = new FireEmmission3D();
const INTERACTIVE_DECAL3D = new Decal3D(1024);
const INTERACTIVE_BUMP3D = new Decal3D(256, "interactive_bump3d");
const ENTITY3D = new Animated_3d_entity();
const MISSILE3D = new Missile3D("enemyIA", ENTITY3D);
const BULLET3D = new Bullet3D("enemyIA", ENTITY3D, "item3D", ITEM3D);
const DYNAMIC_ITEM3D = new Decal3D(256, "dynamic_item3d");
const LAIR = new Lair3D();
const ITEM_DROPPER3D = new ItemDropper3D();
const PLANE_GRID1D = new PlaneGridEntity1D();
const CARRIER2D = new Carrier2D();
/** *********************************************** */
console.log(`%cIndexArrayManagers (IAM) ${IndexArrayManagers.VERSION} ready.`, "color: #7FFFD4");