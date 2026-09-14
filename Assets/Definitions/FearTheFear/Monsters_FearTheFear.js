/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */

"use strict";
console.log("%cMonsters for FearTheFear loaded.", "color: #888");

/* const HERO_TYPE = {

}; */

const HERO_TYPE = {
    ThePrincess: {
        name: "ThePrincess",
        model: "Princess",
        texture: "BluePrincess",
        scale: 1.82 / 2 ** 2,
        rotateToNorth: Math.PI,
        material: MATERIAL.princess,
        moveSpeed: 2.0
    }
};

const MONSTER_TYPE = {

};

const GOLD_ITEM_TYPE = {
    GoldSphere: {
        name: "GoldSphere",
        category: "gold",
        element: "BALL",
        scale: 1.0 / 2 ** 5,
        glueToFloor: true,
        texture: "Gold",
        minVal: 100,
        maxVal: 150,
        value: 150,
        material: MATERIAL.gold,
    },
    GoldBar: {
        name: "GoldBar",
        category: "gold",
        element: "BAR",
        scale: 1 / 2 ** 4,
        glueToFloor: true,
        texture: "Gold",
        minVal: 50,
        maxVal: 100,
        value: 100,
        material: MATERIAL.gold,
    },
    SilverBar: {
        name: "SilverBar",
        category: "gold",
        element: "BAR",
        scale: 1 / 2 ** 4,
        glueToFloor: true,
        texture: "Silver",
        minVal: 25,
        maxVal: 50,
        value: 50,
        material: MATERIAL.silver,
    },
    GoldCube: {
        name: "GoldCube",
        category: "gold",
        element: "CUBE_CENTERED",
        scale: 1 / 2 ** 5,
        glueToFloor: true,
        texture: "Gold",
        minVal: 10,
        maxVal: 25,
        value: 25,
        material: MATERIAL.gold,
    },
    Coins: {
        name: "Coins",
        category: "gold",
        element: "COINS",
        scale: 1.5 / 2 ** 0,
        glueToFloor: true,
        texture: "Coins",
        minVal: 10,
        maxVal: 25,
        value: 10,
        material: MATERIAL.gold,
    },
    RedGem: {
        name: "RedGem",
        category: "gold",
        element: "GEM",
        scale: 1.1 / 2 ** 4,
        glueToFloor: true,
        texture: "Red",
        minVal: 100,
        maxVal: 250,
        value: 250,
        material: MATERIAL.standard,
    },
    GreenGem: {
        name: "GreenGem",
        category: "gold",
        element: "GEM",
        scale: 1.1 / 2 ** 4,
        glueToFloor: true,
        texture: "GreenMetal",
        minVal: 250,
        maxVal: 500,
        value: 500,
        material: MATERIAL.standard,
    },
    BlueGem: {
        name: "BlueGem",
        category: "gold",
        element: "GEM",
        scale: 1.1 / 2 ** 4,
        glueToFloor: true,
        texture: "BlueMetal",
        minVal: 500,
        maxVal: 1000,
        value: 1000,
        material: MATERIAL.standard,
    },
};

const COMMON_ITEM_TYPE = {
    BlueBounceball: {
        name: "BlueBounceball",
        category: 'missile',
        element: "BALL",
        scale: 1.5 / 2 ** 4,
        texture: "BluBallTexture",
        moveSpeed: 8.0,
        bounce3D: true,
        lightColor: "#5e9ae6", //#1155AA
        material: MATERIAL.blueFluence,
        explosionType: BlueExplosion,
        construct: Blue3D_Bouncer,
        collectible: false,
    },
    Bounceball: {
        name: "Bounceball",
        category: 'missile',
        element: "BALL",
        scale: 1.5 / 2 ** 4,
        texture: "GreenMetal",
        moveSpeed: 8.0,
        bounce3D: false,
        lightColor: "#006600",
        material: MATERIAL.greenFluence,
        explosionType: GreenMetalExplosion,
        construct: BouncingMissile,
        collectible: false,
    },
    RedFireball: {
        name: "RedFireball",
        category: 'missile',
        element: "BALL",
        scale: 1.5 / 2 ** 4,
        texture: "RedFireballTexture",
        moveSpeed: 8.0,
        bounce3D: false,
        lightColor: "#CC0000",
        material: MATERIAL.redShine,
        explosionType: ParticleExplosion,
        construct: Missile,
        collectible: false,
    },
    Orb: {
        name: "Orb",
        category: 'missile',
        element: "BALL",
        scale: 1.9 / 2 ** 5,
        texture: "FireballTexture",
        moveSpeed: 8.0,
        bounce3D: false,
        lightColor: "#FF7700",
        material: MATERIAL.fire,
        explosionType: ParticleExplosion,
        construct: BouncingMissile,
        collectible: true,
    },
    Scroll: {
        name: "Scroll",
        category: "scroll",
        element: "SCROLL",
        scale: 1.5 / 2 ** 4,
        glueToFloor: true,
        texture: "ScrollTexture",
        material: MATERIAL.paper,
    },
};

