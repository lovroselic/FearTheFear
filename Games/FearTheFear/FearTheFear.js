/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */
"use strict";

/////////////////////////////////////////////////
/*
      
TODO:
    * 
known bugs: 
    * i don't do bugs

retests:
    * all completed

 */
////////////////////////////////////////////////////

DEBUG.FPS = false;
DEBUG.VERBOSE = true;
DEBUG._2D_display = false;
DEBUG.pos_display = false;
DEBUG.BB_display = false;
DEBUG.INVINCIBLE = false;
DEBUG.INF_LIVES = false;
DEBUG.keys = true;
DEBUG.max17 = false;
DEBUG.STAY_ALIVE = false;

DEBUG.checkPoint = function () {

    console.info("DEBUG::Starting from checkpoint, this may clash with LOAD");

    GAME.level = 17;
    GAME.gold = 20000;
    //GAME.gold = 5;
    GAME.lives = 3;

    HERO.reference_magic = 55;
    HERO.reference_attack = 55;
    HERO.reference_defense = 55;

    HERO.magic = 55;
    HERO.attack = 55;
    HERO.defense = 55;

    HERO.mana = 500;
    HERO.maxMana = 500;
    HERO.health = 1;
    HERO.maxHealth = 500;

    HERO.attackExp = 18;
    HERO.attackExpGoal = 100;
    HERO.defenseExp = 4;
    HERO.defenseExpGoal = 100;
    HERO.magicExp = 0;
    HERO.magicExpGoal = 100;


    let actItems = [
    ];

    for (let obj of actItems) {
        let item = new ActionItem(obj.which, obj.inventorySprite);
        HERO.inventory.scroll.add(item);
    }

    let scrollTypes = [
        "FeatherFall", "Flight", "Radar", "Flight", "Invisibility"
    ];

    for (let scrType of scrollTypes) {
        let scroll = new Scroll(scrType);
        HERO.inventory.scroll.add(scroll);
    }

    TITLE.stack.scrollIndex = Math.max(TITLE.stack.scrollIndex, 0);
    TITLE.scrolls();

    let invItems = [

    ];

    for (let itm of invItems) {
        const item = new NamedInventoryItem(itm, itm);
        HERO.inventory.item.push(item);
    }

    let keys = [];
    for (let key of keys) {
        const K = new Key(key, `${key}Key`);
        HERO.inventory.key.push(K);
    }
    TITLE.keys();
};

/////////////////////////////////////////////

const INI = {
    HERO_SHOOT_TIMEOUT: 2000,
    SCREEN_BORDER: 256,
    INVENTORY_HARD_LIMIT: 20,
    ORB_MAX_CAPACITY: 5,
    MAX_HERO_HEALTH: 32,
    MAX_HERO_MANA: 17,
    AVATAR_TRANSPARENCY: 10,
    BOUNCE_COUNT: 5,
    SPAWN_DELAY: 9999,
    MONSTER_ATTACK_TIMEOUT: 3000,
    MONSTER_SHOOT_TIMEOUT: 14999,
    INI_BASE_EXP_FONT: 100,
    LEVEL_FACTOR: 1.5,
    HEALTH: {
        Cake: 40,
        Steak: 80,
        BeerHealth: 120,
        Champagne: 175,
        RoastChicken: 250,
        RoastPig: 500,
        HealthBox: 999,
    },
    MANA: {
        FireBall: 5,
        GreenBat: 10,
        Amanita: 20,
        Snail: 40,
        ManaFrog: 80,
        RedSpider: 100,
        RedButterfly: 150,
        ManaGoat: 200,
        Owl: 300,
        GreenManaDragon: 500,
        BluePrincesssMana: 750,
        GoldPrincessMana: 999,
    },
    HEALTH_INC: 8,
    MANA_INC: 7,
    SCROLL_RANGE: 30,
    CRIPPLE_SPEED: 0.1,
    INVISIBILITY_TIME: 60,
    JUMP_POWER: 1.55,                    // jump distance in grid units 1.55 default
    MAX_JUMP_POWER: 3.5,
    LUCKY_TIME: 59,
    VERY_LUCKY_LUCK: 5,
    FLIGHT_TIME: 59,
    RADAR_TIME: 99,
    FEATHER_TIME: 59,
    BOOST_TIME: 59,
    MINIMAP_W: 80,
    MINIMAP_H: 80,
    MANA_TIME: 59, //59
    MANA_DISCOUNT_FACTOR: 0.7,
    WINDOW_SCALE: 0.90,
    HELP_PRICE: 10,
    BURNING_TIME: 1500,
};

/////////////////////////////////////////////

const PRG = {
    VERSION: "0.1.1",
    NAME: "Fear The Fear",
    YEAR: "2026",
    SG: "FTF",
    CSS: "color: #239AFF;",
    INIT() {
        console.log("%c**************************************************************************************************************************************", PRG.CSS);
        console.log(`${PRG.NAME} ${PRG.VERSION} by Lovro Selic, (c) LaughingSkull ${PRG.YEAR} on ${navigator.userAgent}`);
        console.log("%c**************************************************************************************************************************************", PRG.CSS);
        $("#title").html(PRG.NAME);
        $("#version").html(`${PRG.NAME} V${PRG.VERSION} <span style='font-size:14px'>&copy</span> LaughingSkull ${PRG.YEAR}`);
        $("input#toggleAbout").val("About " + PRG.NAME);
        $("#about fieldset legend").append(" " + PRG.NAME + " ");

        ENGINE.autostart = true;
        ENGINE.start = PRG.start;
        ENGINE.readyCall = GAME.setup;
        ENGINE.setGridSize(64);
        ENGINE.setSpriteSheetSize(64);
        ENGINE.init();
    },
    setup() {
        if (DEBUG.SETTING) {
            $("#engine_version").html(ENGINE.VERSION);
            $("#grid_version").html(GRID.VERSION);
            $("#maze_version").html(DUNGEON.VERSION);
            $("#iam_version").html(IndexArrayManagers.VERSION);
            $("#lib_version").html(LIB.VERSION);
            $("#webgl_version").html(WebGL.VERSION);
            $("#maptools_version").html(MAP_TOOLS.VERSION);
            $("#speech_version").html(SPEECH.VERSION);
        } else {
            $('#debug').hide();
        }

        $("#toggleHelp").click(function () {
            $("#help").toggle(400);
        });
        $("#toggleAbout").click(function () {
            $("#about").toggle(400);
        });
        $("#toggleVersion").click(function () {
            $("#debug").toggle(400);
        });
        $("#toggleSaveGame").click(function () {
            $("#savegame_manager").toggle(400);
        });

        //boxes
        ENGINE.gameWIDTH = 1024;
        ENGINE.titleWIDTH = 1280 + INI.SCREEN_BORDER;
        ENGINE.sideWIDTH = ENGINE.titleWIDTH - ENGINE.gameWIDTH - INI.SCREEN_BORDER;
        ENGINE.gameHEIGHT = 768;
        ENGINE.titleHEIGHT = 96;
        ENGINE.bottomHEIGHT = 80;
        ENGINE.bottomWIDTH = ENGINE.titleWIDTH;
        MAP_TOOLS.INI.FOG = false;

        $("#bottom").css("margin-top", ENGINE.gameHEIGHT + ENGINE.titleHEIGHT + ENGINE.bottomHEIGHT);
        $(ENGINE.gameWindowId).width(ENGINE.gameWIDTH + 2 * ENGINE.sideWIDTH + 4);
        ENGINE.addBOX("TITLE", ENGINE.titleWIDTH, ENGINE.titleHEIGHT, ["title", "compassRose", "compassNeedle", "lives", "minimap", "gold"], null);
        ENGINE.addBOX("LSIDE", INI.SCREEN_BORDER, ENGINE.gameHEIGHT, ["Lsideback", "health"], "side");
        ENGINE.addBOX("ROOM", ENGINE.gameWIDTH, ENGINE.gameHEIGHT, ["background", "3d_webgl", "info", "text", "FPS", "button", "click"], "side");
        ENGINE.addBOX("SIDE", ENGINE.sideWIDTH, ENGINE.gameHEIGHT, ["sideback", "keys", "time", "scrolls", "orbs", "skills"], "fside");
        ENGINE.addBOX("DOWN", ENGINE.bottomWIDTH, ENGINE.bottomHEIGHT, ["bottom", "bottomText", "save", "subtitle"], null);

        MINIMAP.setOffset((INI.SCREEN_BORDER - INI.MINIMAP_W) / 2, (ENGINE.titleHEIGHT - INI.MINIMAP_H) / 2);

        if (DEBUG._2D_display) {
            ENGINE.addBOX("LEVEL", ENGINE.gameWIDTH, ENGINE.gameHEIGHT, ["pacgrid", "grid", "coord", "player"], null);
        }

        /** dev settings */
        if (DEBUG.VERBOSE) {
            //WebGL.VERBOSE = true;
            //AI.VERBOSE = true;
           //ENGINE.verbose = true;
            MAP_TOOLS.INI.VERBOSE = true;
            //MINIMAP.verbose();
        }
    },
    start() {
        console.log("%c**************************************************************************************************************************************", PRG.CSS);
        console.log(`${PRG.NAME} ${PRG.VERSION} STARTED!`);
        console.log("%c**************************************************************************************************************************************", PRG.CSS);
        $(ENGINE.topCanvas).off("mousemove", ENGINE.mouseOver);
        $(ENGINE.topCanvas).off("click", ENGINE.mouseClick);
        $(ENGINE.topCanvas).css("cursor", "");

        if (SPEECH.VERBOSE) {
            console.info("SPEECH available voices");
            console.table(SPEECH.voices);
            console.info(SPEECH.voices);
        }

        $("#startGame").addClass("hidden");
        ENGINE.disableDefaultKeys();
        SAVE_GAME.manager_HTML();
        TITLE.startTitle();
    }
};

/**
 * *******************************************************************************************
 */

class Key {
    constructor(color, spriteClass) {
        this.category = "Key";
        this.type = "Key";
        this.color = color;
        this.spriteClass = spriteClass;
    }
}

class NamedInventoryItem {
    constructor(name, spriteClass) {
        this.name = name;
        this.spriteClass = spriteClass;
    }
}

class Status {
    constructor(type, spriteClass) {
        this.type = type;
        this.spriteClass = spriteClass;
    }
}

class ActionItem {
    constructor(type, spriteClass) {
        this.type = type;
        this.id = `${type}-${spriteClass}`;
        this.spriteClass = spriteClass;
        this.sprite = SPRITE[this.spriteClass];
        this.class = "ActionItem";
        this.saveDefinition = ['class', 'type', "spriteClass"];
    }
    action() {
        switch (this.type) {
            case "health":
                HERO.incHealth(this.spriteClass);
                break;
            case "mana":
                HERO.incMana(this.spriteClass);
                break;
            default:
                console.error("ERROR ActionItem action", this);
                break;
        }
    }
}

