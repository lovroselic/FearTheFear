/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */

"use strict";
console.clear();

const LIB = {
    VERSION: "6.01",
    CSS: "color: #EFE",
    log: function () {
        console.log(`%cPrototype LIB ${LIB.VERSION} loaded`, LIB.CSS);
    }
};

/*
Prototype and helpful functions library
as used by LS;
yes, I am aware this is a bad practice, but it feels sooooo good;

changelog:
6.00: collision-safe, non-enumerable extensions
    : safe globals, safe prototypes
    : class JSDoc
*/

{
    /**
     * Adds a property without overwriting an existing own or inherited property.
     * Extensions are non-enumerable so they behave like native methods.
     *
     * @param {object|Function} target - Object that receives the extension.
     * @param {string} targetName - Human-readable target name used in errors.
     * @param {string} propertyName - Property to install.
     * @param {*} value - Property value to install.
     * @throws {TypeError} If the target is not an object or function.
     * @throws {Error} If the property already exists on the target or its prototype chain.
     */
    function defineExtension(target, targetName, propertyName, value) {
        const validTarget = target !== null && (typeof target === "object" || typeof target === "function");

        if (!validTarget) throw new TypeError(`Cannot extend ${targetName}: invalid target.`);
        if (Reflect.has(target, propertyName)) throw new Error(`Prototype LIB collision: ${targetName}.${propertyName} already exists.`);

        Object.defineProperty(target, propertyName, { value, writable: true, configurable: true, enumerable: false });
    }

    /**
     * Publishes a classic-script global without silently replacing an existing name.
     *
     * @param {string} name - Global property name.
     * @param {*} value - Value exposed through {@link globalThis}.
     * @throws {Error} If the global name already exists.
     */
    function defineGlobal(name, value) {
        defineExtension(globalThis, "globalThis", name, value);
    }

    (function () {

        /**
         * global functions
         */

        function RND(start, end) {
            return Math.floor(Math.random() * (++end - start) + start);
        }
        function RNDF(start, end, p = 2) {
            return Math.floor(Math.random() * (end + 10 ** -p - start) * 10 ** p + start * 10 ** p) / 100;
        }
        function RandomFloat(start, end) {
            return Math.random() * (end - start) + start;
        }
        function coinFlip() {
            return RND(0, 1) === 1;
        }
        function randomSign() {
            return coinFlip() ? 1 : -1;
        }
        function probable(x) {
            return RND(0, 100) <= x;
        }
        function roundN(x, N) {
            return Math.round(x / N) * N;
        }
        function round10(x) {
            return roundN(x, 10);
        }
        function round5(x) {
            return roundN(x, 5);
        }
        function weightedRnd(weights) {
            const totalWeight = Object.values(weights).sum();
            let sum = 0;
            const rand = Math.random() * totalWeight;
            for (const key in weights) {
                sum += weights[key];
                if (rand < sum) return key;
            }
            return null;
        }
        function colorStringToVector(str) {
            if (!/^#[0-9A-Fa-f]{6}$/.test(str)) throw new Error(`Invalid color string: ${str}`);
            let vec = new Float32Array(3);
            vec[0] = parseInt(str.substring(1, 3), 16) / 255;
            vec[1] = parseInt(str.substring(3, 5), 16) / 255;
            vec[2] = parseInt(str.substring(5, 7), 16) / 255;
            return vec;
        }
        function colorVectorToHex(vector) {
            if (vector.length !== 3) throw new Error(`Invalid length of color vector: ${vector.length}`);
            let hexStr = "#";
            for (let dim in vector) {
                let int = Math.round(Math.max(0, Math.min(vector[dim], 1)) * 255);
                let hex = int.toString(16).toUpperCase().padStart(2, '0');
                hexStr += hex;
            }
            return hexStr;
        }
        function colorVectorToRGB_Vector(vector) {
            const rgb = new Uint8Array(3);
            for (let dim in vector) {
                let int = Math.round(Math.max(0, Math.min(vector[dim], 1)) * 255);
                rgb[dim] = int;
            }
            return rgb;
        }
        function RGB_vectorToRGB_string(rgb) {
            if (rgb.length !== 3) throw new Error(`Invalid length of rgb vector: ${rbg.length}`);
            return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        }
        function colorVectorToRGB_String(vector) {
            return RGB_vectorToRGB_string(colorVectorToRGB_Vector(vector));
        }
        function binarySearch(arr, target) {
            let low = 0, high = arr.length;
            while (low < high) {
                let mid = (low + high) >>> 1;
                if (arr[mid] < target) {
                    low = mid + 1;
                } else {
                    high = mid;
                }
            }
            return low;
        }
        function binarySearchClosestLowFloat(arr, target, delta) {
            let low = 0;
            let high = arr.length;
            while (low < high) {
                let mid = (low + high) >>> 1;
                if (arr[mid] > target - delta) {
                    high = mid;
                } else {
                    low = mid + 1;
                }
            }
            return low;
        }
        function listObjectKeys(obj) {
            const list = [];
            for (const key in obj) {
                list.push(key);
            }
            return list;
        }
        function stringifyObjectList(selection) {
            const list = [];
            for (const name in selection) {
                const obj = selection[name];
                for (const key in obj) {
                    list.push(`${name}.${key}`);
                }
            }
            return list;
        }
        function evalObjectString(root, path) {
            let obj = root;
            const parts = path.split(".");
            for (const part of parts) {
                if (obj && Object.hasOwnProperty.call(obj, part)) {
                    obj = obj[part];
                } else {
                    return undefined;
                }
            }
            return obj;
        }
        function factorial(n) {
            let r = 1;
            while (n > 0) r *= n--;
            return r;
        }

        /**
         * A utility function to enable multiple inheritance in JavaScript. - MIXINs
         * It takes an array of base classes and merges their properties and methods into a single class.
         *
         * @param {Function[]} bases - An array of constructor functions (classes) to inherit from.
         * @returns {Function} A dynamically created class that extends all provided base classes.
         *
         * class Gross extends Classes([Nose,Ear]) {
          constructor() {
            super();
            this.gross = true;
          }
        }
        */
        function Classes(bases) {
            class Bases {
                constructor(...args) {
                    bases.forEach(base => {
                        const instance = new base(...args);
                        Object.assign(this, instance);
                    });
                }
            }

            bases.forEach(base => {
                Object.getOwnPropertyNames(base.prototype)
                    .filter(prop => prop !== "constructor")
                    .forEach(prop => {
                        if (Object.hasOwn(Bases.prototype, prop)) throw new Error(`Classes collision: ${base.name}.prototype.${prop} already exists on the combined prototype.`);
                        Object.defineProperty(Bases.prototype, prop, Object.getOwnPropertyDescriptor(base.prototype, prop));
                    });
            });

            return Bases;
        }

        /**
        * Calculates the smallest power of two greater than or equal to the given value.
        *
        * This function is useful for scenarios where alignment to powers of two is required,
        * such as memory allocation, binary operations, or certain algorithms.
        *
        * @param {number} value - A positive numerical value for which the next power of two is calculated.
        * @returns {number} The smallest power of two greater than or equal to the input value.
        * 
        * @throws {TypeError} If the input value is not a number.
        * @throws {RangeError} If the input value is less than or equal to zero.
        *
        */
        function POT(value) {
            if (typeof value !== 'number') throw new TypeError('Input value must be a number.');
            if (value <= 0) throw new RangeError('Input value must be greater than zero.');
            return Math.pow(2, Math.ceil(Math.log2(value)));
        }

        defineGlobal("RND", RND);
        defineGlobal("RNDF", RNDF);
        defineGlobal("RandomFloat", RandomFloat);
        defineGlobal("coinFlip", coinFlip);
        defineGlobal("probable", probable);
        defineGlobal("roundN", roundN);
        defineGlobal("round10", round10);
        defineGlobal("round5", round5);
        defineGlobal("randomSign", randomSign);
        defineGlobal("weightedRnd", weightedRnd);
        defineGlobal("colorStringToVector", colorStringToVector);
        defineGlobal("colorVectorToHex", colorVectorToHex);
        defineGlobal("binarySearch", binarySearch);
        defineGlobal("binarySearchClosestLowFloat", binarySearchClosestLowFloat);
        defineGlobal("colorVectorToRGB_Vector", colorVectorToRGB_Vector);
        defineGlobal("RGB_vectorToRGB_string", RGB_vectorToRGB_string);
        defineGlobal("colorVectorToRGB_String", colorVectorToRGB_String);
        defineGlobal("listObjectKeys", listObjectKeys);
        defineGlobal("stringifyObjectList", stringifyObjectList);
        defineGlobal("evalObjectString", evalObjectString);
        defineGlobal("POT", POT);
        defineGlobal("factorial", factorial);
        defineGlobal("Classes", Classes);
    })();

    /** console prototypes */

    defineExtension(console, "console", "proto", function proto(
        text,
        color = "FFFFFF",
        fontWeight = "normal",
        fontSize = "inherit"
    ) {
        color = String(color).replace(/^#/, "");

        console.log(
            `%c${text}`,
            `color: #${color}; font-weight: ${fontWeight}; font-size: ${fontSize};`
        );
    }
    );

    defineExtension(console, "console", "title", function title(text) {
        console.proto(text, "#EEE", "bold", "18px");
    });
    defineExtension(console, "console", "chapter", function chapter(text) {
        console.proto(text, "#AAA", "bold", "15px");
    });
    defineExtension(console, "console", "ready", function ready(text) {
        console.proto(`\n${text}\n\n`, "#38e538", "bold", "14px");
    });
    defineExtension(console, "console", "red", function red(text) {
        console.proto(text, "#f50808", "bold");
    });
    defineExtension(console, "console", "ok", function ok(text) {
        console.proto(text, "#04ce3a", "bold");
    });
    defineExtension(console, "console", "note", function note(text) {
        console.proto(text, "#ffffff", "italic");
    });
    defineExtension(console, "console", "star", function star(color) {
        console.proto("**************************************************************************************************************************************", color);
    });
    defineExtension(console, "console", "line", function line(color) {
        console.proto("--------------------------------------------------------------------------------------------------------------------------------------", color);
    });

    /** 
     * Date prototypes 
     * 
     */
    defineExtension(Date.prototype, "Date.prototype", "addDays", function addDays(days) {
        this.setDate(this.getDate() + days);
    });
    defineExtension(Date.prototype, "Date.prototype", "addMonths", function addMonths(months) {
        this.setMonth(this.getMonth() + months);
    });
    defineExtension(Date.prototype, "Date.prototype", "addYears", function addYears(years) {
        this.setFullYear(this.getFullYear() + years);
    });
    defineExtension(Date.prototype, "Date.prototype", "stringify", function stringify() {
        const d = String(this.getDate()).padStart(2, '0');
        const m = String(this.getMonth() + 1).padStart(2, '0');
        const y = this.getFullYear();
        return `${d}/${m}/${y}`;
    });
    defineExtension(Date.prototype, "Date.prototype", "ISO", function ISO() {
        return this.toISOString().replace('T', ' ').split('.')[0];
    });

    /** 
     * Math 
     */

    /**
     * Converts an angle from degrees to radians.
     *
     * @param {number} degrees - The angle in degrees.
     * @returns {number} - The angle in radians.
     */
    defineExtension(Math, "Math", "radians", function radians(degrees) {
        if (typeof degrees !== 'number') throw new Error(`The argument should be a number: ${degrees}`);
        return (degrees * Math.PI) / 180;
    });

    /**
     * Converts an angle from radians to degrees.
     *
     * @param {number} radians - The angle in radians.
     * @returns {number} - The angle in degrees.
     */
    defineExtension(Math, "Math", "degrees", function degrees(radians) {
        if (typeof radians !== 'number') throw new Error(`The argument should be a number: ${radians}`);
        return (radians * 180) / Math.PI;
    });

    /**
     * Rounds a floating-point number to the specified precision.
     * Uses the Number.EPSILON to handle floating-point errors.
     *
     * @param {number} num - The number to be rounded.
     * @param {number} decimalPlaces - The number of decimal places to round to.
     * @returns {number} - The rounded number.
     */
    defineExtension(Math, "Math", "roundFloat", function roundFloat(num, decimalPlaces) {
        if (typeof num !== 'number' || typeof decimalPlaces !== 'number') {
            throw new Error('Both arguments should be numbers.');
        }

        const factor = 10 ** decimalPlaces;
        const epsilonCorrectedValue = num * factor * (1 + Number.EPSILON);

        return Math.round(epsilonCorrectedValue) / factor;
    });

    defineExtension(Math, "Math", "frac", function frac(num) {
        return num - Math.trunc(num);
    });

    defineExtension(Math, "Math", "clamp", function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    });

    defineExtension(Math, "Math", "lerp", function lerp(a, b, t) {
        return a * (1 - t) + b * t;
    });

    defineExtension(CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D.prototype", "pixelAt", function pixelAt(x, y, size = 1) {
        this.fillRect(x, y, size, size);
    });
    defineExtension(CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D.prototype", "pixelAtPoint", function pixelAtPoint(point, size = 1) {
        this.fillRect(point.x, point.y, size, size);
    });
    defineExtension(CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D.prototype", "roundRectLegacy", function roundRectLegacy(x, y, width, height, radius, fill = false, stroke = true) {
        let cornerRadius = { upperLeft: 0, upperRight: 0, lowerLeft: 0, lowerRight: 0 };

        if (typeof radius === "object") Object.assign(cornerRadius, radius);

        this.beginPath();
        this.moveTo(x + cornerRadius.upperLeft, y);
        this.lineTo(x + width - cornerRadius.upperRight, y);
        this.quadraticCurveTo(x + width, y, x + width, y + cornerRadius.upperRight);
        this.lineTo(x + width, y + height - cornerRadius.lowerRight);
        this.quadraticCurveTo(x + width, y + height, x + width - cornerRadius.lowerRight, y + height);
        this.lineTo(x + cornerRadius.lowerLeft, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - cornerRadius.lowerLeft);
        this.lineTo(x, y + cornerRadius.upperLeft);
        this.quadraticCurveTo(x, y, x + cornerRadius.upperLeft, y);
        this.closePath();
        if (stroke) this.stroke();
        if (fill) this.fill();
    });

    defineExtension(CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D.prototype", "drawLine", function drawLine(fromX, fromY, toX, toY) {
        this.beginPath();
        this.moveTo(fromX, fromY);
        this.lineTo(toX, toY);
        this.stroke();
    });

    defineExtension(CanvasRenderingContext2D.prototype, "CanvasRenderingContext2D.prototype", "linePath", function linePath(fromX, fromY, toX, toY) {
        this.moveTo(fromX, fromY);
        this.lineTo(toX, toY);
        return this;
    });

    /**
    * collection of Array prototypes LS 
    */
    defineExtension(Array, "Array", "create2DArray", function create2DArray(rows, columns, initialValue = 0) {
        return new Array(rows).fill().map(() => new Array(columns).fill(initialValue));
    });

    defineExtension(Array.prototype, "Array.prototype", "clear", function clear() {
        this.length = 0;
    });

    defineExtension(Array.prototype, "Array.prototype", "swap", function swap(x, y) {
        [this[x], this[y]] = [this[y], this[x]];
    });

    defineExtension(Array.prototype, "Array.prototype", "shuffle", function shuffle() {
        var i = this.length,
            j;
        while (--i > 0) {
            j = RND(0, i);
            this.swap(i, j);
        }
        return this;
    });

    defineExtension(Array.prototype, "Array.prototype", "sum", function sum() {
        return this.reduce((a, b) => a + b, 0);
    });

    defineExtension(Array.prototype, "Array.prototype", "average", function average() {
        return this.reduce((a, b) => a + b) / this.length;
    });

    defineExtension(Array.prototype, "Array.prototype", "createPool", function createPool(mx, N) {
        if (!this) return false;
        this.length = 0;
        let tempArray = Array.from({ length: mx }, (_, i) => i);
        for (let i = 0; i < N; i++) {
            let top = tempArray.length;
            let addx = RND(0, top - 1);
            this.push(tempArray[addx]);
            tempArray[addx] = tempArray[top - 1];
            tempArray.length--;
        }
        return this;
    });

    defineExtension(Array.prototype, "Array.prototype", "compare", function compare(array) {
        if (!array) return false;
        var LN = this.length;
        if (LN !== array.length) return false;
        for (var x = 0; x < LN; x++) {
            if (this[x] !== array[x]) return false;
        }
        return true;
    });

    defineExtension(Array.prototype, "Array.prototype", "removeIfInArray", function removeIfInArray(arr) {
        //remove if value
        const valueSet = new Set(arr);
        for (let x = this.length - 1; x >= 0; x--) {
            if (valueSet.has(this[x])) {
                this.splice(x, 1);
            }
        }
    });

    defineExtension(Array.prototype, "Array.prototype", "removeIfIndexInArray", function removeIfIndexInArray(arr) {
        //remove if index
        const indexSet = new Set(arr);
        for (let x = this.length - 1; x >= 0; x--) {
            if (indexSet.has(x)) {
                this.splice(x, 1);
            }
        }
    });

    defineExtension(Array.prototype, "Array.prototype", "removeIndices", function removeIndices(indices) {
        //remove if index, new array
        return this.filter((_, index) => !indices.includes(index));
    });

    defineExtension(Array.prototype, "Array.prototype", "removeValues", function removeValues(values) {
        //remove if value, new array
        return this.filter((el, _) => !values.includes(el));
    });

    defineExtension(Array.prototype, "Array.prototype", "remove", function remove(value) {
        const LN = this.length;
        for (var x = LN - 1; x >= 0; x--) {
            if (this[x] === value) {
                this.splice(x, 1);
            }
        }
    });

    defineExtension(Array.prototype, "Array.prototype", "chooseRandom", function chooseRandom() {
        let LN = this.length;
        let choose = RND(1, LN) - 1;
        return this[choose];
    });

    defineExtension(Array.prototype, "Array.prototype", "removeRandom", function removeRandom() {
        let LN = this.length;
        let choose = RND(1, LN) - 1;
        return this.splice(choose, 1)[0];
    });

    defineExtension(Array.prototype, "Array.prototype", "removeRandomPool", function removeRandomPool(N) {
        let LN = this.length;
        if (N <= 0) return [];
        if (N >= LN) {
            let temp = this.clone();
            this.clear();
            return temp;
        }
        let temp = [];
        for (let i = 0; i < N; i++) {
            temp.push(this.removeRandom());
        }
        return temp;
    });

    defineExtension(Array.prototype, "Array.prototype", "clone", function clone() {
        return [].concat(this);
    });

    defineExtension(Array.prototype, "Array.prototype", "deepClone", function deepClone() {
        return this.map((item) => {
            if (Array.isArray(item)) {
                return item.deepClone();                                                                      // recursively clone nested arrays
            } else if (typeof item === 'object' && item !== null) {
                return Object.fromEntries(Object.entries(item).map(([key, val]) => [key, val.deepClone()]));  // recursively clone nested objects
            } else {
                return item;                                                                                  // return primitive values unchanged
            }
        });
    });

    defineExtension(Array.prototype, "Array.prototype", "sortByPropAsc", function sortByPropAsc(prop) {
        this.sort(sort);

        function sort(a, b) {
            return a[prop] - b[prop];
        }
    });

    defineExtension(Array.prototype, "Array.prototype", "sortByPropDesc", function sortByPropDesc(prop) {
        this.sort(sort);

        function sort(a, b) {
            return b[prop] - a[prop];
        }
    });

    defineExtension(Array.prototype, "Array.prototype", "last", function last() {
        if (this.length === 0) return null;
        return this[this.length - 1];
    });
    defineExtension(Array.prototype, "Array.prototype", "fromBack", function fromBack(idx) {
        return this[this.length - idx];
    });

    defineExtension(Array.prototype, "Array.prototype", "unique", function unique() {
        let set = new Set(this);
        return [...set];
    });

    defineExtension(Array.prototype, "Array.prototype", "midsort", function midsort() {
        console.assert(this.length % 2 != 0, "Expected array with odd length");
        let sorted = [];
        let start = (this.length / 2) | 0;
        sorted.push(this[start]);
        for (let i = 1; i <= start; i++) {
            sorted.push(this[start - i]);
            sorted.push(this[start + i]);
        }
        return sorted;
    });

    defineExtension(Array.prototype, "Array.prototype", "addUnique", function addUnique(arr) {
        let temp = this.concat(arr);
        temp = new Set(temp);
        return [...temp];
    });

    defineExtension(Array.prototype, "Array.prototype", "removeValueOnce", function removeValueOnce(value) {
        let idx = this.indexOf(value);
        if (idx !== -1) this.splice(idx, 1);
    });

    defineExtension(Array.prototype, "Array.prototype", "count", function count(value) {
        let filtered = this.filter(item => item === value);
        return filtered.length;
    });

    /**  
    * collection of String prototypes LS 
    */

    defineExtension(String.prototype, "String.prototype", "capitalize", function capitalize() {
        return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
    });

    defineExtension(String.prototype, "String.prototype", "trimSpace", function trimSpace() {
        let temp = this.split(" ");
        temp.remove("");
        return temp.join(" ");
    });

    defineExtension(String.prototype, "String.prototype", "changeChar", function changeChar(at, char) {
        let LN = this.length - 1;
        if (at > LN || at < 0) return -1;
        const p1 = this.slice(0, at);
        const p2 = this.slice(at + 1, ++LN);
        return [p1, char, p2].join("");
    });

    defineExtension(String.prototype, "String.prototype", "splitByN", function splitByN(N) {
        let result = [];
        for (let i = 0, LN = this.length; i < LN; i += N) {
            result.push(this.substring(i, i + N));
        }
        return result;
    });

    defineExtension(String.prototype, "String.prototype", "fill", function fill(stringy, howMany) {
        var s = this;
        for (; ;) {
            if (howMany & 1) s += stringy;
            howMany >>= 1;
            if (howMany) stringy += stringy;
            else break;
        }
        return s;
    });

    defineExtension(String.prototype, "String.prototype", "splitOnLastDot", function splitOnLastDot() {
        const lastIndex = this.lastIndexOf(".");
        if (lastIndex === -1) {
            return [this, ""];
        } else {
            const firstPart = this.slice(0, lastIndex);
            const secondPart = this.slice(lastIndex + 1);
            return [firstPart, secondPart];
        }
    });

    defineExtension(String.prototype, "String.prototype", "extract", function extract(regexString) {
        let regex = new RegExp(regexString);
        let match = this.match(regex);
        if (match) return match[0];
        return null;
    });

    defineExtension(String.prototype, "String.prototype", "extractGroup", function extractGroup(regexString) {
        let regex = new RegExp(regexString);
        let exec = regex.exec(this);
        if (exec) return exec[1];
        return null;
    });

    /** 
    *  collection of Set prototypes LS 
    */

    defineExtension(Set.prototype, "Set.prototype", "moveFrom", function moveFrom(s) {
        s.forEach(e => {
            this.add(e);
            s.delete(e);
        });
    });

    defineExtension(Set.prototype, "Set.prototype", "first", function first() {
        if (this.entries().next().value) {
            return this.entries().next().value[0];
        } else {
            return null;
        }
    });

    defineExtension(Set.prototype, "Set.prototype", "addArray", function addArray(arr) {
        arr.forEach(el => this.add(el));
    });

    defineExtension(Set.prototype, "Set.prototype", "removeArray", function removeArray(arr) {
        arr.forEach(el => this.delete(el));
    });

    defineExtension(Set.prototype, "Set.prototype", "intersect", function intersect(x) {
        return new Set([...this].filter(el => x.has(el)));
    });

    /** typed arrays */

    [Uint8Array, Uint16Array, Uint32Array].forEach(TypedArrayClass => {
        defineExtension(
            TypedArrayClass.prototype,
            `${TypedArrayClass.name}.prototype`,
            "extend",
            function extend(extraLength, fill = 0) {
                const extended = new TypedArrayClass(this.length + extraLength);
                extended.set(this);
                if (fill) extended.fill(fill, this.length);
                return extended;
            }
        );
    });

    /** Audio prototypes */
    defineExtension(HTMLAudioElement.prototype, "HTMLAudioElement.prototype", "isPlaying", function isPlaying() {
        return !this.paused && this.currentTime > 0;
    });

    defineExtension(Audio.prototype, "Audio.prototype", "stop", function stop() {
        this.pause();
        this.currentTime = 0;
    });

}


