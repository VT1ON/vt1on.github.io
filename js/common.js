const common = {
    bytesToUint32: (a, b, c, d) => (a << 24) | (b << 16) | (c << 8) | d,
    uint32ToBytes: (a) => [
        (a >> 24) & 0xFF,
        (a >> 16) & 0xFF,
        (a >> 8) & 0xFF,
        a & 0xFF
    ]
};
export default common;