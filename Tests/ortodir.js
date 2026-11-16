// -- main --
/**
 * 
 */





$(function () {
    console.clear();
    console.info("*****************************************");
    console.info("*****************************************");

    const vec1 = new Vector3(-0.9238794445991516, 0.00000001, -0.3826834559440613);
    const vec2 = Vector3.getFaceNormal(vec1);

    console.log("vec1", vec1, "vec2", vec2);

    console.info("*****************************************");
});