/** Grids */
/**
 * Base behavior shared by two-dimensional grid and point classes.
 *
 * @abstract
 */
class MasterGridClass {
    constructor() {
    }
    EuclidianDistance(grid) {
        return Math.hypot(this.x - grid.x, this.y - grid.y);
    }
    same(grid) {
        return (grid.x === this.x) && (grid.y === this.y);
    }
    limit(maxX, maxY) {
        this.x = Math.min(maxX, Math.max(0, this.x));
        this.y = Math.min(maxY, Math.max(0, this.y));
        return new this.constructor(this.x, this.y);
    }
    manhattanDistance(grid) {
        return Math.abs(this.x - grid.x) + Math.abs(this.y - grid.y);
    }
    distance(vector) {
        return Math.abs(this.x - vector.x) + Math.abs(this.y - vector.y);
    }
    distanceDiagonal(vector) {
        let distance = (this.x - vector.x) ** 2 + (this.y - vector.y) ** 2;
        return Math.sqrt(distance) | 0;
    }
}

/**
 * Integer two-dimensional grid coordinate.
 *
 * @extends MasterGridClass
 */
class Grid extends MasterGridClass {
    /**
     * @param {number} [x=0] - Horizontal grid coordinate.
     * @param {number} [y=0] - Vertical grid coordinate.
     */
    constructor(x = 0, y = 0) {
        super();
        this.x = Math.floor(x);
        this.y = Math.floor(y);
    }
    static toClass(grid) {
        return new Grid(grid.x, grid.y);
    }
    static toCenter(grid) {
        return new FP_Grid(grid.x + 0.5, grid.y + 0.5);
    }
    static toRoundedClass(grid) {
        return Grid.toClass(Grid.toCenter(grid));
    }
    add(vector, mul = 1) {
        return new Grid(this.x + vector.x * mul, this.y + vector.y * mul);
    }
    sub(vector, mul = 1) {
        return this.add(vector, -mul);
    }
    isInAt(dirArray) {
        return dirArray.findIndex(dir => dir.x === this.x && dir.y === this.y);
    }
    direction(vector) {
        const dx = (vector.x - this.x) / Math.abs(this.x - vector.x) || 0;
        const dy = (vector.y - this.y) / Math.abs(this.y - vector.y) || 0;
        return new Vector(dx, dy);
    }
    absDirection(vector) {
        let dx = vector.x - this.x;
        let dy = vector.y - this.y;
        return new Vector(dx, dy);
    }
    same(vector) {
        return (this.x === vector.x && this.y === vector.y);
    }
    directionSolutions(grid) {
        let solutions = [];
        let dir = this.direction(grid);
        let absDir = this.absDirection(grid);
        let split = dir.ortoSplit();
        solutions.push(new Direction(split[0], Math.abs(absDir.x)));
        solutions.push(new Direction(split[1], Math.abs(absDir.y)));

        if (solutions[0].len < solutions[1].len) solutions.swap(0, 1);
        return solutions;
    }
    reflect(C) {
        let x;
        let y;
        if (C.x !== 0) {
            x = 2 * C.x - this.x;
        } else x = this.x;
        if (C.y !== 0) {
            y = 2 * C.y - this.y;
        } else y = this.y;
        return new Grid(x, y);
    }
    toArea() {
        const TL = GRID.gridToCoord(this);
        return new Area(TL.x, TL.y, ENGINE.INI.GRIDPIX, ENGINE.INI.GRIDPIX);
    }
}

