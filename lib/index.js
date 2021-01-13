'use strict';

const Siphash = require('./siphash');
const Siphash64 = require('./siphash64');
const Hasher = require('./hasher');
const Edge = require('./edge');

const SIZESHIFT = 20;
const PROOFSIZE = 42;
const HALFSIZE = 1 << SIZESHIFT;
const SIZE = 1 << (SIZESHIFT + 1);
const NODEMASK = HALFSIZE - 1;

const DIFFICULTY = 50 * SIZE / 100;

// 64 bit version

const EDGEBITS = 19;
const NEDGES = 1 << EDGEBITS;
const NODEBITS = EDGEBITS + 1;
const NNODES = 1 << NODEBITS;
const EDGEMASK = NEDGES - 1;

const MAXPATHLEN = 4096;

const DIFFICULTY64 = 50 * NNODES / 100;

class Cuckoo64 {
    constructor(data, s512) {
        this.s512 = s512;

        if(this.s512) {
            this.hdrkey = Hasher.hash512(data);
        }
        else {
            this.hdrkey = Hasher.hash(data);
        }

        this.sip = new Siphash64(this.hdrkey, s512);
    }

    updateKey(data) {
        if(this.s512) {
            this.hdrkey = Hasher.hash512(data);
        }
        else {
            this.hdrkey = Hasher.hash(data);
        }
        
        this.sip.updateKey(this.hdrkey);
    }

    verify(nonces, easiness) {
        let us = new Float64Array(PROOFSIZE), vs = new Float64Array(PROOFSIZE);
        let i = 0, n = 0;
        for(n = 0; n < PROOFSIZE; n++) {
            if(nonces[n] >= easiness || (n != 0 && nonces[n] <= nonces[n-1])) {
                return false;
            }

            us[n] = this.sipnode(nonces[n], 0);
            vs[n] = this.sipnode(nonces[n], 1);
        }

        do {
            let j = i;
            for(let k = 0; k < PROOFSIZE; k++) {
                if(k != i && vs[k] == vs[i]) {
                    if(j != i) {
                        return false;
                    }

                    j = k;
                }
            }

            if(j == i) {
                return false;
            }

            i = j;
            for(let k = 0; k <PROOFSIZE; k++) {
                if(k != j && us[k] == us[j]) {
                    if(i != j) {
                        return false;
                    }

                    i = k;
                }
            }

            
            if(i == j) {
                return false;
            }

            n-=2;
        } while(i != 0);

        return n == 0;
    }

    sipedge(nonce) {
        return new Edge(this.sipnode(nonce,0), this.sipnode(nonce,1));
    }

    sipnode(nonce, uorv) {
        return this.sip.uint(2*nonce + uorv) & EDGEMASK;
    }
}

Cuckoo64.MAXPATHLEN = MAXPATHLEN;
Cuckoo64.EDGEBITS = EDGEBITS;
Cuckoo64.NEDGES = NEDGES;
Cuckoo64.NODEBITS = NODEBITS;
Cuckoo64.NNODES = NNODES;
Cuckoo64.EDGEMASK = EDGEMASK
Cuckoo64.SIZE = NNODES;
Cuckoo64.PROOFSIZE = PROOFSIZE;
Cuckoo64.DIFFICUTLY = DIFFICULTY64;

class Cuckoo {
    constructor(data, s512) {
        this.s512 = s512;

        if(this.s512) {
            this.hdrkey = Hasher.hash512(data);
        }
        else {
            this.hdrkey = Hasher.hash(data);
        }

        this.sip = new Siphash(this.hdrkey, s512);
    }

    updateKey(data) {
        if(this.s512) {
            this.hdrkey = Hasher.hash512(data);
        }
        else {
            this.hdrkey = Hasher.hash(data);
        }
        
        this.sip.updateKey(this.hdrkey);
    }

    verify(nonces, easiness) {
        let us = new Uint32Array(PROOFSIZE), vs = new Uint32Array(PROOFSIZE);
        let i = 0, n = 0;
        for(n = 0; n < PROOFSIZE; n++) {
            if(nonces[n] >= easiness || (n != 0 && nonces[n] <= nonces[n-1])) {
                return false;
            }

            us[n] = this.sipnode(nonces[n], 0);
            vs[n] = this.sipnode(nonces[n], 1);
        }

        do {
            let j = i;
            for(let k = 0; k < PROOFSIZE; k++) {
                if(k != i && vs[k] == vs[i]) {
                    if(j != i) {
                        return false;
                    }

                    j = k;
                }
            }

            if(j == i) {
                return false;
            }

            i = j;
            for(let k = 0; k <PROOFSIZE; k++) {
                if(k != j && us[k] == us[j]) {
                    if(i != j) {
                        return false;
                    }

                    i = k;
                }
            }

            
            if(i == j) {
                return false;
            }

            n-=2;
        } while(i != 0);

        return n == 0;
    }

    sipedge(nonce) {
        return new Edge(this.sipnode(nonce,0), this.sipnode(nonce,1));
    }

    sipnode(nonce, uorv) {
        return this.sip.uint(2*nonce + uorv) & NODEMASK;
    }
}

Cuckoo.SIZE = SIZE;
Cuckoo.HALFSIZE = HALFSIZE;
Cuckoo.NODEMASK = NODEMASK;
Cuckoo.PROOFSIZE = PROOFSIZE;
Cuckoo.SIZESHIFT = SIZESHIFT;
Cuckoo.DIFFICUTLY = DIFFICULTY;
Cuckoo.MAXPATHLEN = MAXPATHLEN;
module.exports = exports = {
    Cuckoo,
    Cuckoo64
};