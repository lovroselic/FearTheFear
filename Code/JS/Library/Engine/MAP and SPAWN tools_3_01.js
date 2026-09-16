/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */

"use strict";

/** features to parse MazEditor outputs */
const MAP_TOOLS = {
    VERSION: "3.01",
    CSS: "color: #F9A",
    properties: ['start', 'decals', 'lights', 'gates', 'keys', 'monsters', 'scrolls', 'potions', 'gold', 'skills', 'containers',
        'shrines', 'doors', 'triggers', 'entities', 'objects', 'traps', 'oracles', 'movables', 'trainers', 'interactors', 'lairs',
        'fires', 'carriers', "items"],
    lists: ['monsterList'],
    INI: {
        FOG: true, //true
        GA_BYTE_SIZE: 2,
        SPAWN_DELAY_INC_FACTOR: 1.2,
        LEGACY_WIDTH: 512,
        TEXTURE_WIDTH: 1024,
        VERBOSE: false,
        DIM_3D: false,
        DIM_E3D: true,
    },
    use2D() {
        MAP_TOOLS.INI.DIM_3D = false;
        MAP_TOOLS.INI.DIM_E3D = false;
    },
    use3D() {
        MAP_TOOLS.INI.DIM_3D = true;
        MAP_TOOLS.INI.DIM_E3D = false;
    },
    useE3D() {
        MAP_TOOLS.INI.DIM_3D = false;
        MAP_TOOLS.INI.DIM_E3D = true;
    },
    manageMAP(level) {
        const map = this.MAP[level].map;
        if (map.spawnDelay < 0) return;
        if (map.stopSpawning) return;
        
        /** check the lair cooldown */
        if (map.killCount >= map.killCountdown) {
            map.killCountdown = Math.max(1, --map.killCountdown);
            map.maxSpawned = Math.max(1, --map.maxSpawned);
            if (map.killCountdown === 1) map.killCountdown = 999;
            map.spawnDelay = Math.round(map.spawnDelay * MAP_TOOLS.INI.SPAWN_DELAY_INC_FACTOR);
            map.killCount = 0;
            LAIR.set_timeout(map.spawnDelay);
        }
        /** check the termination of spawning */
        if (map.totalKills >= map.killsRequiredToStopSpawning) {
            if (MAP_TOOLS.INI.VERBOSE) console.warn("Terminating spawning on level ", level, "totalKills", map.totalKills, "killsRequiredToStopSpawning", map.killsRequiredToStopSpawning);
            map.stopSpawning = true;
        }
    },
    initialize(pMapObject) {
        this.MAP = pMapObject;
        this.MAP.manage = this.manageMAP.bind(this);
    },
    setByteSize(byte) {
        if (![1, 2, 4].includes(byte)) {
            console.error("MAP_TOOLS set up with wrong size. Reset to default 8 bit!");
            byte = 1;
        }
        MAP_TOOLS.INI.GA_BYTE_SIZE = byte;
        if (MAP_TOOLS.INI.VERBOSE) console.log(`MAP TOOLS GA bytesize`, MAP_TOOLS.INI.GA_BYTE_SIZE);
    },
    unpack(level) {
        const entry = this.MAP[level];
        if (entry.unpacked) return;                                                   // already unpacked, nothing to do

        const mapData = JSON.parse(entry.data);
        let rebuilt = false;

        if (entry.adapted_data) {
            mapData.map = entry.adapted_data;
            if (MAP_TOOLS.INI.VERBOSE) console.warn("loading adapted data", mapData);
            rebuilt = true;
        }

        if (this.INI.DIM_3D) {
            entry.map = FREE_MAP3D.import(mapData, MAP_TOOLS.INI.GA_BYTE_SIZE);
        } else if (this.INI.DIM_E3D) {
            entry.map = EXTENDED_FREE_MAP3D.import(mapData);
        } else entry.map = FREE_MAP.import(mapData, MAP_TOOLS.INI.GA_BYTE_SIZE);

        const map = entry.map;
        const GA = map.GA;

        map.rebuilt = rebuilt;
        entry.pw = map.width * ENGINE.INI.GRIDPIX;
        entry.ph = map.height * ENGINE.INI.GRIDPIX;
        map.level = level;

        if (this.INI.FOG && !map.rebuilt) GA.massSet(MAPDICT.FOG);

        for (const prop of [...this.properties, ...this.lists]) {
            map[prop] = entry[prop] !== undefined ? JSON.parse(entry[prop]) : [];
        }

        if (map.start?.length >= 2) {
            map.startPosition = new Pointer_3DGrid(GA.indexToGrid(map.start[0]), Vector.fromInt(map.start[1]));
        }

        if (!entry.name) entry.name = `Room - ${level}`;

        if (typeof entry.terrain === "string") entry.terrain = JSON.parse(entry.terrain);
        if (typeof entry.connections === "string") entry.connections = JSON.parse(entry.connections);


        /** initialize global map proterties */
        const SG = entry.sg || null;
        map.sg = SG;
        map.storage = new IAM_Storage();
        map.killCount = entry.killCount ?? 0;
        map.maxSpawned = entry.maxSpawned ?? 0;
        map.killCountdown = entry.killCountdown ?? 0;
        map.spawnDelay = entry.spawnDelay ?? -1;
        map.totalKills = entry.totalKills ?? 0;
        map.killsRequiredToStopSpawning = entry.killsRequiredToStopSpawning ?? (map.killCountdown >= 0 ? factorial(map.killCountdown) + map.maxSpawned : Infinity);
        map.stopSpawning = entry.stopSpawning || false;
        entry.unpacked = true;

        if (ENGINE.verbose) {
            console.note(`Unpacked MAP level: ${level}, unpacked: ${this.MAP[level].unpacked}`);
            console.log("map:", this.MAP[level].map);
        }

    },
    resetStorages() {
        for (const level in this.MAP) {
            if (level === "manage") continue;
            if (this.MAP[level].map) this.MAP[level].map.storage = new IAM_Storage();
            this.MAP[level].unused_storage = new IAM_Storage();
        }
    },

    /**
     * direct accesses WebGL
     * @param {*} level - leved/dungeon/room id
     */
    setOcclusionMap(level) {
        // only 3D occlusion maps now supported, for 2D use depth = 1;
        const GA = this.MAP[level].map.GA;
        const map = this.MAP[level].map;
        if (map.zMap1) {
            map.textureMap = QUAD_MAP.toTextureMap(map.zMap1);
            const texture = WebGL.createOcclusionTexture3D(map.textureMap, map.zMap1.xSize, map.zMap1.ySize, 1);
            map.occlusionMap = {
                texture: texture,
                originXZ: new Float32Array([map.zMap1.minX, map.zMap1.minY]),
                resolution: map.zMap1.resolution,
                size: new Float32Array([map.zMap1.xSize, map.zMap1.ySize, 1])
            };

        } else {
            const texture = WebGL.createOcclusionTexture3D(GA.toTextureMap(), map.width, map.height, map.depth);
            map.occlusionMap = {
                texture: texture,
                originXZ: new Float32Array([0, 0]),
                resolution: 1,
                size: new Float32Array([map.width, map.height, map.depth])
            };
        }
    },

    /**
     * direct accesses WebGL
     * @param {*} level - leved/dungeon/room id
     */
    rebuild_3D_world(level) {
        this.MAP[level].world = WORLD.build(this.MAP[level].map);
        WebGL.setWorld(this.MAP[level].world);
        this.MAP[level].map.rebuilt = true;
        this.setOcclusionMap(level);
    },
    applyStorageActions(level) {
        const entry = this.MAP[level];
        const pending = entry.unused_storage;

        if (!pending || pending.empty()) return;
        const storage = entry.map.storage;

        if (this.INI.VERBOSE) console.info("Applying stored actions for level", level, pending.action_list);

        pending.apply();
        storage.addStorage(pending);
        pending.clear();

        this.setOcclusionMap(level);
    }
};