/**
 * Floating-point two-dimensional grid coordinate.
 *
 * @extends MasterGridClass
 */
class FP_Grid extends MasterGridClass {
    /**
     * @param {number|string} [x=0] - Horizontal grid coordinate.
     * @param {number|string} [y=0] - Vertical grid coordinate.
     */
    constructor(x = 0, y = 0) {
        super();
        this.x = parseFloat(x);
        this.y = parseFloat(y);
    }
    static toClass(grid) {
        return new FP_Grid(grid.x, grid.y);
    }
    toPoint(GS = ENGINE.INI.GRIDPIX) {
        let x = Math.round(this.x * GS);
        let y = Math.round(this.y * GS);
        return new Point(x, y);
    }
    translate(vector, length = 1) {
        let x = this.x + vector.x * length;
        let y = this.y + vector.y * length;
        return new FP_Grid(x, y);
    }
    direction(grid) {
        let dx = grid.x - this.x;
        let dy = grid.y - this.y;
        let D = this.EuclidianDistance(grid);
        return new FP_Vector(dx / D, dy / D);
    }
    add(vector, factor = 1.0) {
        return new FP_Grid(this.x + vector.x * factor, this.y + vector.y * factor);
    }
    sub(vector, factor = 1.0) {
        return this.add(vector, -factor);
    }
    to_Grid() {
        return new Grid(this.x, this.y);
    }
    toGrid() {
        return this.to_Grid();
    }
}