class Scroll {
    constructor(type) {
        this.type = type;
        this.id = this.type;
        this.inventorySprite = `SCR_${type}`;
        this.sprite = SPRITE[this.inventorySprite];
        this.class = "Scroll";
        this.saveDefinition = ['class', 'type'];
    }
    action() {
        console.warn("scroll action", this);
        let T;
        let count = 0;
        const luckyTimerId = "luckyTimer";
        switch (this.type) {
            case "Cripple":
                for (let enemy of ENTITY3D.POOL) {
                    if (enemy === null) continue;
                    if (enemy.final_boss || enemy.boss) continue;
                    if (enemy.distance === null) continue;
                    if (enemy.fly && enemy.fly > 0.0) continue;
                    if (enemy.distance <= INI.SCROLL_RANGE) {
                        enemy.moveSpeed = INI.CRIPPLE_SPEED;
                        console.warn("crippled", enemy);
                    }
                }
                break;
            case "HalfLife":
                for (let enemy of ENTITY3D.POOL) {
                    if (enemy === null) continue;
                    if (enemy.distance === null) continue;
                    if (enemy.distance <= INI.SCROLL_RANGE) {
                        enemy.health = Math.max(1, Math.floor(enemy.health / 2));
                    }
                }
                break;
            case "Explode":
                EXPLOSION3D.add(new StaticParticleBomb(HERO.player.pos));
                AUDIO.Fuse.volume = RAY.volume(0);
                AUDIO.Fuse.loop = true;
                AUDIO.Fuse.play();
                const escapeTexts = [
                    "I better run away.",
                    "This thing is going to explode.",
                    "I should move.",
                    "Run, you fool.",
                    "This is about to get loud.",
                    "Boom incoming!",
                    "Goodbye, cruel bomb!",
                    "Hope my shoes can keep up!",
                    "Cue the dramatic exit.",
                    "Running seems like a good idea right now.",
                    "Standing close to bomb seems a bad idea."
                ];

                HERO.speak(escapeTexts.chooseRandom());
                break;
            case "Death":
                for (let enemy of ENTITY3D.POOL) {
                    if (enemy === null) continue;
                    if (enemy.final_boss || enemy.boss) continue;
                    if (enemy.airDistance === null && enemy.distance === null) continue;
                    if ((enemy.airDistance || enemy.distance) <= INI.SCROLL_RANGE) {
                        enemy.die();
                        count++;
                    }
                }
                if (count === 0) return;
                const masacreTexts = [
                    "I feel naughty.",
                    "I just burned them all. Almost.",
                    "Burn bastards.",
                    "Oops, did I do that?",
                    "I guess I won't need a mop.",
                    "That was… efficient.",
                    "Well, that escalated quickly.",
                    "Cleanup in the dungeon!",
                    "Don't mess with royalty!",
                    "So much for diplomacy.",
                    "Consider yourself... canceled.",
                    "Guess that's one way to solve a problem.",
                    "Who's next? Oh wait, no one!",
                    "I came, I saw, I obliterated."
                ];

                HERO.speak(masacreTexts.chooseRandom());
                break;
            case "MagicSupremacy":
                for (let enemy of ENTITY3D.POOL) {
                    if (enemy === null) continue;
                    if (enemy.final_boss || enemy.boss) continue;
                    if (enemy.distance === null) continue;
                    if (enemy.distance <= INI.SCROLL_RANGE) {
                        count++;
                        enemy.drainMana();
                    }
                }
                if (count === 0) return;
                const drainTexts = [
                    "I squeezed the magic out of them.",
                    "Made them magic virgins.",
                    "No green meanies from them anymore.",
                    "I made them ballless. Ha ha.",
                    "Oops, guess you're powerless now!",
                    "Look who's out of tricks.",
                    "I drained them dry. Magic, I mean.",
                    "And poof! No more spells for you.",
                    "I took their magic, and their dignity.",
                    "Looks like someone's got mana issues now.",
                    "No more green balls? What a shame.",
                    "Their magic went bye bye!",
                    "I guess I'll hold onto that mana, thanks.",
                    "No spells? Guess it's fistfight time!",
                    "Who needs magic anyway, right?"
                ];
                HERO.speak(drainTexts.chooseRandom());
                break;
            case "DrainMana":
                for (let enemy of ENTITY3D.POOL) {
                    if (enemy === null) continue;
                    if (enemy.final_boss) continue;
                    if (enemy.distance === null) continue;
                    if (enemy.distance <= INI.SCROLL_RANGE) {
                        enemy.drainMana();
                    }
                }
                HERO.mana = 0;
                TITLE.skills();
                break;
            case "DestroyOrbs":
                for (let missile of MISSILE3D.POOL) {
                    if (!missile.friendly) missile.explode(MISSILE3D);
                }
                break;
            case "Invisibility":
                console.warn("invisibility");
                HERO.startInvisibility();
                const invisibilityTimerId = "invisibilityTimer";
                if (ENGINE.TIMERS.exists(invisibilityTimerId)) {
                    T = ENGINE.TIMERS.access(invisibilityTimerId);
                    T.extend(INI.INVISIBILITY_TIME);
                } else {
                    T = new CountDown(invisibilityTimerId, INI.INVISIBILITY_TIME, HERO.cancelInvisibility);
                    let status = new Status("Invisibility", "Invisible");
                    HERO.inventory.status.push(status);
                    TITLE.keys();
                }
                break;
            case "Luck":
                HERO.lucky();
                if (ENGINE.TIMERS.exists(luckyTimerId)) {
                    T = ENGINE.TIMERS.access(luckyTimerId);
                    T.extend(INI.LUCKY_TIME);
                } else {
                    T = new CountDown(luckyTimerId, INI.LUCKY_TIME, HERO.cancelLuck);
                    let status = new Status("Luck", "Clover");
                    HERO.inventory.status.push(status);
                    TITLE.keys();
                }
                break;
            case "VeryLucky":
                HERO.lucky(INI.VERY_LUCKY_LUCK);
                if (ENGINE.TIMERS.exists(luckyTimerId)) {
                    T = ENGINE.TIMERS.access(luckyTimerId);
                    T.extend(INI.LUCKY_TIME);
                } else {
                    T = new CountDown(luckyTimerId, INI.LUCKY_TIME, HERO.cancelLuck);
                    let status = new Status("VeryLucky", "GoldClover");
                    HERO.inventory.status.push(status);
                    TITLE.keys();
                }
                break;
            case "Flight":
                HERO.flightOn();
                const flightTimerId = "flightTimer";
                if (ENGINE.TIMERS.exists(flightTimerId)) {
                    T = ENGINE.TIMERS.access(flightTimerId);
                    T.extend(INI.FLIGHT_TIME);
                } else {
                    T = new CountDown(flightTimerId, INI.FLIGHT_TIME, HERO.cancelFlight);
                    let status = new Status("Flight", "Wings");
                    HERO.inventory.status.push(status);
                    TITLE.keys();
                }
                break;
            case "FeatherFall":
                HERO.featherFallOn();
                const featherTimerId = "featherTimer";
                if (ENGINE.TIMERS.exists(featherTimerId)) {
                    T = ENGINE.TIMERS.access(featherTimerId);
                    T.extend(INI.FEATHER_TIME);
                } else {
                    T = new CountDown(featherTimerId, INI.FEATHER_TIME, HERO.cancelFeatherFall);
                    let status = new Status("FeatherFall", "FeatherFall");
                    HERO.inventory.status.push(status);
                    TITLE.keys();
                }
                break;
            case "BoostWeapon":
                Scroll.boost("attack");
                break;
            case "BoostArmor":
                Scroll.boost("defense");
                break;
            case "MagicBoost":
                Scroll.boost("magic");
                break;
            case "DestroyWeapon":
                for (const enemy of ENTITY3D.POOL) {
                    if (enemy === null) continue;
                    if (enemy.distance === null) continue;
                    if (enemy.distance <= INI.SCROLL_RANGE) {
                        const factor = RND(25, 50) / 100;
                        enemy.attack -= Math.ceil(enemy.attack * factor);
                    }
                }
                break;
            case "DestroyArmor":
                for (let enemy of ENTITY3D.POOL) {
                    if (enemy === null) continue;
                    if (enemy.distance === null) continue;
                    if (enemy.distance <= INI.SCROLL_RANGE) {
                        let factor = RND(25, 50) / 100;
                        enemy.defense -= Math.ceil(enemy.defense * factor);
                    }
                }
                break;
            case "Radar":
                HERO.setRadar();
                const radarTimerId = "radarTimer";
                if (ENGINE.TIMERS.exists(radarTimerId)) {
                    T = ENGINE.TIMERS.access(radarTimerId);
                    T.extend(INI.RADAR_TIME);
                } else {
                    T = new CountDown(radarTimerId, INI.RADAR_TIME, HERO.clearRadar);
                    let status = new Status("Radar", "Radar");
                    HERO.inventory.status.push(status);
                    TITLE.keys();
                }
                break;
            case "ReduceManaMore":
                HERO.setManaDiscount(INI.MANA_DISCOUNT_FACTOR);
            case "ReduceMana":
                HERO.setManaDiscount(INI.MANA_DISCOUNT_FACTOR);
                const manaTimerId = "manaDiscountTimer";
                if (ENGINE.TIMERS.exists(manaTimerId)) {
                    T = ENGINE.TIMERS.access(manaTimerId);
                    T.extend(INI.MANA_TIME);
                } else {
                    T = new CountDown(manaTimerId, INI.MANA_TIME, HERO.manaDiscountOff);
                }
                TITLE.skills();
                break;
            default:
                console.error("ERROR scroll action", this);
                break;
        }
        AUDIO.UseScroll.play();
    }
    static boost(type) {
        let T;
        HERO.incStat(type);
        const TimerId = `${type}_timer`;
        if (ENGINE.TIMERS.exists(TimerId)) {
            T = ENGINE.TIMERS.access(TimerId);
            T.reset();
        } else T = new CountDown(TimerId, INI.BOOST_TIME, HERO.resetStat.bind(null, type));
    }
}

/**
 * *******************************************************************************************
 */