const SG_DICT = {
    0: "Neutral",
    1: "Block",
    2: "Restore",
};

const SPAWN_TOOLS = {
    /**
     * for 3D games
     */
    spawn(level) {
        const map = MAP_TOOLS.MAP[level].map;
        const GA = map.GA;
        const methods = ['decals', 'lights', 'shrines', 'oracles', 'externalGates', 'keys', 'monsters', 'scrolls', 'gold', 'skills',
            'containers', 'doors', 'triggers', 'entities', 'trainers', 'objects', 'movables', 'traps', 'interactors', 'lairs', 'fires'];

        map.TextureExclusion = {};                              // used to exclude world textures, where they are superseeded with custom texture, reset

        methods.forEach(method => {
            this[method](map, GA);
        });

        MAP_TOOLS.setOcclusionMap(level);
        ITEM3D.setup("3D", 4, 1); //
        console.info(`Level ${level} spawned.`);
    },
    decals(map, GA) {
        for (const D of map.decals) {
            const grid = GA.indexToGrid(D[0]);
            const face = DirectionToFace(Vector.fromInt(D[1]));
            const picture = D[2];
            let type = D[3];
            let decal;
            let expand = false;

            if (type === "texture") {
                decal = TEXTURE[picture];
                map.TextureExclusion[D[0]] = face;
            } else decal = SPRITE[picture];
            if (type === "picture" && (decal.width >= MAP_TOOLS.INI.TEXTURE_WIDTH || decal.height >= MAP_TOOLS.INI.TEXTURE_WIDTH)) {
                type = "texture";
            } else if (type === "crest" && (decal.width >= MAP_TOOLS.INI.LEGACY_WIDTH || decal.height >= MAP_TOOLS.INI.LEGACY_WIDTH)) type = "texture";

            DECAL3D.add(new StaticDecal(grid, face, decal, type, picture, expand));
        }
    },
    lights(map, GA) {
        for (const L of map.lights) {
            const index = L[0];
            const grid = GA.indexToGrid(index);
            const face = DirectionToFace(Vector.fromInt(L[1]));
            const picture = L[2];
            const type = L[3];
            const strength = L[4].map(x => parseFloat(x));
            const sprite = SPRITE[picture];
            let expand = false;
            let category = "light";
            // all decals with width above legacy 512 will be expanded as they are considered crests
            if (sprite.width >= MAP_TOOLS.INI.LEGACY_WIDTH) {
                expand = true;
                category = "crest";
            };
            let position = null;
            if (map.quadMap) {
                const quadNode = map.quadMap.map[index];
                position = WORLD.surfaceLightPosition(quadNode, face, WebGL.INI.SURFACE_WALL_HEIGHT);
                position = Vector3.from_array(position);
            }
            LIGHTS3D.add(new LightDecal(grid, face, sprite, category, picture, LIGHT_COLORS[type], expand, position, strength[0], strength[1], strength[2]));
        }
    },
    externalGates(map, GA) {
        for (const G of map.gates) {
            //console.log("spawning gate", G);
            const color = G[4];
            const grid = GA.indexToGrid(G[0]);
            GA.addStair(grid);
            const dir = Vector.fromInt(G[1]);
            const pointer = new Pointer_3DGrid(grid, dir);
            map[G[2]] = pointer;
            const face = DirectionToFace(dir);
            const picture = `DungeonDoor_${color}`;
            const destination = new Destination(G[3], G[3].split(".")[0], G[2]);
            let opEn = false;
            if (["Open", "Up", "Down"].includes(color)) opEn = true;
            let locked = true;
            if (["Open", "Closed", "Up", "Down"].includes(color)) locked = false;
            const externalGate = new ExternalGate(grid, face, SPRITE[picture], "portal", picture, color, opEn, locked, destination, GAME.useStaircase);
            INTERACTIVE_BUMP3D.add(externalGate);
        }
        INTERACTIVE_BUMP3D.setup("3D");
    },
    lairs(map, GA) {
        for (const L of map.lairs) {
            const grid = GA.indexToGrid(L[0]);
            const dir = Vector.fromInt(L[1]);
            const pic = L[2];
            const face = DirectionToFace(dir);
            const lair = new Lair_Spawner(grid, face, SPRITE[pic], "lair", pic, dir);
            LAIR.add(lair);
        }
    },
    keys(map, GA) {
        for (const K of map.keys) {
            const grid = Grid3D.toCenter2D(GA.indexToGrid(K[0]));
            const key = KEY_TYPE[KEY_TYPES[K[1]]];
            ITEM3D.add(new FloorItem3D(grid, key));
        }
    },
    monsters(map, GA) {
        for (const M of map.monsters) {
            const grid = Grid3D.toCenter2D(GA.indexToGrid(M[0]));
            const type = MONSTER_TYPE[M[1]];
            let dir = UP3;
            if (M.length > 2) {
                dir = Vector3D.fromVector2D(Vector.fromInt(M[2]), 0);
            }
            ENTITY3D.add(new $3D_Entity(grid, type, dir));
        }
    },
    scrolls(map, GA) {
        for (const S of map.scrolls) {
            const grid = Grid3D.toCenter2D(GA.indexToGrid(S[0]));
            ITEM3D.add(new FloorItem3D(grid, COMMON_ITEM_TYPE.Scroll, S[1]));
        }
    },
    gold(map, GA) {
        for (const G of map.gold) {
            const grid = Grid3D.toCenter2D(GA.indexToGrid(G[0]));
            ITEM3D.add(new FloorItem3D(grid, GOLD_ITEM_TYPE[G[1]]));
        }
    },
    skills(map, GA) {
        for (const S of map.skills) {
            const grid = Grid3D.toCenter2D(GA.indexToGrid(S[0]));
            ITEM3D.add(new FloorItem3D(grid, SKILL_ITEM_TYPE[S[1]]));
        }
    },
    containers(map, GA) {
        for (const C of map.containers) {
            const grid = Grid3D.toCenter2D(GA.indexToGrid(C[0]));
            const type = CONTAINER_ITEM_TYPE[C[1]];
            let rotation = null;
            if (C.length > 3 && C[3]) {
                let dir = Vector.fromInt(C[3]);
                if (dir.same(NOWAY)) {
                    rotation = null;
                } else {
                    rotation = UP.radAngleBetweenVectors(dir) + type.rotateToNorth;
                    const element = ELEMENT[type.element];
                    const SP = ELEMENT.getSurfaceProjection(element, type.scale);
                    grid.y = (grid.y >>> 0) + ((1 - dir.y) / 2) + (dir.y * SP.H / 2);
                    grid.x = (grid.x >>> 0) + ((1 - dir.x) / 2) + (dir.x * SP.H / 2);
                };
            }
            ITEM3D.add(new FloorItem3D(grid, type, C[2], rotation));
        }
    },
    shrines(map, GA) {
        for (const S of map.shrines) {
            const grid = GA.indexToGrid(S[0]);
            GA.addShrine(grid);
            const face = DirectionToFace(Vector.fromInt(S[1]));
            INTERACTIVE_DECAL3D.add(new Shrine(grid, face, SHRINE_TYPE[S[2]]));
        }
    },
    oracles(map, GA) {
        for (const S of map.oracles) {
            const grid = GA.indexToGrid(S[0]);
            GA.addShrine(grid);
            const face = DirectionToFace(Vector.fromInt(S[1]));
            INTERACTIVE_DECAL3D.add(new Oracle(grid, face, ORACLE_TYPE[S[2]]));
        }
    },
    doors(map, GA) {
        for (const door of map.doors) {
            const grid = GA.indexToGrid(door);
            GA.closeDoor(grid);
            GATE3D.add(new Gate(grid, DOOR_TYPE.Common, GA));
        }
    },
    triggers(map, GA) {
        for (const T of map.triggers) {
            const grid = GA.indexToGrid(T[0]);
            const face = DirectionToFace(Vector.fromInt(T[1]));
            const picture = T[2];
            const action = TRIGGER_ACTIONS[T[3]];
            const targetGrid = GA.indexToGrid(T[4]);
            const trigger = new Trigger(grid, face, picture, action, targetGrid, GA);
            INTERACTIVE_DECAL3D.add(trigger);
        }
    },
    entities(map, GA) {
        for (const E of map.entities) {
            const grid = GA.indexToGrid(E[0]);
            GA.addShrine(grid);
            const face = DirectionToFace(Vector.fromInt(E[1]));
            const type = INTERACTION_ENTITY[E[2]];
            const entity = new InteractionEntity(grid, face, type);
            INTERACTIVE_DECAL3D.add(entity);
        }
    },
    trainers(map, GA) {
        for (const E of map.trainers) {
            const grid = GA.indexToGrid(E[0]);
            GA.addShrine(grid);
            const face = DirectionToFace(Vector.fromInt(E[1]));
            const type = INTERACTION_SHRINE[E[2]];
            const entity = new InteractionEntity(grid, face, type);
            INTERACTIVE_DECAL3D.add(entity);
        }
    },
    interactors(map, GA) {
        for (const E of map.interactors) {
            const grid = GA.indexToGrid(E[0]);
            GA.addShrine(grid);
            const face = DirectionToFace(Vector.fromInt(E[1]));
            const type = INTERACTOR[E[2]];
            const entity = new InterActor(grid, face, type);
            INTERACTIVE_DECAL3D.add(entity);
        }
    },
    objects(map, GA) {
        for (const O of map.objects) {
            const grid = Grid3D.toCenter2D(GA.indexToGrid(O[0]));
            const type = INTERACTION_OBJECT[O[1]];
            ITEM3D.add(new FloorItem3D(grid, type));
        }
    },
    movables(map, GA) {
        for (const O of map.movables) {
            const grid = Grid3D.toCenter2D(GA.indexToGrid(O[0]));
            const type = MOVABLE_INTERACTION_OBJECT[O[1]];
            DYNAMIC_ITEM3D.add(new $Movable_Interactive_entity(grid, type));
        }
    },
    traps(map, GA) {
        for (const T of map.traps) {
            const grid = GA.indexToGrid(T[0]);
            const face = DirectionToFace(Vector.fromInt(T[1]));
            const picture = T[2];
            const action = TRAP_ACTION_LIST[T[3]];
            let prototype;
            switch (action) {
                case "Missile":
                    prototype = COMMON_ITEM_TYPE[T[4]];
                    break;
                case "Spawn":
                    prototype = MONSTER_TYPE[T[4]];
                    break;
                default:
                    throw new Error(`trap action error. ${action} not defined.`);
            }
            const targetGrid = GA.indexToGrid(T[5]);
            const trap = new Trap(grid, face, picture, action, prototype, targetGrid);
            INTERACTIVE_DECAL3D.add(trap);
        }
    },
    fires(map, GA) {
        for (const fire of map.fires) {
            let grid = Grid3D.toCenter2D(GA.indexToGrid(fire[0]));
            const face = DirectionToFace(Vector.fromInt(fire[1]));
            const type = FIRE_TYPES[fire[2]];
            if (face !== "TOP") {
                if (face === "BOTTOM") return;                                  //this is not supported
                let dir = FaceToDirection(face);
                dir = FP_Vector3D.toClass(new Vector3D(dir.x, dir.y, 0));
                grid = grid.add(dir, WebGL.INI.TORCH_OUT);
                grid = grid.add(ABOVE3, WebGL.INI.TORCH_HEIGHT);
            }
            const position = Vector3.from_grid3D(grid);
            FIRE3D.add(new FireEmmiter(position, type));

        }
    },
    spawnSunFromCamera(position, lightColor) {
        SUN3D.add(new LightSource(position, DIR_DOWN, lightColor));
    },
};