/**
 * Two-dimensional point,  expressed in pixels.
 *
 * @extends MasterGridClass
 */
class Point extends MasterGridClass {
    /**
     * @param {number} [x=0] - Horizontal point coordinate.
     * @param {number} [y=0] - Vertical point coordinate.
     */
    constructor(x = 0, y = 0) {
        super();
        this.x = x;
        this.y = y;
    }
    static toClass(point) {
        return new Point(point.x, point.y);
    }
    static rounded(point) {
        return new Point(Math.round(point.x), Math.round(point.y));
    }
    static clone(point) {
        return Point.toClass(point);
    }
    translate(vector, len = ENGINE.INI.GRIDPIX) {
        return new Point(this.x + vector.x * len, this.y + vector.y * len);
    }
    toViewport() {
        //change to offset
        this.x = this.x - ENGINE.VIEWPORT.vx;
        this.y = this.y - ENGINE.VIEWPORT.vy;
    }
    toViewportCopy() {
        //change to offset
        let x = this.x - ENGINE.VIEWPORT.vx;
        let y = this.y - ENGINE.VIEWPORT.vy;
        return new Point(x, y);
    }
    toAbsolute() {
        this.x = this.x + ENGINE.VIEWPORT.vx;
        this.y = this.y + ENGINE.VIEWPORT.vy;
    }
    toTopLeft(offX = 0, offY = 0) {
        //change to offset
        const half = ENGINE.INI.GRIDPIX >>> 1;
        const x = this.x - half + offX;
        const y = this.y - half + offY;
        return new Point(x, y);
    }
    add(vector, len = 1) {
        return new Point(this.x + vector.x * len, this.y + vector.y * len);
    }
    to_FP_Grid(GS = ENGINE.INI.GRIDPIX) {
        let x = this.x / GS;
        let y = this.y / GS;
        return new FP_Grid(x, y);
    }
    to_Grid() {
        return Grid.toClass(this.to_FP_Grid());
    }
    /** alias */
    toGrid() {
        return this.to_Grid();
    }
}