const HERO = {
    construct() {
        this.player = null;
        this.height = WebGL.INI.HERO_HEIGHT;
        this.inventory.clear();
        this.inventoryLimit = INI.INVENTORY_HARD_LIMIT;
        this.canComplain = true;
        this.maxHealth = INI.MAX_HERO_HEALTH;
        this.maxMana = INI.MAX_HERO_MANA;
        this.reference_magic = 5;
        this.reference_attack = 5;
        this.reference_defense = 0;
        this.ressurection = false;
        this.attackExp = 0;
        this.defenseExp = 0;
        this.magicExp = 0;
        this.attackExpGoal = INI.INI_BASE_EXP_FONT;
        this.defenseExpGoal = INI.INI_BASE_EXP_FONT;
        this.magicExpGoal = INI.INI_BASE_EXP_FONT;

        this.reset();
        this.revive();
        this.visible();
        this.clearRadar();
        this.manaDiscountOff();

        const propsToSave = [
            "health", "maxHealth", "attack", "magic", "defense", "mana", "maxMana",
            "reference_defense", "reference_attack", "reference_magic",
            "attackExp", "defenseExp", "magicExp", "attackExpGoal", "defenseExpGoal", "magicExpGoal",
        ];
        this.attributesForSaveGame = [];
        for (const P of propsToSave) {
            this.attributesForSaveGame.push(`HERO.${P}`);
        }
    },
    clearRadar() {
        HERO.radar = false;
        HERO.removeStatus("Radar");
        TITLE.keys();
    },
    setRadar() {
        HERO.radar = true;
    },
    reset() {
        HERO.defense = HERO.reference_defense;
        HERO.attack = HERO.reference_attack;
        HERO.magic = HERO.reference_magic;

        HERO.unlucky();
        HERO.flightOff();
        HERO.featherFallOff();
        HERO.manaDiscountOff();
        HERO.burnOff();
    },
    manaDiscountOff() {
        HERO.manaDiscount = 1.0;
        TITLE.skills();
    },
    setManaDiscount(factor) {
        HERO.manaDiscount *= factor;
    },
    requestJump() {
        this.player.requestJump(this.jumpPower);
    },
    revive() {
        this.dead = false;
        this.health = this.maxHealth;
        this.canShoot = true;
        this.mana = this.maxMana;
    },
    speak(txt) {
        SPEECH.use("Princess");
        SPEECH.speakWithArticulation(txt);
        TURN.subtitle(txt);
    },
    concludeAction() {
        if (!this.player.actionModes.includes(this.player.mode)) {
            this.player.setMode("idle");
        }
        if (WebGL.CONFIG.firstperson && !this.player.lookingAround && Math.abs(this.player.camera.direction_offset.y) > 0) {
            this.player.resetCamera();
        }

        this.player.lookingAround = false;
    },
    shoot() {
        if (HERO.dead) return;
        if (!HERO.canShoot) return;

        let cost = BouncingMissile.calcMana(HERO.reference_magic);
        cost = Math.round(cost * this.manaDiscount);

        if (DEBUG.FREE_MAGIC) cost = 0;
        if (cost > HERO.mana) return AUDIO.MagicFail.play();

        HERO.mana -= cost;
        TITLE.skills();

        HERO.player.matrixUpdate();

        HERO.canShoot = false;
        const position = HERO.player.pos.translate(HERO.player.dir, HERO.player.r);
        const missile = new BouncingMissile(position, HERO.player.dir, COMMON_ITEM_TYPE.Orb, HERO.magic, ParticleExplosion, true, INTERACTION_OBJECT.Orb);
        //console.warn("hero shoots", missile);
        MISSILE3D.add(missile);
        setTimeout(() => (HERO.canShoot = true), INI.HERO_SHOOT_TIMEOUT);
        return;
    },
    hitByMissile(missile) {
        if (DEBUG.VERBOSE) console.warn("HERO hit by missile", missile, "friendly", missile.friendly);
        if (missile.friendly) {
            this.catchOrb(missile);
            missile.remove(MISSILE3D);
        } else {
            const damage = Math.max(missile.calcDamage(HERO.magic, true), 1) - HERO.luck;
            HERO.applyDamage(damage);
            missile.explode(MISSILE3D);
            HERO.incExp(Math.round(damage / 4), "magic");
            if (HERO.player.isJumping) HERO.player.fallDown();
        }
    },
    inventory: {
        clear() {
            this.key = [];
            this.item = [];
            this.status = [];
            this.scroll = new Inventory();
        },
        totalSize() {
            return this.key.length + this.item.length;
        }
    },
    getOrb(text, missile = null) {
        this.speak(text.chooseRandom());
        AUDIO.CatchFireball.play();
        HERO._incMana(Math.round(missile.power * 0.45));
    },
    catchOrb(missile) {
        const text = [
            "Good catch.",
            "Come to mamma.",
            "Back to my bag.",
            "Gotcha, orb.",
            "Mine again.",
            "Back in action.",
            "Reclaimed it.",
            "Catching skills on point.",
            "Welcome back, little orb.",
            "Caught it like a pro.",
            "Back where you belong.",
            "Snatched from the jaws of defeat.",
            "Orb retrieval successful.",
            "Caught and ready for round two.",
            "Return to sender.",
            "Boomerang orb.",
        ];
        return this.getOrb(text, missile);
    },
    applyDamage(damage) {
        HERO.health = Math.max(HERO.health - damage, 0);
        TITLE.health();
        if (HERO.health <= 0) {
            if (!DEBUG.INVINCIBLE) HERO.die();
        }
    },
    die() {
        if (HERO.dead) return;
        console.warn("hero dies");
        HERO.dead = true;
        HERO.canShoot = false;
    },
    death() {
        console.error("HERO DEATH");
        MISSILE3D.POOL.clear();
        AUDIO.PrincessScream.play();
        GAME.lives--;
        TITLE.lives();

        const heroRefGrid = Vector3.to_Grid3D(HERO.player.pos.translate(UP3, HERO.player.heigth));
        const gridValue = REVERSED_MAPDICT[HERO.player.map.GA.getValue(heroRefGrid)];
        const heightOffset = parseInt(gridValue[4], 10) / 10 || 0;
        const depth = Math.max(0, HERO.player.depth);
        HERO.player.pos.set_y(0.1 + depth + heightOffset);
        WebGL.GAME.setFirstPerson();
        WebGL.GAME.positionUpdate();
        if (GAME.lives <= 0) return HERO.finalDeath();

        if (gridValue !== "HOLE") {
            const grid = Vector3.to_Grid3D(HERO.player.pos);
            const face = DirectionToFace(NOWAY);
            const decal = SPRITE.DeathPlace;
            const deathPlace = new StaticDecal(grid, face, decal, "crest", "DeathPlace", true);
            GAME.deathPlaceDecals.push(deathPlace);
        }

        HERO.ressurection = true;
        GAME.STORE.storeIAM(MAP[GAME.level].map);
        ENGINE.TEXT.centeredText("Press ENTER to resurect The Princess", ENGINE.gameWIDTH, ENGINE.gameHEIGHT / 2);
        ENGINE.GAME.ANIMATION.resetTimer();
        ENGINE.GAME.ANIMATION.next(GAME.lifeLostRun);
    },
    finalDeath() {
        console.error("HERO FINAL death");
        for (const L of LIGHTS3D.POOL) {
            L.lightColor = Array(0, 0, 0);
        }
        ENGINE.TEXT.centeredText("Rest In Peace", ENGINE.gameWIDTH, ENGINE.gameHEIGHT / 2);
        ENGINE.TEXT.centeredText("(ENTER)", ENGINE.gameWIDTH, ENGINE.gameHEIGHT / 2 + ENGINE.TEXT.RD.fs * 1.2);
        ENGINE.GAME.ANIMATION.resetTimer();
        ENGINE.GAME.ANIMATION.next(GAME.gameOverRun);

        GAME.restarted = true;
        MAP[GAME.level].map.storage.clear();
    },
    raiseStat(which, level = 1) {
        this[`reference_${which}`] += level;
        this[which] += level;
        TITLE.skills();
    },
    incExp(value, type) {
        if (DEBUG.VERBOSE) console.log("incExp", type, value);
        this[`${type}Exp`] += value;
        if (this[`${type}Exp`] >= this[`${type}ExpGoal`]) {
            AUDIO.LevelUp.play();
            this[`${type}Exp`] -= this[`${type}ExpGoal`];
            this[type]++;
            this[`reference_${type}`]++;
            this[`${type}ExpGoal`] = this.nextLevel(this[`${type}ExpGoal`]);
            switch (type) {
                case "attack":
                case "defense":
                    this.incStatus("health");
                    break;
                case "magic":
                    this.incStatus("mana");
                    break;
                default:
                    throw "exp type error";
            }
            TITLE.skills();
        }

        if (DEBUG.VERBOSE) {
            console.log("------ EXP ------");
            for (const type of ["attack", "defense", "magic"]) {
                console.log(type, ":", this[`${type}Exp`], " /", this[`${type}ExpGoal`]);
            }
            console.log("------------");
        }
    },
    nextLevel(value) {
        return Math.round(value * INI.LEVEL_FACTOR);
    },
    incHealth(sprite) {
        let incValue = INI.HEALTH[sprite];
        HERO.health += incValue;
        HERO.health = Math.min(HERO.health, HERO.maxHealth);
        AUDIO.Eating.play();
        TITLE.health();
    },
    incMana(sprite) {
        let incValue = INI.MANA[sprite];
        HERO._incMana(incValue);
        AUDIO.Swallow.play();
    },
    _incMana(value) {
        HERO.mana += value;
        HERO.mana = Math.min(HERO.mana, HERO.maxMana);
        TITLE.skills();
    },
    restore() {
        this.health = this.maxHealth;
        this.mana = this.maxMana;
        TITLE.health();
    },
    incStatus(type, level = 1) {
        let Type = type.capitalize();
        let max = `max${Type}`;
        this[max] += INI[`${type.toUpperCase()}_INC`] * level;
        this[type] = this[max];
        TITLE.health();
        TITLE.skills();
    },
    visible() {
        HERO.invisible = false;
    },
    cancelInvisibility() {
        console.warn("invisinbility END");
        HERO.removeStatus("Invisibility");
        HERO.visible();
        TITLE.keys();
        HERO.player.useTexture("normal");

        const text = [
            "Oops, guess I'm back in the spotlight!",
            "Ta-da! The Princess has reappeared.",
            "Miss me? Didn't think so.",
            "Invisible no more... fabulous as ever.",
            "Back to being everyone's favorite target.",
            "Hide and seek's over, I guess.",
            "So much for stealth mode.",
            "Can everyone see me now? Great.",
            "Back to dodging monsters the hard way!",
            "I'm visible... again. Lovely.",
            "The magic wore off... typical.",
            "Stealth was fun while it lasted.",
            "Guess I'll have to fight fair now!",
            "And I'm back in the spotlight.",
            "Surprise! Did you miss me?",
            "Oops, cover's blown.",
            "Guess the magic ran out...",
            "Oh great, now I'm a target again.",
            "Visibility: 100%. Not ideal.",
            "So much for my ghostly exit.",
            "Oh, now you can see me? Fun.",
            "I guess stealth isn't forever.",
            "Busted! Time to fight like a Princess!",
            "Can't stay hidden forever, I suppose.",

        ];
        HERO.speak(text.chooseRandom());
    },
    startInvisibility() {
        console.warn("invisinbility START");
        HERO.invisible = true;
        HERO.player.useTexture("invisible");
        const text = [
            "Nobody can see me now.",
            "I am invisible",
            "Peek-a-boo, I'm gone!",
            "Now you see me… well, no you don't.",
            "Guess I'm too fabulous to be seen.",
            "Catch me if you... oh wait, you can't!",
            "Invisible and invincible—perfect combo.",
            "I'm like a ghost, but, you know, alive.",
            "Just your friendly neighborhood invisible princess!",
            "Sorry, monsters, can't kill what you can't see!",
            "Playing hide and seek, anyone?",
            "I'm like a royal ghost now.",
            "Try finding what isn't there!",
            "Poof! Princess gone, just like magic.",
            "If you can't see me, you can't hurt me!",
            "I could get used to this stealthy life."

        ];
        this.speak(text.chooseRandom());
    },
    removeStatus(status) {
        for (let i = HERO.inventory.status.length - 1; i >= 0; i--) {
            if (HERO.inventory.status[i].type === status) {
                HERO.inventory.status.splice(i, 1);
                break;
            }
        }
    },
    lucky(luck = 1) {
        HERO.luck += luck;
    },
    unlucky() {
        HERO.luck = 0;
    },
    cancelLuck() {
        HERO.removeStatus("Luck");
        HERO.removeStatus("VeryLucky");
        HERO.unlucky();
        TITLE.keys();
    },
    flightOn() {
        this.jumpPower = INI.MAX_JUMP_POWER;
    },
    flightOff() {
        this.jumpPower = INI.JUMP_POWER;
    },
    cancelFlight() {
        HERO.removeStatus("Flight");
        HERO.flightOff();
        TITLE.keys();
    },
    featherFallOn() {
        this.featherFall = true;
    },
    featherFallOff() {
        this.featherFall = false;
    },
    cancelFeatherFall() {
        HERO.removeStatus("FeatherFall");
        HERO.featherFallOff();
        TITLE.keys();
    },
    incStat(which) {
        let factor = RND(1, 3) / 10 + 1;
        HERO[which] = Math.ceil(HERO[which] * factor);
        TITLE.skills();
    },
    resetStat(which) {
        HERO[which] = HERO[`reference_${which}`];
        TITLE.skills();
    },
    burn(damage) {
        if (HERO.burning) return;
        HERO.burning = true;
        HERO.applyDamage(damage);
        const _T = new CountDownMS("BurnTimer", INI.BOOST_TIME, HERO.burnOff);
        const texts = [
            "My ass is on fire.",
            "Burning my ass might not be such a great idea.",
            "I feel hot. Too hot.",
            "Note to self, fire is hot.",
            "I am being BBQ'd royalty.",
            "Hot tip, leave the fire.",
            "This pit is not a throne.",
            "I did not order extra spicy.",
            "I am a candle now.",
            "Armor vs barbecue, barbecue wins.",
            "Health doing a melt speedrun.",
            "Ow ow ow, science confirms.",
            "I smell smoke, it is me.",
            "Fire walk, zero achievements.",
            "My boots are simmering.",
            "Bacon noises, suspiciously mine.",
            "Fire resistance was a rumor.",
            "This hurts in real time.",
            "Healer, bring a bucket.",
            "I am preheating.",
            "Toast status, confirmed.",
            "Heat seeking princess acquired.",
            "Lava cosplay complete.",
            "I am not a phoenix.",
            "Sizzle sizzle, subtle hint.",
            "Pixels are starting to crisp.",
            "I came for treasure, stayed for third degree.",
            "The firepit does not accept hugs.",
            "I am learning why ovens have doors.",
            "Yup, HP is flambe."
        ];
        this.speak(texts.chooseRandom());
    },
    burnOff() {
        HERO.burning = false;
    },
};

