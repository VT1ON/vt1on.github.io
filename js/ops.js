// ops.js

const ops = {};

const band = (a, b) => a & b;
const bor = (a, b) => a | b;
const bxor = (a, b) => a ^ b;

ops.uint32_lrot = (n, d) => (n << d) | (n >>> (32 - d));

ops.byte_xor = bxor;
ops.uint32_xor_3 = bxor;
ops.uint32_xor_4 = bxor;

ops.uint32_ternary = function(a, b, c) {
    return bxor(c, band(a, bxor(b, c)));
};


ops.uint32_majority = function(a, b, c) {
    return bor(band(a, bor(b, c)), band(b, c));
};

export default ops;