/** Vectors */
/**
 * Base behavior shared by two-dimensional vector classes.
 *
 * @abstract
 */
class MasterVectorClass {
    constructor() { }
    magnitude() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }
    normalize() {
        const mag = this.magnitude();
        if (mag === 0) throw new Error("Cannot normalize a zero vector");
        return new FP_Vector(this.x / mag, this.y / mag);
    }
    rotate(rad) {
        let COS = Math.cos(rad);
        let SIN = Math.sin(rad);
        let x = this.x * COS - this.y * SIN;
        let y = this.x * SIN + this.y * COS;
        return new FP_Vector(x, y);
    }
    same(vec) {
        return (vec.x === this.x) && (vec.y === this.y);
    }
    sub(vector, factor = 1.0) {
        return this.add(vector, -factor);
    }
    toVector3D(z = 0) {
        return new Vector3D(this.x, this.y, z);
    }
}

/**
 * Floating-point two-dimensional vector.
 *
 * @extends MasterVectorClass
 */
class FP_Vector extends MasterVectorClass {
    /**
     * @param {number|string} [x=0] - Horizontal vector component.
     * @param {number|string} [y=0] - Vertical vector component.
     */
    constructor(x = 0, y = 0) {
        super();
        this.x = parseFloat(x);
        this.y = parseFloat(y);
    }
    static toClass(vector) {
        return new FP_Vector(vector.x, vector.y);
    }
    clone() {
        return new FP_Vector(this.x, this.y);
    }
    signVector() {
        const x = this.x === 0 ? 0 : this.x / Math.abs(this.x);
        const y = this.y === 0 ? 0 : this.y / Math.abs(this.y);
        return new FP_Vector(x, y);
    }
    scale(factor) {
        return new FP_Vector(this.x * factor, this.y * factor);
    }
    reverse() {
        return this.rotate(Math.PI);
    }
    mirror() {
        return this.reverse();
    }
    add(vector, factor = 1.0) {
        return new FP_Vector(this.x + vector.x * factor, this.y + vector.y * factor);
    }

    mul(vector, num = 1.0) {
        return new FP_Vector(this.x * num * vector.x, this.y * num * vector.y);
    }
    ortoAlign() {
        let dim = ["x", "y"];
        let spread = [Math.abs(this.x), Math.abs(this.y)];
        let i = spread.indexOf(Math.max(...spread));
        let ortoVector = new Vector(0, 0);
        ortoVector[dim[i]] = Math.round(this[dim[i]]);
        return ortoVector;
    }
    dot(vector) {
        return this.x * vector.x + this.y * vector.y;
    }
    radAngleBetweenVectors(vector) {
        let dot = this.dot(vector);
        dot = Math.min(1.0, Math.max(-1.0, dot));
        let angle = Math.acos(dot);
        if (this.x * vector.y - this.y * vector.x < 0) angle = 2 * Math.PI - angle;

        return angle;
    }
    radAngleBetweenVectorsSharp(vector) {
        let angle = this.radAngleBetweenVectors(vector);
        angle = angle % Math.PI;
        if (angle > Math.PI / 2) {
            angle -= Math.PI;
        }
        return angle;
    }
}

/**
 * Integer two-dimensional vector, commonly used as a grid direction.
 *
 * @extends MasterVectorClass
 */