/**
 * *******************************************************************************************
 */

const GAME = {
    gold: 0,                                // WebGl relies on this as default gold source, keep! 
    loadWayPoint: null,                     // save game pointer, keep!
    canBeSaved: true,
    previously: null,
    restarted: false,
    start() {
        console.log("GAME started");
        if (AUDIO.Title) {
            AUDIO.Title.pause();
            AUDIO.Title.currentTime = 0;
        }
        $(ENGINE.topCanvas).off("mousemove", ENGINE.mouseOver);
        $(ENGINE.topCanvas).off("click", ENGINE.mouseClick);
        $(ENGINE.topCanvas).css("cursor", "");
        ENGINE.hideMouse();
        ENGINE.GAME.pauseBlock();
        ENGINE.GAME.paused = true;
        let GameRD = new RenderData("FTF", 60, "#fF2010", "text", "#444444", 2, 2, 2);
        ENGINE.TEXT.setRD(GameRD);
        ENGINE.watchVisibility(ENGINE.GAME.lostFocus);
        ENGINE.GAME.setGameLoop(GAME.run);
        ENGINE.GAME.start(16);

        GAME.IAM_settings();
        GAME.WebGL_settings();
        GAME.AI_settings();

        GAME.completed = false;
        GAME.lives = 1;
        GAME.level = 1;
        GAME.gold = 13;

        const storeList = ["DECAL3D", "LIGHTS3D", "GATE3D", "VANISHING3D", "ITEM3D", "MISSILE3D", "INTERACTIVE_DECAL3D", "INTERACTIVE_BUMP3D", "ENTITY3D", "EXPLOSION3D", "DYNAMIC_ITEM3D", "LAIR", "FIRE3D"];
        GAME.STORE = new Store(storeList);

        HERO.construct();
        ENGINE.VECTOR2D.configure("player");
        GAME.fps = new FPS_short_term_measurement(300);
        GAME.prepareForRestart();
        GAME.time = new Timer("Main");

        /** DEBUG */
        //DEBUG.checkPoint();
        /** END DEBUG */

        //SAVE GAME
        SAVE_GAME.pointers = [...HERO.attributesForSaveGame,
            'GAME.level', 'GAME.gold',
            "HERO.inventory.item", "HERO.inventory.key",
            "GAME.loadWayPoint", "GAME.lives"
        ];
        SAVE_GAME.lists = ["HERO.inventory.scroll"];
        SAVE_GAME.timers = ["Main"];
        SAVE_GAME.map_properties = ["killCount", "maxSpawned", "killCountdown", "spawnDelay", "totalKills", "stopSpawning", "killsRequiredToStopSpawning"];
        //end SAVE

        //load from checkpoint
        if (GAME.fromCheckpoint) {
            if (DEBUG.VERBOSE) console.log(`%c ... Loading part 1...`, GAME.CSS);
            GAME.load();
            HERO.reset();
        }
        //end load

        LAIR.configure(INI.SPAWN_DELAY, GAME.canSpawn, GAME.spawn, HERO);

        if (DEBUG.AUTO_TEST) {
            return DEBUG.automaticTests();
        }

        GAME.levelStart();
    },
    deathPlaceDecals: [],
    AI_settings() {
        AI.immobileWander = true;
    },
    IAM_settings() { },
    WebGL_settings() {
        WebGL.VIEWS_ALLOWED = new Set([1, 3]);
        WebGL.GAME.setViewButtons();
    },
    levelStart() {
        console.log("starting level", GAME.level);
        WebGL.playerList.clear();                           //requred for restart after resurrection
        GAME.initLevel(GAME.level);
        WebGL.GAME.setFirstPerson();                        //my preference
        GAME.continueLevel(GAME.level);
    },
    continueLevel(level) {
        GAME.levelExecute(level);
    },
    levelExecute(level) {
        GAME.drawFirstFrame(level);
        LAIR.start();
        ENGINE.GAME.resume();
        HERO.speak("debug");
    },
    setCameraView() {
        WebGL.hero.firstPersonCamera = new $3D_Camera(WebGL.hero.player, DIR_NOWAY, 0.0, new Vector3(0, 0, 0), 0);
        WebGL.hero.topCamera = new $3D_Camera(WebGL.hero.player, DIR_UP, 0.9, new Vector3(0, -0.5, 0), 1, 70);
        WebGL.hero.topCameraLowAngle = new $3D_Camera(WebGL.hero.player, DIR_UP, 0.13, new Vector3(0, -0.35, 0), 0.70);
        WebGL.hero.overheadCamera = new $3D_Camera(WebGL.hero.player, DIR_UP, 2.5, new Vector3(0, -1, 0), 1, 80);
        WebGL.hero.orto_overheadCamera = new $3D_Camera(WebGL.hero.player, DIR_UP, 4, new Vector3(0, -1, 0), 0.4, 80);

        switch (WebGL.CONFIG.cameraType) {
            case "first_person":
                WebGL.hero.player.associateExternalCamera(WebGL.hero.firstPersonCamera);
                WebGL.setCamera(WebGL.hero.firstPersonCamera);
                break;
            case "third_person":
                WebGL.hero.player.associateExternalCamera(WebGL.hero.topCamera);
                WebGL.setCamera(WebGL.hero.topCamera);
                break;
            case "top_down":
                WebGL.hero.player.associateExternalCamera(WebGL.hero.overheadCamera);
                WebGL.setCamera(WebGL.hero.overheadCamera);
                break;
            case "orto_top_down":
                WebGL.hero.player.associateExternalCamera(WebGL.hero.orto_overheadCamera);
                WebGL.setCamera(WebGL.hero.orto_overheadCamera);
                break;
            default:
                throw "WebGL.CONFIG.cameraType error";
        }
    },
    initLevel(level) {
        if (DEBUG.VERBOSE) console.info("init level", level);
        this.newDungeon(level);
        WebGL.MOUSE.initialize("ROOM");
        WebGL.setContext('webgl');
        this.buildWorld(level);
        let start_dir, start_grid;

        if (GAME.fromCheckpoint) {
            start_dir = MAP[level].map[GAME.loadWayPoint].vector;
            start_grid = MAP[level].map[GAME.loadWayPoint].grid.add(start_dir); //3d +2d vector -> 3D
            GAME.fromCheckpoint = false;
        } else {
            start_dir = MAP[level].map.startPosition.vector;
            start_grid = MAP[level].map.startPosition.grid;
        }

        start_grid = new Vector3(start_grid.x + 0.5, start_grid.z + HERO.height, start_grid.y + 0.5);
        HERO.player = new $3D_player(start_grid, Vector3.from_2D_dir(start_dir), MAP[level].map, HERO_TYPE.ThePrincess);
        HERO.player.addToTextureMap("invisible", TEXTURE.TheInvisiblePrincess);
        GAME.setCameraView();
        AI.initialize(HERO.player, "3D3");
        GAME.setWorld(level);
        ENTITY3D.resetTime();
        MINIMAP.init(MAP[level].map, INI.MINIMAP_W, INI.MINIMAP_H, HERO.player);
    },
    setWorld(level, decalsAreSet = false) {
        console.time("setWorld");
        const textureData = {
            wall: TEXTURE[MAP[level].wall],
            floor: TEXTURE[MAP[level].floor],
            ceil: TEXTURE[MAP[level].ceil]
        };

        WebGL.updateShaders();

        if (WebGL.CONFIG.firstperson) {
            WebGL.init('webgl', MAP[level].world, textureData, WebGL.hero.player, decalsAreSet);              //firstperson
        } else {
            WebGL.init('webgl', MAP[level].world, textureData, WebGL.hero.topCamera, decalsAreSet);           //thirdperson
        }
        LAIR.set_timeout(MAP[level].map.spawnDelay);
        console.timeEnd("setWorld");
    },
    buildWorld(level) {
        if (DEBUG.VERBOSE) console.info(" ******** building world, room/dungeon/level:", level, "ressurection", HERO.ressurection, "restart", GAME.restarted);
        WebGL.init_required_IAM(MAP[level].map, HERO);

        if (HERO.ressurection) {
            GAME.reloadIAM(level);
        } else {
            SPAWN_TOOLS.spawn(level);
        }

        HERO.ressurection = false;

        /* adding death places*/
        for (const dp of GAME.deathPlaceDecals) {
            DECAL3D.add(dp);
        }
        GAME.deathPlaceDecals.clear();

        if (GAME.fromCheckpoint) {
            if (DEBUG.VERBOSE) console.log(`%c ... loading part 3: affecting MAP and SPAWN from checkpoint ...`, GAME.CSS);
            SAVE_MAP_IAM.load_map(MAP);
            WebGL.CTX.pixelStorei(WebGL.CTX.UNPACK_FLIP_Y_WEBGL, true);
            MAP_TOOLS.applyStorageActions(level);
            MAP_TOOLS.MAP[GAME.level].unused_storage.clear();
            WebGL.CTX.pixelStorei(WebGL.CTX.UNPACK_FLIP_Y_WEBGL, false);
        }
        MAP[level].world = WORLD.build(MAP[level].map);
    },
    newDungeon(level) {
        MAP_TOOLS.unpack(level);
    },
    prepareForRestart() {
        let clear = ["background", "text", "FPS", "button", "bottomText"];
        ENGINE.clearManylayers(clear);
        TITLE.blackBackgrounds();
        ENGINE.TIMERS.clear();
        GAME.STORE.clearPools();

    },
    async setup() {
        console.log("GAME SETUP started");
        $("#conv").remove();
        //WebGL.GAME.setViewButtons();   //allow different views
        await GAME.initializeImageData();
        const totalPixels = SPRITE.Avatar.width * SPRITE.Avatar.height;
        IMAGE_DATA.INDICES.set(3, "Avatar", totalPixels, IMAGE_DATA.Avatar.data);
    },
    async initializeImageData() {
        await BITMAP.store(SPRITE.Avatar, "Avatar");
        IMAGE_DATA.store(BITMAP.Avatar, "Avatar");
    },
    setTitle() {
        const text = GAME.generateTitleText();
        const RD = new RenderData("FTF", 24, "#0E0", "bottomText");
        const SQ = new RectArea(0, 0, LAYER.bottomText.canvas.width, LAYER.bottomText.canvas.height);
        GAME.movingText = new MovingText(text, 4, RD, SQ);
    },
    generateTitleText() {
        let text = `${PRG.NAME} ${PRG.VERSION
            }, a game by Lovro Selič, ${"\u00A9"} LaughingSkull ${PRG.YEAR
            }. 
             
            Music: 'Fear The Fear' written and performed by LaughingSkull, ${"\u00A9"
            } 2006 Lovro Selič. `;
        text += "     ENGINE, SPEECH, GRID, MAZE, Burrows-Wheeler RLE Compression, WebGL, shaders and GAME code by Lovro Selič using JavaScript and GLSL. ";
        text += "     glMatrix library by Brandon Jones and Colin MacKenzie IV. Thanks. ";
        text = text.split("").join(String.fromCharCode(8202));
        return text;
    },
    runTitle() {
        if (ENGINE.GAME.stopAnimation) return;
        GAME.movingText.process();
        GAME.titleFrameDraw();
        SPEECH.silence();
    },
    titleFrameDraw() {
        GAME.movingText.draw();
    },
    drawFirstFrame(level) {
        if (DEBUG.VERBOSE) console.log("drawing first frame");
        TITLE.firstFrame();
        if (DEBUG._2D_display) {
            ENGINE.resizeBOX("LEVEL", MAP[level].pw, MAP[level].ph);
            ENGINE.BLOCKGRID.configure("pacgrid", "#FFF", "#000");
            ENGINE.BLOCKGRID3D.draw(MAP[GAME.level].map, HERO.player.depth);
            GRID.grid();
            GRID.paintCoord3D("coord", MAP[level].map, HERO.player.depth);
        }
    },
    run(lapsedTime) {
        if (ENGINE.GAME.stopAnimation) return;
        const date = Date.now();
        HERO.player.updateJump(lapsedTime);
        HERO.player.animateAction();
        VANISHING3D.manage(lapsedTime);
        MISSILE3D.manage(lapsedTime);
        EXPLOSION3D.manage(date);
        FIRE3D.manage(date);
        ENTITY3D.manage(lapsedTime, date, [HERO.invisible, HERO.dead]);
        DYNAMIC_ITEM3D.manage(lapsedTime, date);
        ITEM_DROPPER3D.manage(lapsedTime);
        GAME.respond(lapsedTime);
        ENGINE.TIMERS.update();

        const interaction = WebGL.MOUSE.click(HERO);
        if (interaction) GAME.processInteraction(interaction);

        MAP.manage(GAME.level);
        GAME.frameDraw(lapsedTime);
        HERO.concludeAction();
        if (HERO.dead) IAM.checkIfProcessesComplete([EXPLOSION3D], HERO.death);
        if (GAME.completed) GAME.won();
    },
    frameDraw(lapsedTime) {
        if (DEBUG._2D_display) {
            GAME.drawPlayer();
        }
        WebGL.renderScene(MAP[GAME.level].map);
        TITLE.compassNeedle();
        TITLE.time();
        MINIMAP.draw(HERO.radar);

        if (DEBUG.FPS) {
            GAME.FPS(lapsedTime);
        }
        if (DEBUG._2D_display) {
            const map = MAP[GAME.level].map;
            ENGINE.BLOCKGRID3D.draw(map, HERO.player.depth);
            MISSILE3D.draw();
            ENTITY3D.drawVector2D();
            DYNAMIC_ITEM3D.drawVector2D();
            //WebGL.visualizeTexture3DSlice(map.occlusionMap, map.width, map.height, map.depth, 0, LAYER.debug); //debug
            GRID.paintCoord3D("coord", MAP[GAME.level].map, HERO.player.depth);
        }
    },
    processInteraction(interaction) {
        if (DEBUG.VERBOSE) console.info("interaction:", interaction);
        if (interaction.text) TURN.subtitle(interaction.text);
        switch (interaction.category) {
            case 'error':
                switch (interaction.which) {
                    case "inventory_full":
                        if (!HERO.canComplain) break;
                        const variants = [
                            "I can't carry any more.",
                            "My bag is full.",
                            "My bag is breaking at the seams.",
                            "Don't you see my bag is already full, fool?",
                            "Put where? There is no space left.",
                            "You are a greedy bastard, aren't you?",
                            "I'm carrying the castle on my back.",
                            "Bag capacity reached, mission abort.",
                            "No more room for knick-knacks.",
                            "I'm not a pack mule.",
                            "My bag says 'No more, please.'",
                            "I'd need a second bag for that.",
                            "Full to the brim, no more can fit.",
                            "My bag is stuffed like a turkey.",
                            "No vacancy in my bag.",
                            "Trying to turn me into a hoarder?",
                        ];
                        HERO.speak(variants.chooseRandom());
                        HERO.canComplain = false;
                        setTimeout(() => HERO.canComplain = true, INI.COMPLAIN_TIMEOUT);
                        break;
                    default:
                        console.error("Usupported interaction error:", interaction.which);
                }
                break;
            case 'title':
                TITLE[interaction.section]();
                MAP_TOOLS.setOcclusionMap(GAME.level);
                break;
            case 'gold':
                GAME.gold += interaction.value;
                TITLE.gold();
                AUDIO.Pick.play();
                TURN.display(interaction.value, "#AB8D3F");
                break;
            case 'key':
                let key = new Key(interaction.color, interaction.inventorySprite);
                HERO.inventory.key.push(key);
                AUDIO.Keys.play();
                display(interaction.inventorySprite);
                delete MAP[GAME.level].map.keys[interaction.color];
                if (interaction.text) TURN.subtitle(interaction.text);
                break;
            case 'action_item':
                if (DEBUG.VERBOSE) console.warn("action_item", interaction.which, interaction.inventorySprite);
                let aItem = new ActionItem(interaction.which, interaction.inventorySprite);
                HERO.inventory.scroll.add(aItem);
                TITLE.stack.scrollIndex = Math.max(TITLE.stack.scrollIndex, 0);
                TITLE.scrolls();
                display(interaction.inventorySprite);
                break;
            case 'scroll':
                let type = null;
                if (interaction.scrollType) {
                    type = interaction.scrollType;
                } else {
                    type = SCROLL_TYPE[interaction.instanceIdentification];
                }

                let scroll = new Scroll(type);
                display(scroll.inventorySprite);
                HERO.inventory.scroll.add(scroll);
                TITLE.stack.scrollIndex = Math.max(TITLE.stack.scrollIndex, 0);
                TITLE.scrolls();
                AUDIO.Scroll.play();
                break;
            case 'shrine':
                if (interaction.which === 'health' || interaction.which === 'mana') {
                    interaction.category = 'status';
                    return GAME.processInteraction(interaction);
                }
                HERO.raiseStat(interaction.which, interaction.level);
                display(interaction.inventorySprite);
                AUDIO.LevelUp.play();
                HERO.restore();
                TITLE.skills();
                break;
            case 'scrollshop':
                return this.processInteraction({
                    category: "scroll",
                    scrollType: interaction.which,
                });
            case 'oracle':
                break;
            case 'skill':
                if (DEBUG.VERBOSE) console.log("SKILL", interaction);
                HERO.raiseStat(interaction.which, interaction.level);
                display(interaction.inventorySprite);
                AUDIO.LevelUp.play();
                break;
            case "life":
                if (DEBUG.VERBOSE) console.info("LIFE", interaction);
                display(interaction.inventorySprite);
                GAME.lives++;
                TITLE.lives();
                break;
            case 'status':
                if (DEBUG.VERBOSE) console.log("STATUS", interaction);
                HERO.incStatus(interaction.which, interaction.level);
                display(interaction.inventorySprite);
                AUDIO.PowerUp.play();
                break;
            case 'chest':
                AUDIO.OpenChest.play();
                EXPLOSION3D.add(new WoodExplosion(Vector3.from_array(interaction.pos)));
                return this.processInteraction(evalObjectString(CONTAINER_CONTENT_TYPES, interaction.instanceIdentification));
            case "rebuild":
                MAP_TOOLS.rebuild_3D_world(GAME.level);
                AUDIO.Thud.play();
                break;
            case "interaction_item":
                if (DEBUG.VERBOSE) console.warn("interaction_item", interaction);
                const item = new NamedInventoryItem(interaction.name, interaction.inventorySprite);
                HERO.inventory.item.push(item);
                display(interaction.inventorySprite);
                break;
            case "entity_interaction":
                if (DEBUG.VERBOSE) console.log("entity_interaction", interaction);
                break;
            case "munition":
                HERO.pickOrb(interaction.dropped);
                display(interaction.inventorySprite);
                break;
            case "concludeGame":
                GAME.completed = true;
                HERO.player.setPos(Vector3.from_grid3D(new FP_Grid3D(9.5, 2.1, 1.0 + HERO.height)));
                HERO.player.setDir(Vector3.from_2D_dir(UP));
                break;
            default:
                console.error("interaction category error", interaction);
        }
        TITLE.keys();

        function display(inventorySprite) {
            ENGINE.clearLayer("info");
            ENGINE.draw("info", 7, 7, SPRITE[inventorySprite]);
            GenericTimers.infoTimer();
        }
    },
    drawPlayer() {
        ENGINE.clearLayer(ENGINE.VECTOR2D.layerString);
        ENGINE.VECTOR2D.draw(HERO.player);
    },
    help() {
        if (GAME.gold < INI.HELP_PRICE) {
            const texts = [
                "I am too poor to get help.",
                "I need gold to pay for help.",
                "My purse is empty.",
                "The royal purse squeaks when I open it.",
                "My coin pouch echoes, that is how empty it is.",
                "I would buy a hint, but my wallet says plot twist.",
                "I spent my last coin on shoe polish.",
                "The treasury took a nap, the funds did too.",
                "I tried to pay with charm, they wanted coins.",
                "The hint fairy takes gold, not compliments.",
                "All my funds are in another castle.",
                "Wallet status, low battery.",
                "My purse has more lint than loot.",
                "I can offer exposure, does that buy hints.",
                "I am between fortunes.",
                "Even ghosts would not haunt this wallet.",
                "If wisdom were free, I would be brilliant.",
                "My budget is in stealth mode.",
                "The bank said no, the piggy bank said oink, also no.",
                "I brought sass, the shop wants cash.",
                "I would tip for guidance, if I had a tip.",
                "Coins refused to spawn.",
                "Treasury update, 404 coins not found.",
                "I am royalty with a reality budget.",
                "I could sell a tiara, if I had one.",
                "Help costs money, I cost drama.",
                "My savings plan is prayer and patience.",
                "I tried paying in gratitude, the till did not register it.",
                "The purse is a desert, hints are an oasis.",
                "Price is fair, my funds are not.",
                "Guidance sounds lovely, my gold sounds missing.",
                "I brought a purse to a paywall, it arrived empty.",
                "I am rich in problems, poor in coins.",
                "My accountant is a raccoon, it just shrugged.",
                "I would invest in hints, the market says no.",
                "Princess brain needs DLC, wallet says not today."
            ];

            HERO.speak(texts.chooseRandom());
            return;
        }

        GAME.gold -= INI.HELP_PRICE;
        TITLE.gold();

        const W = ENGINE.gameWIDTH * INI.WINDOW_SCALE >>> 0;
        const H = ENGINE.gameHEIGHT * INI.WINDOW_SCALE >>> 0;
        const X = (ENGINE.gameWIDTH - W >>> 1) + ENGINE.sideWIDTH;
        const Y = (ENGINE.gameHEIGHT - H >>> 1) + ENGINE.titleHEIGHT;
        ENGINE.GAME.pause(false);

        const Shrines = {};
        const Entities = {};
        const Items = [];
        const Movables = [];

        //interactive
        const int_decals = INTERACTIVE_DECAL3D.POOL.filter(el => el.interactive);
        if (int_decals.length > 0) {
            for (const ent of int_decals) {
                if (ent.wants) {
                    Entities[ent.name] = ent.wants;
                } else if (ent.interactionCategory === "shrine") {
                    Shrines[ent.name] = `${ent.which.capitalize()} - ${ent.price} gold.`;
                }
            }
        }

        //items
        const remains = ITEM3D.POOL.filter(el => el.active);
        if (remains.length > 0) {
            for (const item of remains) {
                if (item.category === "gold") continue;
                if (item.category === "chest") {
                    const identification = item.instanceIdentification.split(".");
                    if (identification[0] === "GOLD_ITEM_TYPE") continue;
                    Items.push(`Chest: ${identification[1]}`);
                } else if (item.category === "key") {
                    Items.push(`Key: ${item.name}`);
                } else {
                    Items.push(item.name);
                }
            }
        }

        //movable
        const movables = DYNAMIC_ITEM3D.POOL.filter(el => el);
        if (movables.length > 0) {
            for (const mov of movables) {
                Movables.push(mov.name);
            }
        }

        // creating html wedge
        let WEDGE = "";
        if (Object.keys(Entities).length) {
            WEDGE += "<h2>Entities:</h2>";
            for (const [ent, wants] of Object.entries(Entities)) {
                console.log("..ent", ent, wants);
                WEDGE += `<p>${ent} wants: ${wants.join(", ")}.</p>`;
            }
        }

        if (Object.keys(Shrines).length) {
            WEDGE += "<h2>Shrines:</h2>";
            for (const [ent, teach] of Object.entries(Shrines)) {
                WEDGE += `<p>${ent} teaches: ${teach}</p>`;
            }
        }

        if (Items.length) {
            WEDGE += "<h2>Items:</h2>";
            WEDGE += `<p>${Items.join(", ")}.</p>`;
        }

        if (Movables.length) {
            WEDGE += "<h2>Little critters running around:</h2>";
            WEDGE += `<p>${Movables.join(", ")}.</p>`;
        }

        const _form = new Form("Guidance", X, Y, W, H, WEDGE);                      //don't be fooled, this IS used!
    },
    respond(lapsedTime) {
        if (HERO.dead) return;

        HERO.player.respond(lapsedTime);
        WebGL.GAME.respond(lapsedTime);
        ENGINE.GAME.respond(lapsedTime);

        const map = ENGINE.GAME.keymap;

        //debug
        if (map[ENGINE.KEY.map.F7]) {
            if (!DEBUG.keys) return;
        }
        if (map[ENGINE.KEY.map.F8]) {
            if (!DEBUG.keys) return;
            DEBUG.kill();
            ENGINE.GAME.keymap[ENGINE.KEY.map.F8] = false;
        }
        if (map[ENGINE.KEY.map.F9]) {
            console.info(" -------------------- Getting help --------------------");
            GAME.help();
            console.info(" --------------------  ***** --------------------");
            ENGINE.GAME.keymap[ENGINE.KEY.map.F9] = false;

            if (!DEBUG.keys) return;

            console.log("\nDEBUG:");
            console.log("#######################################################");
            ENTITY3D.display();
            ENTITY3D.analyze();
            console.log("------------------------------------------------------");
            console.log("map", MAP[GAME.level].map);
            console.log("MAP", MAP[GAME.level]);
            console.log("HERO", HERO);
            console.info("Inventory:");
            DEBUG.displayInv();
            DEBUG.killStatus();
            DEBUG.displayCompleteness();
            console.log("#######################################################");
        }

        //controls
        if (map[ENGINE.KEY.map.left]) {
            TITLE.stack.scrollIndex--;
            TITLE.stack.scrollIndex = Math.max(0, TITLE.stack.scrollIndex);
            TITLE.scrolls();
            ENGINE.GAME.keymap[ENGINE.KEY.map.left] = false;
            return;
        }
        if (map[ENGINE.KEY.map.right]) {
            TITLE.stack.scrollIndex++;
            TITLE.stack.scrollIndex = Math.min(HERO.inventory.scroll.size() - 1, TITLE.stack.scrollIndex);
            TITLE.scrolls();
            ENGINE.GAME.keymap[ENGINE.KEY.map.right] = false;
            return;
        }
        if (map[ENGINE.KEY.map.enter]) {
            if (HERO.inventory.scroll.size() === 0) return;
            let scroll = HERO.inventory.scroll.remove(TITLE.stack.scrollIndex);
            scroll.action();
            TITLE.scrolls();
            ENGINE.GAME.keymap[ENGINE.KEY.map.enter] = false;
        }
        if (map[ENGINE.KEY.map.ctrl]) {
            HERO.shoot();
            ENGINE.GAME.keymap[ENGINE.KEY.map.ctrl] = false; //NO repeat

        }
        if (map[ENGINE.KEY.map.up]) { }
        if (map[ENGINE.KEY.map.down]) { }
        if (map[ENGINE.KEY.map.space]) {
            HERO.player.attack();
            ENGINE.GAME.keymap[ENGINE.KEY.map.space] = false; //NO repeat
        }
        if (map[ENGINE.KEY.map.shift]) {
            HERO.requestJump();
            ENGINE.GAME.keymap[ENGINE.KEY.map.shift] = false;
        }

        return;
    },
    FPS(lapsedTime) {
        let CTX = LAYER.FPS;
        CTX.fillStyle = "white";
        ENGINE.clearLayer("FPS");
        let fps = 1000 / lapsedTime || 0;
        GAME.fps.update(fps);
        CTX.fillText(GAME.fps.getFps(), 5, 10);
    },
    forceOpenDoor(waypoint) {
        for (const gate of INTERACTIVE_BUMP3D.POOL) {
            if (gate.destination.origin === waypoint) {
                if (gate.locked || gate.color === "Closed") {
                    gate.openGate();
                    gate.storageLog();
                }
                return;
            }
        }
    },
    reloadIAM(level) {
        GAME.STORE.loadIAM(MAP[level].map);
        GAME.STORE.linkMap(MAP[level].map);
        GAME.setWorld(level, true);
    },
    useStaircase(destination) {
        const IAMtoClean = [EXPLOSION3D];                //clean IAM
        for (const iam of IAMtoClean) {
            iam.clean();
        }

        for (const missile of MISSILE3D.POOL) {
            if (missile) {
                if (missile.friendly) missile.drop();
                MISSILE3D.remove(missile.id);
            }
        }

        GAME.STORE.storeIAM(MAP[GAME.level].map);
        GAME.level = destination.level;

        const level = GAME.level;
        if (!MAP[GAME.level].map) {
            GAME.STORE.clearPools();
            GAME.newDungeon(level);
            GAME.buildWorld(level);
            GAME.STORE.linkMap(MAP[level].map);
            GAME.setWorld(level);
        } else GAME.reloadIAM(level);

        MAP_TOOLS.applyStorageActions(level);
        GAME.forceOpenDoor(destination.waypoint);
        HERO.player.setMap(MAP[level].map);

        INTERACTIVE_BUMP3D.setup("3D");

        const start_dir = MAP[level].map[this.destination.waypoint].vector;
        let start_grid = Grid.toClass(MAP[level].map[this.destination.waypoint].grid).add(start_dir);
        let Z = MAP[level].map[this.destination.waypoint].grid.z;
        start_grid = Vector3.from_Grid(Grid.toCenter(start_grid), HERO.height + Z);
        HERO.player.setPos(start_grid);
        HERO.player.setDir(Vector3.from_2D_dir(start_dir));
        GAME.setCameraView();
        MINIMAP.init(MAP[level].map, INI.MINIMAP_W, INI.MINIMAP_H, HERO.player);

        /** SAVE GAME each time */
        GAME.save(destination);

        //observe
        if (MAP_TEXT[GAME.level]) {
            HERO.speak(MAP_TEXT[GAME.level]);
            MAP_TEXT[GAME.level] = null;
        }

        if (DEBUG._2D_display) {
            ENGINE.resizeBOX("LEVEL", MAP[level].pw, MAP[level].ph);
            ENGINE.BLOCKGRID.configure("pacgrid", "#FFF", "#000");
            ENGINE.BLOCKGRID.draw(MAP[GAME.level].map);
            GRID.grid();
            GRID.paintCoord3D("coord", MAP[level].map, HERO.player.depth);
        }
    },
    saveRestriction() {
        if (HERO.orbsLost > 0 || !GAME.canBeSaved) return true;
        return false;
    },
    save(destination) {
        const flag = SG_DICT[MAP[GAME.level].sg];

        switch (flag) {
            case "Block":
                GAME.canBeSaved = false;
                break;
            case "Restore":
                GAME.canBeSaved = true;
                break;
        }

        MAP[GAME.level].sg = 0;
        if (GAME.saveRestriction()) {
            TITLE.saved(false);
            return;
        }

        console.time("save");
        GAME.loadWayPoint = destination.waypoint;
        SAVE_GAME.save();
        SAVE_MAP_IAM.save_map(MAP);
        SAVE_MAP_IAM.save_GA(MAP);
        TURN.display("GAME SAVED", "#FFF");
        TITLE.saved(true);
        console.timeEnd("save");
    },
    load() {
        console.time("load");
        HERO.inventory.scroll.clear();
        HERO.inventory.item.clear();
        SAVE_GAME.load();
        SAVE_MAP_IAM.load_GA();
        MAP_TOOLS.resetStorages();
        console.timeEnd("load");
    },
    checkpoint() {
        GAME.fromCheckpoint = true;
        GAME.start();
    },
    canSpawn() {
        if (MAP[GAME.level].map.stopSpawning) return false;
        if (!LAIR.getSize()) return false;
        if (ENTITY3D.getSize() >= MAP[GAME.level].map.maxSpawned) return false;
        return true;
    },
    spawn(lair) {
        const type = MONSTER_TYPE[MAP[GAME.level].map.monsterList.chooseRandom()];
        if (!type) return;                                                              //if monsterList is not yet definded - development issue
        const grid = Grid3D.toCenter2D(lair.grid.add(lair.direction));
        const monster = new $3D_Entity(grid, type, lair.direction);
        monster.dropped = true;
        ENTITY3D.add(monster);
        EXPLOSION3D.add(new SpawnCloud(monster.moveState.referencePos));
    },
    lifeLostRun(lapsedTime) {
        if (ENGINE.GAME.stopAnimation) return;
        if (ENGINE.GAME.keymap[ENGINE.KEY.map.enter]) {
            ENGINE.GAME.ANIMATION.waitThen(GAME.resurect);
        }
        const date = Date.now();
        //WebGL.GAME.setFirstPerson();
        FIRE3D.manage(date);
        EXPLOSION3D.manage(date);
        ENTITY3D.manage(lapsedTime, date, [HERO.invisible, HERO.dead]);
        GAME.lifeLostFrameDraw(lapsedTime);
    },
    lifeLostFrameDraw(lapsedTime) {
        if (DEBUG._2D_display) {
            GAME.drawPlayer();
        }
        WebGL.renderScene(MAP[GAME.level].map);

        if (DEBUG.FPS) {
            GAME.FPS(lapsedTime);
        }
        if (DEBUG._2D_display) {
            ENGINE.BLOCKGRID.draw(MAP[GAME.level].map);
            MISSILE3D.draw();
            ENTITY3D.drawVector2D();
        }
    },
    resurect() {
        if (DEBUG.VERBOSE) console.info("RESURECT");
        ENGINE.clearLayer("text");
        HERO.revive();
        ENTITY3D.POOL = ENTITY3D.POOL.filter(enemy => enemy && enemy.boss === true); //removes all but bosses, explicit check!
        MISSILE3D.POOL.clear();
        GAME.levelStart();
    },
    gameOverRun(lapsedTime) {
        if (ENGINE.GAME.stopAnimation) return;
        if (ENGINE.GAME.keymap[ENGINE.KEY.map.enter]) {
            ENGINE.GAME.ANIMATION.waitThen(TITLE.startTitle);
        }
        const date = Date.now();
        //WebGL.GAME.setFirstPerson();
        EXPLOSION3D.manage(date);
        ENTITY3D.manage(lapsedTime, date, [HERO.invisible, HERO.dead]);
        GAME.lifeLostFrameDraw(lapsedTime);
    },
    won() {
        console.info("GAME WON");
        ENGINE.TIMERS.stop();
        ENGINE.GAME.ANIMATION.resetTimer();
        TITLE.setEndingCreditsScroll();
        ENGINE.GAME.pauseBlock();
        const layersToClear = ["FPS", "info"];
        layersToClear.forEach(item => ENGINE.layersToClear.add(item));
        ENGINE.clearLayerStack();
        ENGINE.GAME.ANIMATION.stop();
        const delay = 4000;
        setTimeout(function () {
            ENGINE.clearLayer("subtitle");
            TITLE.music();
            ENGINE.GAME.ANIMATION.next(GAME.wonRun);
        }, delay);
    },
    wonRun(lapsedTime) {
        if (ENGINE.GAME.stopAnimation) return;
        GAME.endingCreditText.process(lapsedTime);
        GAME.wonFrameDraw();
        if (ENGINE.GAME.keymap[ENGINE.KEY.map.enter]) {
            ENGINE.GAME.ANIMATION.next(TITLE.startTitle);
        }
    },
    wonFrameDraw() {
        GAME.endingCreditText.draw();
    },
    slideRun(lapsedTime) {
        if (ENGINE.GAME.stopAnimation) return;
        GAME.previously.process(lapsedTime);
        GAME.slideFrameDraw();
        if (ENGINE.GAME.keymap[ENGINE.KEY.map.enter]) GAME.previously.next();

    },
    slideFrameDraw() {
        GAME.previously.verticalText.draw();
    },
};