const SPAWN_TOOLS_2D = {
    /**
     * for 2D games
     */

    spawn(level, useVieport = false) {
        const map = MAP_TOOLS.MAP[level].map;
        if (map.spawned) {
            console.info(`map level ${level} already spawned`);
            return;
        }
        const GA = map.GA;
        const methods = ['monsters', 'carriers', 'gold', 'items'];

        //map.TextureExclusion = {};                              //not applicable in 2D // used to exclude world textures, where they are superseeded with custom texture, reset

        methods.forEach(method => {
            this[method](map, GA, useVieport);
        });

        FLOOR_OBJECT.setup("2D", 1, 1);                         //setting up IA
        map.spawned = true;
        console.info(`Level ${level} spawned. 2D spawner`);
    },
    monsters(map, GA, useVieport) {
        for (const M of map.monsters) {
            const grid = GA.indexToGrid(M[0]);
            const type = MONSTER_TYPE[M[1]];
            let dir = type.dirRef;
            if (M[2]) dir = Vector.fromInt(M[2]);
            const entity = new $2D_Entity(grid, dir, type, GA, useVieport);
            ENEMY2D.add(entity);
        }
    },
    carriers(map, GA, useVieport) {
        for (const C of map.carriers) {
            const grid = GA.indexToGrid(C[0]);
            const type = SWINGING_ROPE_TYPE[C[1]];
            const dir = Vector.fromInt(C[2]);
            const carrier = new type.constructor(grid, type, dir, GA, useVieport);
            CARRIER2D.add(carrier);
        }
    },
    gold(map, GA, useVieport) {
        for (const G of map.gold) {
            const grid = GA.indexToGrid(G[0]);
            const item = new FloorItem2D(grid, GOLD_ITEM_TYPE[G[1]], useVieport);
            FLOOR_OBJECT.add(item);
        }
    },
    items(map, GA, useVieport) {
        for (const G of map.items) {
            const grid = GA.indexToGrid(G[0]);
            const item = new FloorItem2D(grid, eval(G[1]), useVieport);
            FLOOR_OBJECT.add(item);
        }
    },

    /**
     * lane based spawner
     */
    spawnLanes(level, GA = MAP_TOOLS.MAP[level].map.GA) {
        const map = MAP_TOOLS.MAP[level];
        const blinkGrids = [new Grid(1, 0), new Grid(4, 0), new Grid(7, 0), new Grid(10, 0), new Grid(13, 0)];
        for (const laneIndex in MAP_TOOLS.MAP[level]) {
            const lane = map[laneIndex];
            const types = lane.types || null;
            const gridsUsed = [];
            const dir = new Vector(lane.dir, 0);

            if (types) {
                const speed = lane.speed * ENGINE.INI.GRIDPIX;;
                for (let x = lane.start; x < GA.width - lane.gridLength; x += lane.gap + lane.gridLength) {
                    const type = MONSTER_TYPE[types.chooseRandom()];
                    type.speed = speed;
                    type.w = ENGINE.INI.GRIDPIX;
                    type.h = ENGINE.INI.GRIDPIX;

                    for (let off = 0; off < type.gridLength; off++) {
                        const grid = new Grid(x + off, GA.height - laneIndex - 1);
                        gridsUsed.push(grid);
                        if (!type.animate) type.spriteTexture = ASSET[type.asset].textures[off] || ASSET[type.asset].textures[0];
                        const entity = new $2D_Grid_Cycling_Entity_Part(grid, dir, type, GA);
                        PLANE_GRID1D.add(entity);
                    }
                }
                const bonus = lane.bonus || null;
                if (bonus) {
                    for (let b = 0; b < bonus; b++) {
                        const bGrid = gridsUsed.removeRandom();
                        const bType = MONSTER_TYPE[lane.bonusTypes.chooseRandom()];
                        bType.speed = speed;
                        const bEntity = new $2D_Grid_Cycling_Entity_Part(bGrid, dir, bType, GA);
                        PLANE_GRID1D.add(bEntity);
                    }
                }
            }

            if (lane.bonusBlink) {
                let bbType = MONSTER_TYPE[lane.bonusBlink.chooseRandom()];
                const bbGrid = blinkGrids.chooseRandom();
                bbType.useGrids = blinkGrids;
                bbType.speed = 0;
                const bbEntity = new $2D_Grid_Cycling_Entity_Part(bbGrid, NOWAY, bbType, GA);
                PLANE_GRID1D.add(bbEntity);
            }
            if (lane.enemyBlink) {
                let ebType = MONSTER_TYPE[lane.enemyBlink.chooseRandom()];
                const ebGrid = blinkGrids.chooseRandom();
                ebType.useGrids = blinkGrids;
                ebType.speed = 0;
                const ebEntity = new $2D_Grid_Cycling_Entity_Part(ebGrid, NOWAY, ebType, GA);
                PLANE_GRID1D.add(ebEntity);
            }
        }
        if (MAP_TOOLS.INI.verbose) console.info(`Lanes for level ${level} spawned.`);
    }

};