class Vector extends MasterVectorClass {
    static W = 3;
    /**
     * @param {number} [x=0] - Horizontal vector component.
     * @param {number} [y=0] - Vertical vector component.
     */
    constructor(x = 0, y = 0) {
        super();
        this.x = Math.floor(x);
        this.y = Math.floor(y);
    }
    static toClass(vector) {
        return new Vector(vector.x, vector.y);
    }
    clone() {
        return new Vector(this.x, this.y);
    }
    signVector() {
        const x = this.x === 0 ? 0 : this.x / Math.abs(this.x);
        const y = this.y === 0 ? 0 : this.y / Math.abs(this.y);
        return new Vector(x, y);
    }
    isInAt(dirArray) {
        for (let q = 0; q < dirArray.length; q++) {
            if (this.x === dirArray[q].x && this.y === dirArray[q].y) {
                return q;
            }
        }
        return -1;
    }
    isInPointerArray(dirArray) {
        for (let q = 0; q < dirArray.length; q++) {
            if (this.x === dirArray[q].vector.x && this.y === dirArray[q].vector.y) {
                return q;
            }
        }
        return -1;
    }
    add(vector) {
        return new Vector(this.x + vector.x, this.y + vector.y);
    }
    prolong(num) {
        return new Vector(this.x * num, this.y * num);
    }
    mul(vector, num = 1) {
        return new Vector(this.x + num * vector.x, this.y + num * vector.y);
    }
    distance(vector) {
        return Math.abs(this.x - vector.x) + Math.abs(this.y - vector.y);
    }
    mirror() {
        return new Vector(
            this.x ? -this.x : 0,
            this.y ? -this.y : 0
        );
    }
    direction(vector) {
        let dx = (vector.x - this.x) / Math.abs(this.x - vector.x) || 0;
        let dy = (vector.y - this.y) / Math.abs(this.y - vector.y) || 0;
        return new Vector(dx, dy);
    }
    absDirection(vector) {
        let dx = vector.x - this.x;
        let dy = vector.y - this.y;
        return new Vector(dx, dy);
    }
    directionSolutions(vector) {
        let solutions = [];
        let dir = this.direction(vector);
        let absDir = this.absDirection(vector);
        let split = dir.ortoSplit();
        solutions.push(new Direction(split[0], Math.abs(absDir.x)));
        solutions.push(new Direction(split[1], Math.abs(absDir.y)));
        //SORT!!
        if (solutions[0].len < solutions[1].len) solutions.swap(0, 1); //check
        return solutions;
    }
    ortoSplit() {
        let split = [];
        split.push(new Vector(this.x, 0));
        split.push(new Vector(0, this.y));
        return split;
    }
    cw() {
        let directions = [UP, RIGHT, DOWN, LEFT];
        let q;
        for (q = 0; q < 4; q++) {
            if (this.same(directions[q])) {
                q++;
                if (q > 3) q = 0;
                return directions[q];
            }
        }
        return null;
    }
    ccw() {
        let directions = [UP, RIGHT, DOWN, LEFT];
        let q;
        for (q = 0; q < 4; q++) {
            if (this.same(directions[q])) {
                q--;
                if (q < 0) q = 3;
                return directions[q];
            }
        }
        return null;
    }
    isOrto() {
        return this.x * this.y === 0;
    }
    isNull() {
        return this.x === 0 && this.y === 0;
    }
    isDiagonal() {
        return Math.abs(this.x) === Math.abs(this.y);
    }
    isContra(vector) {
        let X = this.x + vector.x;
        let Y = this.y + vector.y;
        return X === 0 && Y === 0;
    }
    getDirectionAxis() {
        if (this.x !== 0) {
            return "x";
        } else if (this.y !== 0) {
            return "y";
        }
        return 0;
    }
    getDirectionProperty() {
        if (this.x !== 0) {
            return "width";
        } else if (this.y !== 0) {
            return "height";
        } else throw new Error(`error getting direction property from ${this}`);
    }
    getPerpendicularDirs() {
        let axis = this.getDirectionAxis();
        switch (axis) {
            case "x": return [UP, DOWN];
            case "y": return [LEFT, RIGHT];
            case 0: return [NOWAY, NOWAY];
            default: throw new Error(`error getting perpenicular directions from ${this}`);
        }
    }
    trimMirror(dirArray) {
        let axis = this.getDirectionAxis();
        let LN = dirArray.length;
        for (let q = LN - 1; q >= 0; q--) {
            if (dirArray[q][axis] === this[axis]) dirArray.splice(q, 1);
        }
        return dirArray;
    }
    toRad() {
        if (this.x !== 0) {
            switch (this.x) {
                case 1: return 2 * Math.PI;
                case -1: return Math.PI;
            }
        } else {
            switch (this.y) {
                case -1: return Math.PI / 2;
                case 1: return (3 * Math.PI) / 2;
            }
        }
    }
    angleBetweenVectors(vector) {
        let Angle2 = vector.toRad();
        let Angle1 = this.toRad();
        return (Math.degrees(Angle2 - Angle1) + 360) % 360;
    }
    radAngleBetweenVectors(vector) {
        let Angle2 = vector.toRad();
        let Angle1 = this.toRad();
        return Angle2 - Angle1;
    }
    static sumVectors(arr) {
        let sum = arr.pop();
        while (arr.length) {
            sum = sum.add(arr.pop());
        }
        return sum;
    }
    toInt() {
        return (this.x + 1) + (this.y + 1) * Vector.W;
    }
    static fromInt(int) {
        let x = int % Vector.W - 1;
        let y = Math.floor(int / Vector.W) - 1;
        return new Vector(x, y);
    }
}


/** Other, legacy */
/**
 * Legacy direction record containing a vector, path length, and weight.
 */
class Direction {
    /**
     * @param {{x: number, y: number}} vector - Direction components.
     * @param {number} [len=1] - Associated direction length.
     * @param {number} [weight=0] - Associated direction weight.
     */
    constructor(vector, len, weight) {
        this.dir = new Vector(vector.x, vector.y);
        this.len = len || 1;
        this.weight = weight || 0;
    }
    isInAt(dirArray) {
        for (let q = 0; q < dirArray.length; q++) {
            if (
                this.dir.x === dirArray[q].dir.x &&
                this.dir.y === dirArray[q].dir.y
            ) {
                return q;
            }
        }
        return -1;
    }
}


/**
 * Couples a two-dimensional integer grid coordinate with an integer vector.
 */
class Pointer {
    /**
     * @param {{x: number, y: number}} grid - Grid coordinate to copy.
     * @param {{x: number, y: number}} vector - Vector to copy.
     */
    constructor(grid, vector) {
        this.grid = Grid.toClass(grid);
        this.vector = Vector.toClass(vector);
    }
}

/**
 * Couples a three-dimensional grid coordinate with a two-dimensional vector.
 */
class Pointer_3DGrid {
    /**
     * @param {{x: number, y: number, z: number}} grid - 3D grid coordinate to copy.
     * @param {{x: number, y: number}} vector - 2D vector to copy.
     */
    constructor(grid, vector) {
        this.grid = Grid3D.toClass(grid);
        this.vector = Vector.toClass(vector);   //remains 2D vector
    }
}

/**
 * Couples a three-dimensional grid coordinate with a three-dimensional vector.
 */
class Pointer_3D {
    /**
     * @param {{x: number, y: number, z: number}} grid - 3D grid coordinate to copy.
     * @param {{x: number, y: number, z: number}} vector - 3D vector to copy.
     */
    constructor(grid, vector) {
        this.grid = Grid3D.toClass(grid);
        this.vector = Vector3D.toClass(vector);   //3D vector
    }
}

/** 3D classes */
/** Grids */
/**
 * Base behavior shared by three-dimensional grid classes.
 *
 * @abstract
 */
class MasterGridClass3D {
    constructor() { }
    EuclidianDistance(grid) {
        return Math.hypot(this.x - grid.x, this.y - grid.y, this.z - grid.z);
    }
    same(grid) {
        return (grid.x === this.x) && (grid.y === this.y) && (grid.z === this.z);
    }
    sub(vector, mul = 1) {
        return this.add(vector, -mul);
    }
}

/**
 * Integer three-dimensional grid coordinate.
 *
 * @extends MasterGridClass3D
 */
