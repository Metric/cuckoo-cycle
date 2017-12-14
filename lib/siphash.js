'use strict';

/////
///// This is a 32bit implementation of Siphash-2-4 for producing integers
///// With modification to draw the key from a 64 byte key or greater
///// 

const u8 = (b) => {
    return b & 0xFF;
};

const u8to32 = (p,i) => {
    return u8(p[i]) | (u8(p[i+1]) << 8) |
           (u8(p[i+2]) << 16) | (u8(p[i+3]) << 24);
};

const ROTL32 = (x,b) => {
    return (x << b) | (x >> (32 - b));
}

const SIPROUND = (vs) => {
    vs[0] += vs[1]; 
    vs[2] += vs[3];
    vs[1] = ROTL32(vs[1], 5);
    vs[3] = ROTL32(vs[3], 7);
    vs[1] ^= vs[0];
    vs[3] ^= vs[2];
    vs[0] = ROTL32(vs[0], 16);
    vs[2] += vs[1];
    vs[0] += vs[3];
    vs[1] = ROTL32(vs[1], 13);
    vs[3] = ROTL32(vs[3], 8);
    vs[1] ^= vs[2];
    vs[3] ^= vs[0];
    vs[2] = ROTL32(vs[2], 16);
}

class Siphash {
    //expects an array of at least 32 bytes
    constructor(key) {
        this.v = new Uint32Array(4);
        this.k = new Uint32Array(4);
        this.updateKey(key);
    }

    //expects an array of at least 32 bytes
    updateKey(key) {
        if(key.length < 32) throw new Error('key byte array length must be at least 32 bytes');

        this.k[0] = u8to32(key, 0) ^ u8to32(key, 4);
        this.k[1] = u8to32(key, 8) ^ u8to32(key, 12);
        this.k[2] = u8to32(key, 16) ^ u8to32(key, 20);
        this.k[3] = u8to32(key, 24) ^ u8to32(key, 28);
    }

    uint(nonce) {
        this.v[0] = this.k[0] ^ 0x736f6d65;
        this.v[1] = this.k[1] ^ 0x646f7261;
        this.v[2] = this.k[2] ^ 0x6c796765;
        this.v[3] = this.k[3] ^ 0x74656462 ^ nonce;
        SIPROUND(this.v); SIPROUND(this.v);
        this.v[0] ^= nonce;
        this.v[2] ^= 0xff;
        SIPROUND(this.v); SIPROUND(this.v); SIPROUND(this.v); SIPROUND(this.v);
        return this.v[0] ^ this.v[1] ^ this.v[2] ^ this.v[3];
    }
}

module.exports = exports = Siphash;

