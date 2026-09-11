/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */

"use strict";

/** textures */
const TEXTURE_LIST = [
    "BalconyTexture_773", "BalconyTexture_774", "BalconyTexture_775", "BalconyTexture_776", "BalconyTexture_777", "BalconyTexture_778", "BalconyTexture_779", "BalconyTexture_780", "BalconyTexture_781", "Beach1", "Beach2", "BigBricks4",
    "BigGreyBricks1", "BigRocks2", "BigStoneWall1", "BigStoneWall2", "BlackBricks45", "BlackReddish1", "BlackWal46", "BlackWall215", "BlackWall40", "BlackWall41", "BlackWall42", "BlackWall43",
    "BlackWall44", "BlackWall45", "BloodMarbleFloorWall_SDXL_001", "BloodMarbleFloorWall_SDXL_002", "BloodMarbleFloorWall_SDXL_003", "BloodMarbleFloorWall_SDXL_004", "BloodMarbleFloorWall_SDXL_005", "BloodMarbleFloorWall_SDXL_006", "BloodMarbleFloorWall_SDXL_007", "BloodMarbleFloorWall_SDXL_008", "BloodMarbleFloorWall_SDXL_009", "BloodMarbleFloorWall_SDXL_010",
    "BloodMarbleFloorWall_SDXL_011", "BloodMarbleFloorWall_SDXL_012", "BloodMarbleFloorWall_SDXL_013", "BloodMarbleFloorWall_SDXL_014", "BloodMarbleFloorWall_SDXL_015", "BloodMarbleFloorWall_SDXL_016", "BloodMarbleFloorWall_SDXL_017", "BloodMarbleFloorWall_SDXL_018", "BloodMarbleFloorWall_SDXL_019", "BloodMarbleFloorWall_SDXL_020", "BloodMarbleFloorWall_SDXL_021", "BloodMarbleFloorWall_SDXL_022",
    "BloodMarbleFloorWall_SDXL_023", "BloodMarbleFloorWall_SDXL_024", "BloodMarbleFloorWall_SDXL_025", "BloodMarbleFloorWall_SDXL_026", "BloodMarbleFloorWall_SDXL_027", "BloodMarbleFloorWall_SDXL_028", "BloodMarbleFloorWall_SDXL_029", "BloodMarbleFloorWall_SDXL_030", "BloodMarbleFloorWall_SDXL_031", "BloodMarbleFloorWall_SDXL_032", "BlueSky_0852", "BlueSky_0853",
    "BlueSky_0854", "BlueSky_0855", "BlurryRedBricks1", "BoulderWall1", "BoulderWall103", "Boulders1", "BrightForest_0845", "BrightForest_0846", "BrightForest_0847", "BrightForest_0848", "BrightForest_0849", "BrightForest_0850",
    "BrightForest_0851", "BrightGlowyWall2", "BrownWall50", "BrownWapp51", "BrownidhMossy102", "BrownishMossy21", "BrownishMossyBricks101", "BrownishTiles101", "Clouds11", "Clouds12", "Cobblestone_0819", "Cobblestone_0820",
    "Cobblestone_0821", "Cobblestone_0822", "Cobblestone_0823", "Cobblestone_0824", "Cobblestone_0825", "Cobblestone_0826", "Cracked01", "Cracked02", "Cracked03", "Cracked04", "Cracked05", "Cracked06",
    "Cracked07", "Cracked08", "Cracked09", "CreepyForest_1150", "CreepyForest_1151", "CreepyForest_1152", "CreepyForest_1153", "CreepyForest_1154", "CreepyForest_1155", "CreepyForest_1156", "CreepyForest_1157", "CreepyForest_1158",
    "CreepyForest_1159", "CreepyForest_1160", "CreepyForest_1161", "CreepyForest_1162", "CreepyForest_1163", "CreepyForest_1164", "CreepyForest_1165", "CreepyForest_1166", "CreepyForest_1167", "CreepyForest_1168", "CreepyForest_1169", "CreepyForest_1170",
    "CreepyForest_1171", "CreepyForest_1172", "DARKBricks107", "DarkBrick113", "DarkBricks101", "DarkBricks102", "DarkBricks108", "DarkBricks110", "DarkBricks111", "DarkBricks112", "DarkBricks114", "DarkBricks1202",
    "DarkFloorSDXL336", "DarkFloorSDXL337", "DarkFloorSDXL338", "DarkFloorSDXL339", "DarkMarble50", "DarkMarble51", "DarkMarble52", "DarkMarble54", "DarkMoss1001", "DarkMossy124", "DarkMossy2", "DarkMossy22",
    "DarkMossy23", "DarkMossy232", "DarkMossy24", "DarkMossy7", "DarkMossy78", "DarkMossy9", "DarkMossyWall101", "DarkRedBricks2", "DarkRedBricks3", "DarkSky01", "DarkSky02", "DarkSky03",
    "DarkSky04", "DarkSky05", "DarkSky06", "DarkSky07", "DarkWAll43234", "DarkWall10001", "DarkWall102", "DarkWallSDXL300", "DarkWallSDXL301", "DarkWallSDXL302", "DarkWallSDXL303", "DarkWallSDXL304",
    "DarkWallSDXL305", "DarkWallSDXL306", "DarkWallSDXL307", "DarkWallSDXL308", "DarkWallSDXL309", "DarkWallSDXL310", "DarkWallSDXL311", "DarkWallSDXL312", "DarkWallSDXL313", "DarkWallSDXL314", "DarkWallSDXL315", "DarkWallSDXL316",
    "DarkWallSDXL317", "DarkWallSDXL318", "DarkWallSDXL319", "DarkWallSDXL320", "DarkWallSDXL321", "DarkWallSDXL322", "DarkWallSDXL323", "DarkWallSDXL324", "DarkWallSDXL325", "DarkWallSDXL326", "DarkWallSDXL327", "DarkWallSDXL328",
    "DarkWallSDXL329", "DarkWallSDXL330", "DarkWallSDXL331", "DarkWallSDXL332", "DarkWallSDXL333", "DarkWallSDXL334", "DarkWallSDXL335", "DatkMossy103", "DetailedFloor1", "DetailedFloor2", "Dirt1", "Dune_0933",
    "Dune_0934", "Dune_0935", "Dune_0936", "Dune_0937", "Dune_0938", "Dune_0939", "Dune_0940", "Dune_0941", "Dune_0942", "Dune_0943", "Dune_0944", "Dune_0945",
    "Dune_0946", "Dune_0947", "Dune_0948", "Dune_0949", "ExteriorCastleWall1", "Farmland_0880", "Farmland_0881", "Farmland_0882", "Farmland_0883", "Farmland_0884", "Farmland_0885", "Farmland_0886",
    "Farmland_0887", "Farmland_0888", "Farmland_0889", "FloorPebbles1", "FloorTiles_SDXL_001", "FloorTiles_SDXL_002", "FloorTiles_SDXL_003", "FloorTiles_SDXL_004", "FloorTiles_SDXL_005", "FloorTiles_SDXL_006", "FloorTiles_SDXL_007", "FloorTiles_SDXL_008",
    "FloorTiles_SDXL_009", "FloorTiles_SDXL_010", "FloorTiles_SDXL_011", "Forest", "Forest101", "Forest102", "Forest103", "Forest104", "Forest105", "Forest106", "Forest107", "Forest108",
    "Forest109", "Forest110", "Forest111", "Forest112", "Forest113", "Forest114", "Forest115", "Forest116", "Forest2", "Forest3", "Forest4", "Forest5",
    "Forest6", "Forest7", "Forest8", "ForestFloor01", "ForestFloor02", "ForestFloor03", "FuturisticTexture_088", "FuturisticTexture_090", "FuturisticTexture_096", "FuturisticTexture_097", "FuturisticTexture_098", "FuturisticTexture_100",
    "FuturisticTexture_110", "FuturisticTexture_114", "FuturisticTexture_116", "FuturisticTexture_118", "FuturisticTexture_119", "GlossyBrownBrickedWall50", "GlossyBrownBrickedWall51", "GlossyBrownBrickedWall52", "GlossyBrownBrickedWall53", "GlossyBrownBrickedWall54", "GlossyBrownBrickedWall55", "GlossyBrownBrickedWall56",
    "GlossyBrownBrickedWall58", "GlossyBrownBrickedWall59", "GlossyBrownBrickedWall60", "GlossyBrownBrickedWall61", "GlossyBrownBrickedWall62", "GlossyBrownBrickedWall63", "GlossyBrownBrickedWall64", "GlossyBrownBrickedWall65", "GlossyBrownBrickedWall66", "GlossyBrownBrickedWall67", "GlossyBrownBrickedWall68", "GlossyBrownBrickedWall69",
    "GlossyBrownBrickedWall70", "GlossyBrownBrickedWall71", "GoldBlackSDXL340", "GoldBlackSDXL341", "GoldBlackSDXL342", "GoldBlackSDXL343", "GoldBlackSDXL344", "GoldBlackSDXL345", "GoldBlackSDXL346", "GoldBlackSDXL347", "GoldBlackSDXL348", "GoldBlackSDXL349",
    "GoldBlackWallwithPillar", "GoldBrownTiles100", "GoldRedTiles100", "GoldWithVines2", "GoldishWall1", "GoldishWall2", "GoldishWall3", "GoldishWall4", "GoldishWall5", "GoldishWall6", "Grass11", "Grass12",
    "Grass13", "Grass14", "Grass15", "Grass16", "Grass17", "Grass40", "GrassMeadow101", "GrassMeadow102", "GrassMeadow103", "Grass_0856", "Grass_0857", "Grass_0858",
    "Grass_0859", "Grass_0860", "Grass_0861", "GrasslandJuggernaut_0927", "GrasslandJuggernaut_0928", "GrasslandJuggernaut_0929", "GrasslandJuggernaut_0930", "GrasslandJuggernaut_0931", "GrasslandJuggernaut_0932", "GrayFloor23", "GreanLeafWall_0862", "GreanLeafWall_0863",
    "GreanLeafWall_0864", "GreanLeafWall_0865", "GreanLeafWall_0866", "GreanLeafWall_0867", "GreanLeafWall_0868", "GreanLeafWall_0869", "GreanLeafWall_0870", "GreanLeafWall_0871", "GreenAndGreyFloor", "GreyBrickWall101", "GreyBricks45", "GreyBrownTiles100",
    "GreyBrownTiles101", "GreyBrownTiles102", "GreyBrownTiles103", "GreyBrownTiles107", "GreyFloor21", "GreyFloor26", "GreyFloor27", "GreyFloor29", "GreyFloorWall30", "GreyRockWall_0872", "GreyRockWall_0873", "GreyRockWall_0874",
    "GreyRockWall_0875", "GreyRockWall_0876", "GreyRockWall_0877", "GreyRockWall_0878", "GreyRockWall_0879", "GreyRocks40", "GreyRocks41", "GreyRocks42", "GreyWall101", "HauntedForest01", "HauntedForest02", "HauntedForest03",
    "HauntedForest04", "HauntedForest05", "HauntedForest06", "HauntedForest07", "HauntedForest08", "HauntedForest09", "HauntedForest10", "HauntedForest11", "HauntedForest12", "HauntedForest13", "HauntedForest14", "HauntedForest15",
    "HauntedForest16", "Hills1", "Hills2", "Hills3", "Hills4", "Hills5", "IceFloor22", "IceFloor24", "IceFloor28", "IceFloor31", "IceFloor32", "IceFloor33",
    "IceFloor37", "IceWall11", "IceWall12", "IceWall13", "IceWall21", "IceWall22", "IceWall23", "IceWall27", "IceWall29", "IrregularTiledFloorCeil01", "IrregularTiledFloorCeil02", "IrregularTiledFloorCeil03",
    "IrregularTiledFloorCeil04", "IrregularTiledFloorCeil05", "IrregularTiledFloorCeil06", "IrregularTiledFloorCeil07", "IrregularTiledFloorCeil08", "IrregularTiledFloorCeil09", "IrregularTiledFloorCeil10", "IrregularTiledFloorCeil11", "IrregularTiledFloorCeil12", "IrregularTiledFloorCeil13", "IrregularTiledFloorCeil14", "IrregularTiledFloorCeil15",
    "IvyBricks101", "IvyBricks102", "IvyWall1", "IvyWall2", "IvyWall3", "IvyWall4", "IvyWall_517", "IvyWall_518", "IvyWall_519", "IvyWall_520", "IvyWall_521", "IvyWall_522",
    "IvyWall_523", "IvyWall_524", "IvyWall_525", "JuggernautDarkwalls_0890", "JuggernautDarkwalls_0891", "JuggernautDarkwalls_0892", "JuggernautDarkwalls_0893", "JuggernautDarkwalls_0894", "JuggernautDarkwalls_0895", "JuggernautDarkwalls_0896", "JuggernautDarkwalls_0897", "JuggernautDarkwalls_0898",
    "JuggernautDarkwalls_0899", "JuggernautDarkwalls_0900", "JuggernautDarkwalls_0901", "JuggernautDarkwalls_0902", "JuggernautDarkwalls_0903", "JuggernautDarkwalls_0904", "JuggernautDarkwalls_0905", "JuggernautDarkwalls_0906", "JuggernautDarkwalls_0907", "JuggernautDarkwalls_0908", "JuggernautDarkwalls_0909", "JuggernautDarkwalls_0910",
    "JuggernautDarkwalls_0911", "JuggernautDarkwalls_0912", "JuggernautDarkwalls_0913", "JuggernautDarkwalls_0914", "JuggernautDarkwalls_0915", "JuggernautDarkwalls_0916", "JuggernautDarkwalls_0917", "JuggernautDarkwalls_0918", "JuggernautDarkwalls_0919", "JuggernautDarkwalls_0920", "JuggernautDarkwalls_0921", "JuggernautDarkwalls_0922",
    "JuggernautDarkwalls_0923", "JuggernautDarkwalls_0924", "JuggernautDarkwalls_0925", "JuggernautDarkwalls_0926", "LargeBlackBricks2", "LargeRocks1", "LightWallSDXL300", "LightWallSDXL301", "LightWallSDXL302", "LightWallSDXL303", "LightWallSDXL304", "LightWallSDXL305",
    "LightWallSDXL306", "LightWallSDXL307", "LightWallSDXL308", "LightWallSDXL309", "LightWallSDXL310", "LightWallSDXL311", "LightWallSDXL312", "LightWallSDXL313", "LightWallSDXL314", "LightWallSDXL315", "LightWallSDXL316", "MArbleWall101",
    "MarbleFloor1001", "MarbleFloor1002", "MarbleFloor1003", "MarbleFloor1004", "MarbleFloor1005", "MarbleFloor101", "MarbleFloor102", "MarbleFloor103", "MarbleFloor104", "MarbleFloor105", "MarbleTiles1001", "MarbleWall1",
    "MetalBrick", "MistyMeadow1", "MistyMeadow2", "MistyMeadow3", "MistyMeadow4", "MossFloor100", "MossFloor101", "MossFloor102", "MossFloor103", "MossFloor104", "MossFloor105", "MossFloor106",
    "MossyFloor107", "MossyFloor108", "MossyFloor109", "MossyFloor110", "MossyFloor111", "MossyFloor112", "MossyFloor211", "MossyFloor212", "MossyFloor401", "MossyPattern1", "MossyPattern2", "MossyRocks40",
    "MossyRocks41", "MossyRocks42", "MossyTiles101", "MossyTiles666", "MossyWall105", "MossyWall110", "MossyWall111", "MossyWall112", "MountainWall_100", "MountainWall_101", "MountainWall_102", "MountainWall_103",
    "MountainWall_104", "MountainWall_105", "MountainWall_106", "MountainWall_107", "MountainWall_108", "MountainWall_109", "MountainWall_110", "MountainWall_111", "MountainWall_112", "MountainWall_113", "MountainWall_114", "MountainWall_115",
    "MountainWall_116", "MountainWall_117", "MountainWall_118", "MountainWall_119", "MountainWall_120", "MountainWall_121", "MountainWall_122", "MountainWall_123", "MountainWall_124", "MountainWall_125", "MountainWall_126", "MountainWall_127",
    "MountainWall_128", "MountainWall_129", "MountainWall_130", "MountainWall_131", "MountainWall_132", "MountainWall_133", "MountainWall_134", "MountainWall_135", "MountainWall_136", "MountainWall_137", "MountainWall_138", "MountainWall_139",
    "MountainWall_140", "MountainWall_141", "MountainWall_142", "MountainWall_143", "MountainWall_144", "MountainWall_145", "MountainWall_146", "MountainWall_147", "MountainWall_148", "MountainWall_149", "MountainWall_150", "MountainWall_151",
    "MountainWall_152", "Mountains1", "Mountains2", "Mountains3", "Mountains4", "NightSky1", "NightSky2", "NightSky3", "Nook1", "OrnateFloor100", "OrnateFloor101", "OrnateFloor102",
    "OrnateFloor104", "OrnateFloor105", "OrnateFloor106", "OrnateFloor107", "OrnateFloor108", "OrnateFloor109", "OrnateWall2", "OuterCastleWall_0827", "OuterCastleWall_0828", "OuterCastleWall_0829", "OuterCastleWall_0830", "OuterCastleWall_0831",
    "OuterCastleWall_0832", "OuterCastleWall_0833", "OuterCastleWall_0834", "OuterCastleWall_0835", "OuterCastleWall_0836", "OuterCastleWall_0837", "OuterCastleWall_0838", "OuterCastleWall_0839", "OuterCastleWall_0840", "OuterCastleWall_0841", "OuterCastleWall_0842", "OuterCastleWall_0843",
    "OuterCastleWall_0844", "Overcast1", "Overcast2", "PebbleWall1", "PebbleWall2", "PebbleWall3", "PlainRockWall", "PrnateFloor107", "RedAndGreyBricks1", "RedBricks100", "RedBricks101", "RedBricks40",
    "RedBricks41", "RedBricks42", "RedBricks43", "RedBricks44", "RedBricks45", "RedMArbleFLoor10", "RedMArbleFloor12", "RedMArbleFloor2", "RedMArbleFloor3", "RedMArbleFloor5", "RedMArbleFloor9", "RedMarbleFloor1",
    "RedMarbleFloor13", "RedMarbleFloor4", "RedMarbleFloor7", "RedMarbleFloor8", "RedRockMossy3", "RedishBricks101", "RedishRocks11", "RedishRockyWall1", "RedishVinesWall1", "Relief01", "Relief02", "Relief03",
    "Relief04", "Relief05", "Relief06", "Relief07", "Relief08", "Relief09", "Relief10", "Relief11", "Relief12", "Relief13", "Relief14", "Relief15",
    "Relief16", "Relief17", "Relief18", "Relief19", "Relief20", "Relief21", "Relief22", "Relief23", "Relief24", "RockAndWoodWall1", "RockWAll202", "RockWall201",
    "RockWall40", "RockWall441", "RockWall442", "RockWall_SDXL_001", "RockWall_SDXL_002", "RockWall_SDXL_003", "RockWall_SDXL_004", "RockWall_SDXL_005", "RockWall_SDXL_006", "RockWall_SDXL_007", "RockWall_SDXL_008", "RockWall_SDXL_009",
    "RockWall_SDXL_010", "RockWall_SDXL_011", "RockWall_SDXL_012", "RockWall_SDXL_013", "RockWall_SDXL_014", "RockWall_SDXL_015", "RockWall_SDXL_016", "RockWall_SDXL_017", "RockWall_SDXL_018", "RockWall_SDXL_019", "RockWall_SDXL_020", "RockWall_SDXL_021",
    "RoughCave01", "RoughCave02", "RoughCave03", "RoughCave04", "RoughCave05", "RoughCave06", "RoughCave07", "RoughCave08", "RoughCave09", "RoughCave10", "RoughCave11", "RoughCave12",
    "RoughCave13", "RoughCave14", "RoughCave15", "RoughCave16", "RoughCave17", "RoughCave18", "RoughCave19", "RoughCave20", "RoughCave21", "RoughCave22", "RoughCave23", "RoughCeiling1",
    "SKullWall2", "Sand1", "Sand10", "Sand11", "Sand12", "Sand13", "Sand14", "Sand15", "Sand16", "Sand2", "Sand3", "Sand4",
    "Sand5", "Sand6", "Sand7", "Sand8", "Sand9", "SeaWater1", "SeaWater2", "SeaWaterWall", "ShinyCeiling", "ShinyGreyBricks100", "SkullWall1", "SkullWall5",
    "SkullWall7", "SkullWall8", "SmallBlackBricks40", "SmallBlackBricks41", "SmallBlackBricks43", "SmallBlackBricks44", "SmallBlackBricks45", "SmallBlackBricks46", "SmallBlackBricks47", "SmallBlackBricks48", "SmallRocks", "SpiderWall13",
    "SpiderWeb10", "SpiderWeb12", "SpiderWeb15", "SpiderWeb22", "SpiderWeb31", "SpiderWeb334", "SpiderWeb6", "StoneWall40", "StoneWall41", "StrangeGoldy1", "StrangeWall3", "VaultedCeiling1",
    "Water11", "Water12", "Water30", "Water31", "Water32", "WebbedFloor1", "WebbedFloor2", "WebbedFloor4", "WebbedFloor5", "WebbedFloor9", "WetBlackWall35", "WetBlackWall36",
    "WhiteWall24", "WhiteWall25", "WhiteWall26", "WhiteWall28", "Wood1", "Wood10", "Wood11", "Wood12", "Wood13", "Wood21", "Wood3", "Wood4",
    "Wood5", "Wood6", "Wood7", "Wood8", "Wood9", "marbleFloor106"
].sort();

/** Decals */
const DECAL_PAINTINGS = [

].sort();

/** Crests */

const DECAL_CRESTS = [].sort();

//lights
const LIGHT_DECALS = [

].sort();

//panorama
const PANORAMA_DECALS = [

].sort();

//arch
const ARCH_DECALS = [

].sort();;

//sky
const SKY_DECALS = [

].sort();


const TRIGGER_DECALS = [];
const LAIR_DECALS = [].sort();

const CONTAINER_LIST = [];
if (typeof CONTAINER_ITEM_TYPE !== "undefined") {

    for (const container in CONTAINER_ITEM_TYPE) {
        CONTAINER_LIST.push(container);
    }
}
console.log("%cMAP for MapEditor loaded.", "color: #888");