class Grid3D extends MasterGridClass3D {
    /**
     * @param {number} [x=0] - Horizontal grid coordinate.
     * @param {number} [y=0] - Vertical grid coordinate.
     * @param {number} [z=0] - Depth grid coordinate.
     */
    constructor(x = 0, y = 0, z = 0) {
        super();
        this.x = Math.floor(x);
        this.y = Math.floor(y);
        this.z = Math.floor(z);
    }
    static toGrid(grid) {
        return new Grid(grid.x, grid.y);
    }
    static toClass(grid) {
        return new Grid3D(grid.x, grid.y, grid.z);
    }
    static toCenter2D(grid) {
        return new FP_Grid3D(grid.x + 0.5, grid.y + 0.5, grid.z);                                                        //centering on XY plane
    }
    static addDepth(grid, z) {
        return new Grid3D(grid.x, grid.y, z);
    }
    add(vector, mul = 1) {

        return new Grid3D(this.x + vector.x * mul, this.y + vector.y * mul, this.z + (vector?.z || 0) * mul);           //allows add with 2D direction
    }
    isInAt(dirArray) {
        return dirArray.findIndex(dir => dir.x === this.x && dir.y === this.y && dir.z === this.z);
    }
    direction(vector) {
        var dx = (vector.x - this.x) / Math.abs(this.x - vector.x) || 0;
        var dy = (vector.y - this.y) / Math.abs(this.y - vector.y) || 0;
        var dz = (vector.z - this.z) / Math.abs(this.z - vector.z) || 0;
        return new Vector3D(dx, dy, dz);
    }
    absDirection(vector) {
        let dx = vector.x - this.x;
        let dy = vector.y - this.y;
        let dz = vector.z - this.z;
        return new Vector3D(dx, dy, dz);
    }
    distance(vector) {
        return Math.abs(this.x - vector.x) + Math.abs(this.y - vector.y) + Math.abs(this.z - vector.z);
    }
    distanceDiagonal(vector) {
        let distance = (this.x - vector.x) ** 2 + (this.y - vector.y) ** 2 + (this.z - vector.z) ** 2;
        return Math.floor(Math.sqrt(distance));
    }
}

/**
 * Floating-point three-dimensional grid coordinate.
 *
 * @extends MasterGridClass3D
 */
class FP_Grid3D extends MasterGridClass3D {
    /**
     * @param {number|string} [x=0] - Horizontal grid coordinate.
     * @param {number|string} [y=0] - Vertical grid coordinate.
     * @param {number|string} [z=0] - Depth grid coordinate.
     */
    constructor(x = 0, y = 0, z = 0) {
        super();
        this.x = parseFloat(x);
        this.y = parseFloat(y);
        this.z = parseFloat(z);
    }
    static toClass(grid) {
        return new FP_Grid3D(grid.x, grid.y, grid.z);
    }
    translate(vector, length = 1) {
        let x = this.x + vector.x * length;
        let y = this.y + vector.y * length;
        let z = this.z + vector.z * length;
        return new FP_Grid3D(x, y, z);
    }
    direction(grid) {
        let dx = grid.x - this.x;
        let dy = grid.y - this.y;
        let dz = grid.z - this.z;
        let D = this.EuclidianDistance(grid);
        return new FP_Vector3D(dx / D || 0, dy / D || 0, dz / D || 0);
    }
    add(vector, factor = 1.0) {
        return new FP_Grid3D(this.x + vector.x * factor, this.y + vector.y * factor, this.z + vector.z * factor);
    }
    static to_center_block(grid3d) {
        if (grid3d.constructor.name !== "Grid3D") throw new Error(`from_Grid3D_to_center_block_swap_ZY, wrong object type ${JSON.stringify(grid3d)}, object: ${grid3d.constructor.name}`);
        return new FP_Grid3D(grid3d.x + 0.5, grid3d.y + 0.5, grid3d.z + 0.5,);
    }
    absDirection(vector) {
        let dx = vector.x - this.x;
        let dy = vector.y - this.y;
        let dz = vector.z - this.z;
        return new FP_Vector3D(dx, dy, dz);
    }
    adjuctCirclePos(r) {
        const xmr = this.x - r;
        const xpr = this.x + r;
        if (Math.floor(this.x) > Math.floor(xmr)) {
            this.x += Math.ceil(xmr) - xmr;
        } else if (this.x < Math.floor(xpr)) {
            this.x -= xpr - Math.floor(xpr);
        }

        const ymr = this.y - r;
        const ypr = this.y + r;
        if (Math.floor(this.y) > Math.floor(ymr)) {
            this.y += Math.ceil(ymr) - ymr;
        } else if (this.y < Math.floor(ypr)) {
            this.y -= ypr - Math.floor(ypr);
        }
    }
}


/** Vectors */
/**
 * Base behavior shared by three-dimensional vector classes.
 *
 * @abstract
 */
class MasterVectorClass3D {
    constructor() { }
    magnitude() {
        return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
    }
    normalize() {
        const mag = this.magnitude();
        if (mag === 0) throw new Error("Cannot normalize a zero vector");
        return new FP_Vector3D(this.x / mag, this.y / mag, this.z / mag);
    }
    same(vec) {
        return (vec.x === this.x) && (vec.y === this.y) && (vec.z === this.z);
    }
    sub(vector, factor = 1.0) {
        return this.add(vector, -factor);
    }
}

/**
 * Integer three-dimensional vector, commonly used as a grid direction.
 *
 * @extends MasterVectorClass3D
 */
class Vector3D extends MasterVectorClass3D {
    static W = 3;
    static W2 = 3 * 3;
    /**
     * @param {number} [x=0] - Horizontal vector component.
     * @param {number} [y=0] - Vertical vector component.
     * @param {number} [z=0] - Depth vector component.
     */
    constructor(x = 0, y = 0, z = 0) {
        super();
        this.x = Math.floor(x);
        this.y = Math.floor(y);
        this.z = Math.floor(z);
    }
    static fromVector2D(vector2d, z) {
        return new Vector3D(vector2d.x, vector2d.y, z);
    }
    static toVector2D(vector) {
        return new Vector(vector.x, vector.y);
    }
    static toClass(vector) {
        return new Vector3D(vector.x, vector.y, vector.z);
    }
    clone() {
        return new Vector3D(this.x, this.y, this.z);
    }
    signVector() {
        const x = this.x === 0 ? 0 : this.x / Math.abs(this.x);
        const y = this.y === 0 ? 0 : this.y / Math.abs(this.y);
        const z = this.z === 0 ? 0 : this.z / Math.abs(this.z);
        return new Vector3D(x, y, z);
    }
    add(vector, factor = 1.0) {
        return new Vector3D(this.x + vector.x * factor, this.y + vector.y * factor, this.z + vector.z * factor);
    }
    prolong(num) {
        return new Vector3D(this.x * num, this.y * num, this.z * num);
    }
    addScaledVector(vector, num = 1) {
        return new Vector3D(this.x + num * vector.x, this.y + num * vector.y, this.z + num * vector.z);
    }
    distance(vector) {
        return Math.abs(this.x - vector.x) + Math.abs(this.y - vector.y) + Math.abs(this.z - vector.z);
    }
    direction(vector) {
        let dx = (vector.x - this.x) / Math.abs(this.x - vector.x) || 0;
        let dy = (vector.y - this.y) / Math.abs(this.y - vector.y) || 0;
        let dz = (vector.z - this.z) / Math.abs(this.z - vector.z) || 0;
        return new Vector3D(dx, dy, dz);
    }
    toInt() {
        return (this.x + 1) + (this.y + 1) * Vector3D.W + (this.z + 1) * Vector3D.W2;
    }
    static fromInt(int) {
        let z = Math.floor(int / Vector3D.W2) - 1;
        int -= (z + 1) * Vector3D.W2;
        let x = int % Vector3D.W - 1;
        let y = Math.floor(int / Vector3D.W) - 1;
        return new Vector3D(x, y, z);
    }
    mirror() {
        return new Vector3D(
            this.x ? -this.x : 0,
            this.y ? -this.y : 0,
            this.z ? -this.z : 0
        );
    }

}

