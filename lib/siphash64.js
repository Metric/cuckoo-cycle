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

const u8to64 = (p,i) => {
    return u8(p[i  ]) | (u8(p[i+1]) <<  8) |
            (u8(p[i+2]) << 16) | (u8(p[i+3]) << 24) |
            (u8(p[i+4]) << 32) | (u8(p[i+5]) << 40) |
            (u8(p[i+6]) << 48) | (u8(p[i+7]) << 56) ;
};

const ROTL64 = (x,b) => {
    return (x << b) | (x >> (64 - b));
}

const SIPROUND = (vs) => {
    vs[0] += vs[1]; 
    vs[2] += vs[3];
    vs[1] = ROTL64(vs[1], 13);
    vs[3] = ROTL64(vs[3], 16);
    vs[1] ^= vs[0];
    vs[3] ^= vs[2];
    vs[0] = ROTL64(vs[0], 32);
    vs[2] += vs[1];
    vs[0] += vs[3];
    vs[1] = ROTL64(vs[1], 17);
    vs[3] = ROTL64(vs[3], 21);
    vs[1] ^= vs[2];
    vs[3] ^= vs[0];
    vs[2] = ROTL64(vs[2], 32);
}

class Siphash {
    //expects an array of at least 32 bytes
    constructor(key, s512) {
        this.s512 = s512;
        this.v = new Float64Array(4);
        this.k = new Float64Array(4);
        this.updateKey(key);
    }

    //expects an array of at least 32 bytes
    updateKey(key) {
        if(key.length < 32 && !this.s512) throw new Error('key byte array length must be at least 32 bytes');
        if(key.length < 64 && this.s512) throw new Error('key byte array length must be at least 64 bytes');

        if(!this.s512) {
            this.k[0] = u8to64(key, 0);
            this.k[1] = u8to64(key, 8);
            this.k[2] = u8to64(key, 16);
            this.k[3] = u8to64(key, 24);
        }
        else {
            this.k[0] = u8to64(key, 0) ^ u8to64(key, 8);
            this.k[1] = u8to64(key, 16) ^ u8to64(key, 24);
            this.k[2] = u8to64(key, 32) ^ u8to64(key, 40);
            this.k[3] = u8to64(key, 48) ^ u8to64(key, 56);
        }
    }

    uint(nonce) {
        this.v[0] = this.k[0];
        this.v[1] = this.k[1];
        this.v[2] = this.k[2];
        this.v[3] = this.k[3] ^ nonce;
        SIPROUND(this.v); SIPROUND(this.v);
        this.v[0] ^= nonce;
        this.v[2] ^= 0xff;
        SIPROUND(this.v); SIPROUND(this.v); SIPROUND(this.v); SIPROUND(this.v);
        return this.v[0] ^ this.v[1] ^ this.v[2] ^ this.v[3];
    }
}

module.exports = exports = Siphash;

