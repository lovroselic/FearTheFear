/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */
/*jshint esversion: 11 */
"use strict";

const DungeonCrawlerClasses = {
    VERSION: "1.00",
    VERBOSE: false,
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


/** *********************************************** */
console.log(`%cDungeonCrawlerClasses ${DungeonCrawlerClasses.VERSION} ready.`, "color: #7beec8");