class IAM_Storage {
    constructor(arr = []) {
        this.action_list = arr;
    }
    empty() {
        return this.action_list.length === 0;
    }
    clear() {
        this.action_list = [];
    }
    apply() {
        if (MAP_TOOLS.INI.VERBOSE) console.log("applying actions", this.action_list.length);
        for (const action of this.action_list) {
            if (MAP_TOOLS.INI.VERBOSE) console.log(". action", action);
            const IAM = eval(action.IAM);
            const obj = IAM.POOL[action.id - 1];
            if (MAP_TOOLS.INI.VERBOSE) console.log(".... trying", obj, action.action, action.arg);
            if (obj) obj[action.action](action.arg);
            if (MAP_TOOLS.INI.VERBOSE) console.log("........ OK", obj, action.action, action.arg);
        }
    }
    add(item) {
        this.action_list.push(item);
    }
    addStorage(storage) {
        this.action_list.push(...storage.action_list);
    }
}

class IAM_Storage_item {
    /**
     * Creates an instance of IAM_Storage_item.
     * @param {string} IAM - string representation of corresponding IAM
     * @param {integer} id - id of object
     * @param {string} action - object method label
     * @param {*} [arg=null] - argument
     */
    constructor(IAM, id, action, arg = null) {
        this.IAM = IAM;
        this.id = id;
        this.action = action;
        this.arg = arg;
    }
}

/** defaults */
MAP_TOOLS.initialize(MAP);
MAP_TOOLS.setByteSize(2);

/** END */
console.log(`%cMAP and SPAWN tools ${MAP_TOOLS.VERSION} loaded.`, MAP_TOOLS.CSS);