/**
 * Floating-point three-dimensional vector.
 *
 * @extends MasterVectorClass3D
 */
class FP_Vector3D extends MasterVectorClass3D {
    /**
     * @param {number|string} [x=0] - Horizontal vector component.
     * @param {number|string} [y=0] - Vertical vector component.
     * @param {number|string} [z=0] - Depth vector component.
     */
    constructor(x = 0, y = 0, z = 0) {
        super();
        this.x = parseFloat(x);
        this.y = parseFloat(y);
        this.z = parseFloat(z);
    }
    static toClass(vector) {
        return new FP_Vector3D(vector.x, vector.y, vector.z);
    }
    clone() {
        return new FP_Vector3D(this.x, this.y, this.z);
    }
    signVector() {
        const x = this.x === 0 ? 0 : this.x / Math.abs(this.x);
        const y = this.y === 0 ? 0 : this.y / Math.abs(this.y);
        const z = this.z === 0 ? 0 : this.z / Math.abs(this.z);
        return new FP_Vector3D(x, y, z);
    }
    scale(factor) {
        return new FP_Vector3D(this.x * factor, this.y * factor, this.z * factor);
    }
    add(vector, factor = 1.0) {
        return new FP_Vector3D(this.x + vector.x * factor, this.y + vector.y * factor, this.z + vector.z * factor);
    }
    addScaledVector(vector, num = 1.0) {
        return new FP_Vector3D(this.x + num * vector.x, this.y + num * vector.y, this.z + num * vector.z);
    }
    dot(vector) {
        return this.x * vector.x + this.y * vector.y + this.z * vector.z;
    }
    mul(vector, epsilon = 0.0025) {
        let x = (this.x + epsilon) * vector.x;
        let y = (this.y + epsilon) * vector.y;
        let z = (this.z + epsilon) * vector.z;
        return new FP_Vector3D(x, y, z);
    }
    frac() {
        let x = Math.frac(this.x);
        let y = Math.frac(this.y);
        let z = Math.frac(this.z);
        return new FP_Vector3D(x, y, z);
    }
}

/** ***** */
/**
 * Angle expressed in degrees, with rotation and reflection helpers.
 */
class Angle {
    /**
     * @param {number} a - Initial angle in degrees.
     */
    constructor(a) {
        this.angle = a;
    }
    rotate(R) {
        return new Angle((this.angle + 360 + R) % 360);
    }
    rotateCCW(R) {
        return (this.angle + 360 - R) % 360;
    }
    rotateCW(R) {
        return (this.angle + 360 + R) % 360;
    }
    bounce(face) {
        return new Angle((180 + 2 * face - this.angle) % 360);
    }
    getDirectionVector(refVector) {
        const angleInRadians = Math.radians(this.angle);
        const cosAngle = Math.cos(angleInRadians);
        const sinAngle = Math.sin(angleInRadians);
        const dirX = refVector.x * cosAngle - refVector.y * sinAngle;
        const dirY = refVector.x * sinAngle + refVector.y * cosAngle;
        const magnitude = Math.sqrt(dirX * dirX + dirY * dirY);
        const normalizedDirX = dirX / magnitude;
        const normalizedDirY = dirY / magnitude;
        return new FP_Vector(normalizedDirX, normalizedDirY);
    }
    getOrtoVector(refVector) {
        switch (this.angle) {
            case 0: return UP;
            case 90: return RIGHT;
            case 180: return DOWN;
            case 270: return LEFT;
            default: return NOWAY;
        }
    }
}

/**
 * Axis-aligned rectangular area.
 */
class RectArea {
    /**
     * @param {number} x - Left coordinate.
     * @param {number} y - Top coordinate.
     * @param {number} w - Width.
     * @param {number} h - Height.
     */
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    overlap(area) {
        let condX = Math.max(this.x, area.x) < Math.min(this.x + this.w, area.x + area.w);
        let condY = Math.max(this.y, area.y) < Math.min(this.y + this.h, area.y + area.h);
        return condX && condY;
    }
    gridWithin(grid) {
        return this.within(grid.x, grid.y);
    }
    within(X, Y) {
        if (
            X >= this.x &&
            X < this.x + this.w &&
            Y >= this.y &&
            Y < this.y + this.h
        ) {
            return true;
        } else return false;
    }
}

/**
 * Backward-compatible alias for {@link RectArea}.
 *
 * @extends RectArea
 */
class Area extends RectArea {
    /**
     * @param {number} x - Left coordinate.
     * @param {number} y - Top coordinate.
     * @param {number} w - Width.
     * @param {number} h - Height.
     */
    constructor(x, y, w, h) {
        super(x, y, w, h);
    }
}

/** **** */

/**
 * Dictionary proxy that returns one shared default value for missing keys.
 *
 * @template T
 */
class DefaultDict {
    /**
     * @param {T} defaultVal - Value returned for keys not present in the dictionary.
     * @returns {Object<string, T>} Dictionary proxy.
     */
    constructor(defaultVal) {
        return new Proxy(
            {},
            {
                get: (target, name) => (name in target ? target[name] : defaultVal),
            }
        );
    }
}

/**
 * Dictionary proxy that lazily creates an array-like value for each missing key.
 */
class DefaultArrayDict {
    /**
     * @param {Function} [ArrayType=Array] - Array or typed-array constructor.
     * @param {number} [defaultLength=0] - Length used for each lazily created value.
     * @returns {Object<string, Array|Uint8Array|Uint16Array|Uint32Array>} Dictionary proxy.
     */
    constructor(ArrayType = Array, defaultLength = 0) {
        return new Proxy({}, {
            get: (target, name) => {
                if (!(name in target)) {
                    target[name] = new ArrayType(defaultLength);
                }
                return target[name];
            }
        });
    }
}

const float64ToInt64Binary = (function () {
    //https://stackoverflow.com/questions/9939760/how-do-i-convert-an-integer-to-binary-in-javascript
    var flt64 = new Float64Array(1);
    var uint16 = new Uint16Array(flt64.buffer);
    var MAX_SAFE = Math.pow(2, 53) - 1;
    var MAX_INT32 = Math.pow(2, 31);

    function uint16ToBinary() {
        var bin64 = "";
        for (var word = 0; word < 4; word++) {
            bin64 = uint16[word].toString(2).padStart(16, 0) + bin64;
        }
        return bin64;
    }

    return function float64ToInt64Binary(number) {
        if (Math.abs(number) > MAX_SAFE) {
            throw new RangeError("Absolute value must be less than 2**53");
        }
        if (Math.abs(number) <= MAX_INT32) {
            return (number >>> 0).toString(2).padStart(64, "0");
        }

        flt64[0] = number;                                                      // little endian byte ordering
        var exponent = ((uint16[3] & 0x7ff0) >> 4) - 1023 + 1;                  //+1!! // subtract bias from exponent bits
        uint16[3] |= 0x10;                                                      // encode implicit leading bit of mantissa
        uint16[3] &= 0x1f;                                                      // clear exponent and sign bit
        var bin64 = uint16ToBinary().substr(11, Math.max(exponent, 0));         // only keep integer part of mantissa
        return bin64;
    };
})();

LIB.log();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