const TITLE = {
    stack: {
        Y2: 66,
        delta2: 256 + 36,
        delta3: 120,
        delta4: 100,
        DYR: 66,
        deltaItem: 48,
        keyDelta: 56,
        scrollIndex: 0,
        scrollInRow: 3,
        scrollDelta: 72,
        SY: 540, //540
        OY: 415,
        HEALTH_TEXT: 720,
        goldX: 950,
        goldY: 40,
    },
    startTitle() {
        if (DEBUG.VERBOSE) console.log("TITLE started");
        //if (AUDIO.Title) AUDIO.Title.play(); //dev
        ENGINE.GAME.pauseBlock();
        TITLE.clearAllLayers();
        TITLE.blackBackgrounds();
        TITLE.titlePlot();
        ENGINE.draw("background", (ENGINE.gameWIDTH - TEXTURE.Title.width) / 2, (ENGINE.gameHEIGHT - TEXTURE.Title.height) / 2, TEXTURE.Title);
        $("#DOWN")[0].scrollIntoView();
        ENGINE.topCanvas = ENGINE.getCanvasName("ROOM");
        TITLE.drawButtons();
        GAME.setTitle();
        ENGINE.GAME.start(16);
        ENGINE.GAME.ANIMATION.next(GAME.runTitle);
    },
    clearAllLayers() {
        ENGINE.layersToClear = new Set(["text",
            "sideback", "button", "title", "FPS", "keys", "info", "subtitle", "compassRose", "compassNeedle", "health", "lives", "skills", "gold", "time", "orbs", "scrolls", "save",
            "bottomText", "minimap"]);
        ENGINE.clearLayerStack();
        WebGL.transparent();
    },
    blackBackgrounds() {
        this.topBackground();
        this.bottomBackground();
        this.sideBackground();
        ENGINE.fillLayer("background", "#000");
    },
    topBackground() {
        const CTX = LAYER.title;
        CTX.fillStyle = "#000";
        CTX.roundRectLegacy(0, 0, ENGINE.titleWIDTH, ENGINE.titleHEIGHT, { upperLeft: 20, upperRight: 20, lowerLeft: 0, lowerRight: 0 }, true, true);
    },
    bottomBackground() {
        const CTX = LAYER.bottom;
        CTX.fillStyle = "#000";
        CTX.roundRectLegacy(0, 0, ENGINE.bottomWIDTH, ENGINE.bottomHEIGHT, { upperLeft: 0, upperRight: 0, lowerLeft: 20, lowerRight: 20 }, true, true);
    },
    sideBackground() {
        ENGINE.fillLayer("sideback", "#000");
        ENGINE.fillLayer("Lsideback", "#000");
    },
    makeGrad(CTX, x, y, w, h) {
        // Create a linear gradient from (x, y) to (w, h)
        let grad = CTX.createLinearGradient(x, y, w, h);

        grad.addColorStop(0.00, "#C0C0C0"); // silver
        grad.addColorStop(0.03, "#E2E2E2");
        grad.addColorStop(0.07, "#B8B8B8");
        grad.addColorStop(0.10, "#989898");
        grad.addColorStop(0.14, "#777777");
        grad.addColorStop(0.17, "#5F5F5F");
        grad.addColorStop(0.21, "#727272");
        grad.addColorStop(0.24, "#918D78");
        grad.addColorStop(0.28, "#ADA269");
        grad.addColorStop(0.31, "#C2AD58");
        grad.addColorStop(0.34, "#D1B348");
        grad.addColorStop(0.38, "#DDBA36");
        grad.addColorStop(0.41, "#E8C32B");
        grad.addColorStop(0.45, "#F3CF35");
        grad.addColorStop(0.48, "#FFE06A"); // bright gold centre
        grad.addColorStop(0.52, "#FFE06A");
        grad.addColorStop(0.55, "#F3CF35");
        grad.addColorStop(0.59, "#E8C32B");
        grad.addColorStop(0.62, "#DDBA36");
        grad.addColorStop(0.66, "#D1B348");
        grad.addColorStop(0.69, "#C2AD58");
        grad.addColorStop(0.72, "#ADA269");
        grad.addColorStop(0.76, "#918D78");
        grad.addColorStop(0.79, "#727272");
        grad.addColorStop(0.83, "#5F5F5F");
        grad.addColorStop(0.86, "#777777");
        grad.addColorStop(0.90, "#989898");
        grad.addColorStop(0.93, "#B8B8B8");
        grad.addColorStop(0.97, "#E2E2E2");
        grad.addColorStop(1.00, "#C0C0C0"); // silver

        return grad;
    },
    titlePlot() {
        const CTX = LAYER.title;
        const fs = 64;
        CTX.font = fs + "px FTF";
        CTX.textAlign = "center";
        let txt = CTX.measureText(PRG.NAME);
        let x = ENGINE.titleWIDTH / 2;
        let y = fs;
        let gx = x - txt.width / 2;
        let gy = y - fs;
        let grad = this.makeGrad(CTX, gx, gy + 10, gx, gy + fs);
        CTX.fillStyle = grad;
        GAME.grad = grad;
        CTX.shadowColor = "#666666";
        CTX.shadowOffsetX = 2;
        CTX.shadowOffsetY = 2;
        CTX.shadowBlur = 3;
        CTX.fillText(PRG.NAME, x, y);
    },
    drawButtons() {
        ENGINE.clearLayer("button");
        FORM.BUTTON.POOL.clear();
        let x = 8;
        const w = 100;
        const h = 24;
        const F = 1.5;
        let y = 668 - F * h;

        const buttonColors = new ColorInfo("#F00", "#A00", "#222", "#666", 13);
        const musicColors = new ColorInfo("#0E0", "#090", "#222", "#666", 13);
        const checkpointColors = new ColorInfo("#FFF", "#AAA", "#222", "#888", 13);
        const prevColors = new ColorInfo("#00F", "#00D", "#222", "#666", 13);

        let prevBA = new Area(x, y, w, h);
        FORM.BUTTON.POOL.push(new Button("Previously", prevBA, prevColors, TITLE.previously));

        y += F * h;
        let startBA = new Area(x, y, w, h);
        FORM.BUTTON.POOL.push(new Button("Start game", startBA, buttonColors, GAME.start));

        const sg = localStorage.getItem(PRG.SG);
        //const sg = true;
        if (sg) {
            y += F * h;
            let resumeBA = new Area(x, y, w, h);
            FORM.BUTTON.POOL.push(new Button("Resume", resumeBA, checkpointColors, GAME.checkpoint));
        }

        y += F * h;
        let music = new Area(x, y, w, h);
        FORM.BUTTON.POOL.push(new Button("Title music", music, musicColors, TITLE.music));

        FORM.BUTTON.draw();
        $(ENGINE.topCanvas).on("mousemove", { layer: ENGINE.topCanvas }, ENGINE.mouseOver);
        $(ENGINE.topCanvas).on("click", { layer: ENGINE.topCanvas }, ENGINE.mouseClick);
    },
    firstFrame() {
        TITLE.titlePlot();
        TITLE.compass();
        TITLE.sidebackground_static();
        TITLE.health();
        TITLE.lives();
        TITLE.keys();
        TITLE.scrolls();
        //TITLE.magic();
        TITLE.skills();
        TITLE.gold();
    },
    compass() {
        let x = ((ENGINE.titleWIDTH - ENGINE.sideWIDTH) + ENGINE.sideWIDTH / 2) | 0;
        let y = (ENGINE.titleHEIGHT / 2) | 0;
        ENGINE.spriteDraw("compassRose", x, y, SPRITE.CompassRose);
        TITLE.stack.compassX = x;
        TITLE.stack.compassY = y;
        this.compassNeedle();
    },
    compassNeedle() {
        ENGINE.clearLayer("compassNeedle");
        const CTX = LAYER.compassNeedle;
        CTX.strokeStyle = "#F00";
        let [x, y] = [TITLE.stack.compassX, TITLE.stack.compassY];
        CTX.beginPath();
        CTX.moveTo(x, y);
        let end = new Point(x, y).translate(Vector3.to_FP_Vector(HERO.player.dir), (SPRITE.CompassRose.width / 2 * 0.8) | 0);
        CTX.lineTo(end.x, end.y);
        CTX.stroke();
    },
    sidebackground_static() {
        //lines
        let x = ((ENGINE.sideWIDTH - SPRITE.LineTop.width) / 2) | 0;
        let y = 0;
        const dY = (SPRITE.wavyR.height / 2) | 0;
        let cX = ((ENGINE.sideWIDTH) / 2) | 0;
        ENGINE.draw("sideback", x, y, SPRITE.LineTop);
        ENGINE.draw("Lsideback", x, y, SPRITE.LineTop);

        //2
        y = TITLE.stack.Y2;
        y += (SPRITE.Bag.height / 4) | 0;
        const lX = ((ENGINE.sideWIDTH - SPRITE.LineTop.width) / 2) | 0;
        let rX = ENGINE.sideWIDTH - lX - SPRITE.wavyR.width;
        ENGINE.draw("sideback", lX, y, SPRITE.wavyL);
        ENGINE.draw("sideback", rX, y, SPRITE.wavyR);
        ENGINE.spriteDraw("sideback", cX, y + dY, SPRITE.Bag);

        //3
        y += TITLE.stack.delta2;
        ENGINE.draw("sideback", lX, y, SPRITE.wavyL);
        ENGINE.draw("sideback", rX, y, SPRITE.wavyR);

        // 
        ENGINE.spriteDraw("sideback", cX, y + dY, SPRITE.OrnateMagicFlask);

        //4
        y += TITLE.stack.delta3;
        ENGINE.draw("sideback", lX, y, SPRITE.wavyL);
        ENGINE.draw("sideback", rX, y, SPRITE.wavyR);
        ENGINE.spriteDraw("sideback", cX, y + dY, SPRITE.FireBall);
        y += SPRITE.LineTop.height + 8;
        ENGINE.draw("sideback", x, y, SPRITE.SkillFireball);
        rX = (3 * cX / 2 - SPRITE.ManaSkill.width / 2) | 0;
        ENGINE.draw("sideback", rX + 1, y - 5, SPRITE.ManaSkill);

        TITLE.stack.magic = y + 112;

        //5
        y += TITLE.stack.delta4;

        //
        y += SPRITE.LineTop.height + 8;
        ENGINE.draw("sideback", x, y, SPRITE.SkillKick);
        rX = (3 * cX / 2 - SPRITE.SkillShield.width / 2) | 0;
        ENGINE.draw("sideback", rX - 7, y, SPRITE.SkillShield);

        TITLE.stack.skills = y + 120;

        //final line
        y = (ENGINE.gameHEIGHT - SPRITE.LineBottom.height) | 0;
        ENGINE.draw("sideback", x, y, SPRITE.LineBottom);
        ENGINE.draw("Lsideback", x, y, SPRITE.LineBottom);
    },
    skills() {
        ENGINE.clearLayer("skills");
        const CTX = LAYER.skills;
        const x = (ENGINE.sideWIDTH / 4 | 0);
        const dx = 12;

        const fs = 16; //20
        CTX.font = `200 ${fs}px CPU`;
        //CTX.fillStyle = "#DDD";
        CTX.textAlign = "center";
        CTX.shadowColor = "#666";
        CTX.shadowOffsetX = 0;
        CTX.shadowOffsetY = 0;
        CTX.shadowBlur = 0;

        HERO.magic > HERO.reference_magic ? CTX.fillStyle = "#0E0" : CTX.fillStyle = "#DDD";
        CTX.fillText(`${HERO.magic.toString().padStart(2, "0")}`, x + dx, TITLE.stack.magic);
        HERO.attack > HERO.reference_attack ? CTX.fillStyle = "#0E0" : CTX.fillStyle = "#DDD";
        CTX.fillText(`${HERO.attack.toString().padStart(2, "0")}`, x + dx, TITLE.stack.skills);
        HERO.defense > HERO.reference_defense ? CTX.fillStyle = "#0E0" : CTX.fillStyle = "#DDD";
        CTX.fillText(`${HERO.defense.toString().padStart(2, "0")}`, 3 * x, TITLE.stack.skills);
        HERO.manaDiscount < 1.0 ? CTX.fillStyle = "#0E0" : CTX.fillStyle = "#DDD";
        CTX.fillText(`${HERO.mana} / ${HERO.maxMana}`, 3 * x, TITLE.stack.magic);
    },
    time() {
        const fs = 14;
        let y = (SPRITE.LineTop.height + fs * 1.2) | 0;
        let cX = ((ENGINE.sideWIDTH) / 2) | 0;

        const CTX = LAYER.time;
        ENGINE.clearLayer("time");
        CTX.font = fs + "px Consolas";
        CTX.fillStyle = "#0D0";
        CTX.textAlign = "center";
        CTX.shadowColor = "#666";
        CTX.shadowOffsetX = 1;
        CTX.shadowOffsetY = 1;
        CTX.shadowBlur = 1;
        CTX.fillText(`${MAP[GAME.level].name}`, cX, y);
        let time = `Time: ${GAME.time.timeString()}`;
        y += (fs * 1.7) | 0;
        CTX.fillText(time, cX, y);
        y += (fs * 1.0) | 0;
    },
    health() {
        ENGINE.clearLayer("health");
        const cX = ((INI.SCREEN_BORDER) / 2) | 0;
        const cY = (ENGINE.gameHEIGHT / 2) | 0;
        const CTX = LAYER.health;

        ENGINE.spriteDraw("health", cX, 56, SPRITE.Heart);

        if (HERO.health === HERO.maxHealth) {
            ENGINE.spriteDraw("health", cX, cY, SPRITE.Avatar);
        } else {
            HERO.health = Math.min(Math.max(0, HERO.health), HERO.maxHealth);
            const imageData = new ImageData(new Uint8ClampedArray(IMAGE_DATA.Avatar.data), IMAGE_DATA.Avatar.width, IMAGE_DATA.Avatar.height);
            const totalPixels = IMAGE_DATA.INDICES.Avatar.length;
            const transparentPixels = Math.floor(totalPixels * (HERO.maxHealth - HERO.health) / HERO.maxHealth);
            const indices = Array.from(IMAGE_DATA.INDICES.Avatar).shuffle();
            for (let i = 0; i < transparentPixels; i++) {
                imageData.data[indices[i]] = INI.AVATAR_TRANSPARENCY;
            }
            CTX.putImageData(imageData, cX - SPRITE.Avatar.width / 2, cY - SPRITE.Avatar.height / 2);
        }

        const fs = 40;
        CTX.font = `300 ${fs}px CPU`;
        CTX.fillStyle = "#DDD";
        CTX.textAlign = "center";
        CTX.shadowColor = "#666";
        CTX.shadowOffsetX = 1;
        CTX.shadowOffsetY = 1;
        CTX.shadowBlur = 1;
        CTX.fillText(`${HERO.health} / ${HERO.maxHealth}`, cX, TITLE.stack.HEALTH_TEXT);
    },
    lives() {
        ENGINE.clearLayer("lives");
        const cX = 3 * INI.SCREEN_BORDER / 2 - 40;
        const y = ENGINE.titleHEIGHT / 2;
        const spread = ENGINE.spreadAroundCenter(GAME.lives, cX, 32);
        for (let x of spread) {
            ENGINE.spriteDraw("lives", x, y, SPRITE.Lives);
        }
    },
    keys() {
        ENGINE.clearLayer("keys");
        let refY = TITLE.stack.Y2 + TITLE.stack.DYR;
        let list = [...HERO.inventory.key, ...HERO.inventory.status, ...HERO.inventory.item];
        let NUM = list.length;
        NUM = Math.min(4, NUM);
        let spread = ENGINE.spreadAroundCenter(NUM, ENGINE.sideWIDTH / 2, TITLE.stack.keyDelta);
        for (const [i, item] of list.entries()) {
            if (i >= INI.INVENTORY_HARD_LIMIT) break;
            let x = spread[i % NUM];
            let dy = Math.floor(i / NUM);
            let y = refY + (dy * TITLE.stack.deltaItem);
            ENGINE.spriteDraw("keys", x, y, SPRITE[item.spriteClass]);
        }
    },
    scrolls() {
        const INV = HERO.inventory.scroll;
        ENGINE.clearLayer("scrolls");
        const CTX = LAYER.scrolls;

        TITLE.stack.scrollIndex = Math.min(TITLE.stack.scrollIndex, INV.size() - 1);
        let scrollSpread = ENGINE.spreadAroundCenter(TITLE.stack.scrollInRow, ((ENGINE.sideWIDTH / 2) | 0) - 16, TITLE.stack.scrollDelta);

        let LN = INV.size();
        let startIndex = Math.min((TITLE.stack.scrollIndex - TITLE.stack.scrollInRow / 2) | 0, LN - TITLE.stack.scrollInRow);
        startIndex = Math.max(0, startIndex);
        let max = startIndex + Math.min(TITLE.stack.scrollInRow, LN);
        let y = TITLE.stack.OY;
        for (let q = startIndex; q < max; q++) {
            let scroll = INV.list[q];
            let x = scrollSpread.shift();

            if (q === TITLE.stack.scrollIndex) {
                CTX.globalAlpha = 1;
            } else {
                CTX.globalAlpha = 0.75;
            }

            ENGINE.draw("scrolls", x, y, scroll.object.sprite);

            CTX.font = "10px Consolas";
            CTX.fillStyle = "#FFF";
            CTX.fillText(scroll.count.toString().padStart(2, "0"), x + 40, y + 48);

            if (q === TITLE.stack.scrollIndex) {
                CTX.strokeStyle = "#FFF";
                CTX.globalAlpha = 0.5;
                CTX.lineWidth = "1";
                CTX.beginPath();
                CTX.rect(x - 5, y - 10, 48 + 10, 48 + 20);
                CTX.closePath();
                CTX.stroke();
            }
        }
    },
    music() {
        AUDIO.Title.play();
    },
    gold() {
        ENGINE.clearLayer("gold");
        const CTX = LAYER.gold;
        CTX.textAlign = "left";
        CTX.fillStyle = "#BF9B30";
        let fs = 26;
        let y = TITLE.stack.goldY + fs / 2;

        CTX.font = `${fs}px Pentagram`;
        const DX = Math.ceil(CTX.measureText(`GOLD: `).width);
        fs = 30;
        CTX.font = `${fs}px CPU`;
        const DX2 = Math.ceil(CTX.measureText(GAME.gold.toString().padStart(6, "0")).width);
        const x = (ENGINE.gameWIDTH + INI.SCREEN_BORDER) - DX - DX2;
        TITLE.stack.goldX = x;

        fs = 26;
        CTX.font = `${fs}px Pentagram`;
        CTX.fillText(`GOLD: `, TITLE.stack.goldX, y);

        fs = 30;
        CTX.font = `${fs}px CPU`;
        CTX.fillText(GAME.gold.toString().padStart(6, "0"), TITLE.stack.goldX + DX, y);
    },
    saved(ok) {
        ENGINE.clearLayer("save");
        const y = (ENGINE.bottomHEIGHT - 64) / 2;
        const x = 8;
        let sprite = null;
        if (ok) {
            sprite = "SavedOK";
        } else {
            sprite = "SavedFail";
        }

        ENGINE.draw("save", x, y, SPRITE[sprite]);
    },
    setEndingCreditsScroll() {
        console.group("endingCredits");
        const text = this.generateEndingCredits();
        const RD = new RenderData("Pentagram", 30, "#DAA520", "text", "#000", 1, 1, 1);
        GAME.endingCreditText = new VerticalScrollingText(text, 1, RD);
        console.groupEnd("endingCredits");
    },
    generateEndingCredits() {
        const text = `Congratulations!

        You have completed
        Haunting the Hauntessa
        in ${GAME.time.timeString()}.

        Apparitias defeated,
        Hauntessa Spookish
        turned to ash and dust.

        A power vacuum yawns
        in the Hauntosphere.
        Who will seize it?
        Not your problem,
        for now ...

        You live happily ever after
        as the Princess.

        Are your cousins plotting?
        Those bitches.
        You may need to get
        your heels dirty again!
        
        Maybe in the next game ...

        CREDITS:
        Code and direction, Lovro Selic
        Written in JavaScript and GLSL

        jQuery: John Resig et al
        glMatrix: Brandon Jones and
        Colin MacKenzie IV

        Graphics from free sources,
        plus PiskelApp and Blender
        Textures and images by AI:
        Stable Diffusion, Ideogram, 
        Flux.1D, Flux.2D.

        Supplementary tools,
        JavaScript, Python, C++

        Music, 'Graveyard In The Moonlight'
        written and performed by LaughingSkull,
        \u00A9 2006 Lovro Selic

        Thanks for sticking to the end.`;
        return text;
    },
    previously() {
        SPEECH.use("Princess");
        if (AUDIO.Title) {
            AUDIO.Title.pause();
            AUDIO.Title.currentTime = 0;
        }
        $(ENGINE.topCanvas).off("mousemove", ENGINE.mouseOver);
        $(ENGINE.topCanvas).off("click", ENGINE.mouseClick);
        $(ENGINE.topCanvas).css("cursor", "");
        ENGINE.hideMouse();
        ENGINE.GAME.pauseBlock();
        TITLE.clearAllLayers();
        TITLE.blackBackgrounds();
        const RD = new RenderData("FTF", 26, "#DAA520", "text", "#000", 1, 1, 1);
        const layers = { title: "title", sprite: "background" };
        GAME.previously = new SlideShow(INTRO_MOV, TITLE.startTitle, RD, layers);
        GAME.previously.next();
        ENGINE.GAME.ANIMATION.next(GAME.slideRun);
    }
};

// -- main --
$(() => {
    SPEECH.init();
    PRG.INIT();
    PRG.setup();
    ENGINE.LOAD.preload();
    UNIFORM.setup();
    SAVE_GAME.setKey(PRG.SG);
});