const INTERACTION_OBJECT = {
    //mana
    Orb: {
        name: "Orb-FireBall",
        category: "action_item",
        which: "mana",
        element: "BALL",
        scale: 1.5 / 2 ** 5,
        glueToFloor: true,
        texture: "FireballTexture",
        material: MATERIAL.fire,
        inventorySprite: "FireBall",
        text: "Spent missile. Maybe I can squeeze some magic out."
    },
    Amanita: {
        name: "Amanita",
        category: "action_item",
        which: "mana",
        element: "AMANITA",
        scale: 1.0 / 2 ** 2,
        glueToFloor: true,
        texture: "AmanitaBaseColor",
        material: MATERIAL.standard,
        inventorySprite: "Amanita",
        text: "Poisonous mushroom. I should definitely eat that, right?"
    },
    Snail: {
        name: "Snail",
        category: "action_item",
        which: "mana",
        element: "SNAIL",
        scale: 1.0 / 2 ** 3,
        glueToFloor: true,
        texture: "SnailColor",
        material: MATERIAL.standard,
        inventorySprite: "Snail",
        text: "Slimy snail, full of magic. Nam, nam."
    },
    ManaFrog: {
        name: "ManaFrog",
        category: "action_item",
        which: "mana",
        element: "FROG",
        scale: 1.0 / 2 ** 6,
        glueToFloor: true,
        texture: "FrogColor",
        material: MATERIAL.standard,
        inventorySprite: "ManaFrog",
        text: "Ribbit."
    },
    ManaGoat: {
        name: "ManaGoat",
        category: "action_item",
        which: "mana",
        element: "Goat",
        scale: 1.0 / 2 ** 2,
        glueToFloor: true,
        texture: "Goat_baseColor",
        material: MATERIAL.standard,
        inventorySprite: "ManaGoat",
        text: "Let's sacrifice it for magic."
    },
    Owl: {
        name: "Owl",
        category: "action_item",
        which: "mana",
        element: "OWL",
        scale: 1.0 / 2 ** 2,
        glueToFloor: true,
        texture: "Owl_color",
        material: MATERIAL.standard,
        inventorySprite: "Owl",
        text: "Absorbing owl's wisdom.",
    },


    //health
    Cake: {
        name: "Cake",
        category: "action_item",
        which: "health",
        element: "CAKE",
        scale: 1 / 2 ** 2,
        glueToFloor: true,
        texture: "cake_basecolor",
        material: MATERIAL.standard,
        inventorySprite: "Cake",
        text: "Cake? Very healthy."
    },
    Steak: {
        name: "Steak",
        category: "action_item",
        which: "health",
        element: "STEAK",
        scale: 1.8 / 2 ** 3,
        glueToFloor: true,
        texture: "SteakTexture",
        material: MATERIAL.standard,
        inventorySprite: "Steak",
        text: "Steak? A yummy vegetarian meat."
    },
    BeerHealth: {
        name: "BeerHealth",
        category: "action_item",
        which: "health",
        element: "CAN",
        scale: 1.0 / 2 ** 3,
        glueToFloor: true,
        texture: "CanTexture",
        material: MATERIAL.standard,
        inventorySprite: "BeerHealth",
        text: "Beer always helps me."
    },
    Champagne: {
        name: "Champagne",
        category: "action_item",
        which: "health",
        element: "WINE",
        scale: 1.5 / 2 ** 7,
        glueToFloor: true,
        texture: "WineBottle",
        material: MATERIAL.standard,
        rotateToNorth: 0,
        inventorySprite: "Champagne",
        text: "Expensive champagne. This will improve my spirits."
    },
    HealthBox: {
        name: "HealthBox",
        category: "action_item",
        which: "health",
        element: "FRAGILE_CRATE",
        scale: 1.5 / 2 ** 5,
        glueToFloor: true,
        texture: "HealthBoxtexture",
        material: MATERIAL.standardShine,
        rotateToNorth: 0,
        inventorySprite: "HealthBox",
        text: "A full box of healing. I should save it for dark times."
    },
};
