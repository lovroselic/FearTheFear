/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */
"use strict";

const MINIMAP = {
    VERSION: "2.00",
    CSS: "color: #4AA",
    VERBOSE: false,
    SETTING: {
        FOG: true
    },
    fogOn() {
        this.SETTING.FOG = true;
    },
    fogOff() {
        this.SETTING.FOG = false;
    },
    verbose() {
        this.VERBOSE = true;
    },
    quiet() {
        this.VERBOSE = false;
    },
    LEGEND: {
        FOG: "#BBB",
        BORDER: "#FFF",
        EMPTY: "#000",
        ROOM: "#111",
        DOOR: "#333",
        STAIR: "#008000",
        WALL: "#8b4513",            //brown
        PILLAR: "#8b4513",            
        LOCKED_DOOR: "#826644",
        HERO: "#FFF",
        SHRINE: "#FF00FF",
        HOLE: "#444",
        BLOCKWALL: "#d2691e",
        ENEMY: "#ff9800",           //orange
        STAIR_WALL: "#0000CC",
    },
    DATA: {
        PIX_SIZE: 4,
        layer: null,
        x: 0,
        y: 0,
        dungeon: null,
        drawX: null,
        drawY: null,
        w: null,
        h: null,
        rectWidth: 1
    },
    init(map, W, H, player, layer = "minimap") {
        this.DATA.dungeon = map;
        this.setLayer(layer);
        this.calcSize(W, H);
        this.player = player;
    },
    setLayer(layer) {
        this.DATA.layer = layer;
    },
    setOffset(x, y) {
        this.DATA.x = x;
        this.DATA.y = y;
    },
    calcSize(W, H) {
        const widthRatio = W / this.DATA.dungeon.width;
        const heightRatio = H / this.DATA.dungeon.height;
        this.DATA.PIX_SIZE = Math.floor(Math.min(widthRatio, heightRatio)) || 1;             // 1 is min pix size
        this.DATA.w = this.DATA.dungeon.width * this.DATA.PIX_SIZE;
        this.DATA.h = this.DATA.dungeon.height * this.DATA.PIX_SIZE;
        this.DATA.drawX = this.DATA.x + ((W - this.DATA.w) / 2) | 0;
        this.DATA.drawY = this.DATA.y + ((H - this.DATA.h) / 2) | 0;
        this.DATA.surface = this.DATA.dungeon.width * this.DATA.dungeon.height;
    },
    draw(radar, player = null, viewport = false) {
        ENGINE.clearLayer(this.DATA.layer);
        let CTX = LAYER[this.DATA.layer];
        if (MINIMAP.SETTING.FOG) {
            CTX.fillStyle = MINIMAP.LEGEND.FOG;
            CTX.strokeStyle = MINIMAP.LEGEND.FOG;
            CTX.strokeRect(this.DATA.drawX - this.DATA.rectWidth, this.DATA.drawY - this.DATA.rectWidth, this.DATA.w + 2 * this.DATA.rectWidth, this.DATA.h + 2 * this.DATA.rectWidth);
            CTX.fillRect(this.DATA.drawX, this.DATA.drawY, this.DATA.w, this.DATA.h);
        }
        const GA = this.DATA.dungeon.GA;
        //console.warn("GA", GA);
        const startIndex = this.player.depth * this.DATA.surface;
        const endIndex = startIndex + this.DATA.surface;
        //console.log("depth", this.player.depth, "startIndex", startIndex, "endIndex", endIndex);

        for (let index = startIndex; index < endIndex; index++) {
            const value = GA.map[index];
            if (value >= MAPDICT.FOG) continue;
            let ignored = [MAPDICT.RESERVED, MAPDICT.START_POSITION];
            let mask = 2 ** GA.gridSizeBit - 1;
            for (const ig of ignored) {
                mask -= ig;
            }
            let clenValue = value & mask;
            if (clenValue % 2 === 0) {
                //empty
                switch (clenValue) {
                    case MAPDICT.EMPTY:
                        CTX.fillStyle = MINIMAP.LEGEND.EMPTY;
                        break;
                    case MAPDICT.ROOM:
                        CTX.fillStyle = MINIMAP.LEGEND.ROOM;
                        break;
                    case MAPDICT.DOOR:
                        CTX.fillStyle = MINIMAP.LEGEND.DOOR;
                        break;
                    case MAPDICT.HOLE:
                        CTX.fillStyle = MINIMAP.LEGEND.HOLE;
                        break;
                    case MAPDICT.BLOCKWALL:
                        CTX.fillStyle = MINIMAP.LEGEND.BLOCKWALL;
                        break;
                    case MAPDICT.PILLAR:
                        CTX.fillStyle = MINIMAP.LEGEND.PILLAR;
                        break;
                    case MAPDICT.WALL2:
                    case MAPDICT.WALL4:
                    case MAPDICT.WALL6:
                    case MAPDICT.WALL8:
                        CTX.fillStyle = MINIMAP.LEGEND.STAIR_WALL;
                        break;
                    default:
                        if (this.VERBOSE) console.log("ALERT default empty", index, value, clenValue);
                        CTX.fillStyle = "#F00";
                        break;
                }
            } else {
                switch (clenValue) {
                    case MAPDICT.WALL:
                        CTX.fillStyle = MINIMAP.LEGEND.WALL;
                        break;
                    default:
                        let specificWall = clenValue - MAPDICT.WALL;
                        switch (specificWall) {
                            case MAPDICT.STAIR:
                                CTX.fillStyle = MINIMAP.LEGEND.STAIR;
                                break;
                            case MAPDICT.DOOR:
                                CTX.fillStyle = MINIMAP.LEGEND.LOCKED_DOOR;
                                break;
                            case MAPDICT.SHRINE:
                                CTX.fillStyle = MINIMAP.LEGEND.SHRINE;
                                break;
                            default:
                                if (this.VERBOSE) console.log("ALERT default wall", index, value, clenValue);
                                CTX.fillStyle = "#E00";
                                break;
                        }
                        break;
                }
            }
            let grid = GA.indexToGrid(index);
            //console.warn(index, "index,", grid, "grid");
            CTX.pixelAt(this.DATA.drawX + grid.x * this.DATA.PIX_SIZE, this.DATA.drawY + grid.y * this.DATA.PIX_SIZE, this.DATA.PIX_SIZE);
        }

        //keys
        for (const key in this.DATA.dungeon.keys) {
            if (this.DATA.dungeon.GA.isFog(this.DATA.dungeon.keys[key])) continue;
            CTX.fillStyle = key.toLowerCase();
            CTX.pixelAt(this.DATA.drawX + this.DATA.dungeon.keys[key].x * this.DATA.PIX_SIZE, this.DATA.drawY + this.DATA.dungeon.keys[key].y * this.DATA.PIX_SIZE, this.DATA.PIX_SIZE);
        }

        CTX.fillStyle = MINIMAP.LEGEND.HERO;

        let heroPos;
        if (player) {
            heroPos = player.pos;
        } else {
            heroPos = Grid.toClass(Vector3.to_FP_Grid(this.player.pos));
        }

        CTX.pixelAt(this.DATA.drawX + heroPos.x * this.DATA.PIX_SIZE, this.DATA.drawY + heroPos.y * this.DATA.PIX_SIZE, this.DATA.PIX_SIZE);

        //enemy if radar
        if (radar) {
            CTX.fillStyle = MINIMAP.LEGEND.ENEMY;
            const todo = [ENTITY3D, DYNAMIC_ITEM3D, ENEMY_TG];
            for (const IAM of todo) {
                if (!IAM.POOL) continue;
                for (const entity of IAM.POOL) {
                    if (!entity) continue;
                    if (this.player.depth !== entity.depth) continue;
                    let position;
                    if (entity.moveState.grid) {
                        position = Grid.toClass(entity.moveState.grid)
                    } else if (entity.moveState.homeGrid) {
                        position = Grid.toClass(entity.moveState.homeGrid);
                    } else throw "MINIMAP can't get enemy position from grid";
                    CTX.pixelAt(this.DATA.drawX + position.x * this.DATA.PIX_SIZE, this.DATA.drawY + position.y * this.DATA.PIX_SIZE, this.DATA.PIX_SIZE);
                }
            }
        }

        if (viewport) {
            const factor = this.DATA.PIX_SIZE / ENGINE.INI.GRIDPIX;
            CTX.strokeStyle = "yellow";
            CTX.strokeRect(this.DATA.drawX + ENGINE.VIEWPORT.vx * factor - 1,
                this.DATA.drawY + ENGINE.VIEWPORT.vy * factor - 1,
                ENGINE.gameWIDTH * factor + 1,
                ENGINE.gameHEIGHT * factor + 1
            );
        }
    },
    unveil(at, vision = 1) {
        let x = at.x - vision;
        let y = at.y - vision;
        let range = 2 * vision + 1;
        for (let ix = x; ix < x + range; ix++) {
            for (let iy = y; iy < y + range; iy++) {
                let grid = new Grid(ix, iy);
                if (!this.DATA.dungeon.GA.isOutOfBounds(grid)) {
                    this.DATA.dungeon.GA.clearFog(grid);
                }
            }
        }
    },
    reveal(origin, r) {
        let GA = this.DATA.dungeon.GA;
        let map = this.DATA.dungeon;
        let sX = Math.max(0, origin.x - r);
        let sY = Math.max(0, origin.y - r);
        let eX = Math.min(origin.x + r, map.maxX);
        let eY = Math.min(origin.y + r, map.maxY);
        for (let x = sX; x <= eX; x++) {
            for (let y = sY; y <= eY; y++) {
                let grid = new Grid(x, y);
                GA.clearFog(grid);
            }
        }
    }
};

//END
console.log(`%cMINIMAP ${MINIMAP.VERSION} loaded.`, MINIMAP.CSS);