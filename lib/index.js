'use strict';

const Siphash = require('./siphash');
const Hasher = require('./hasher');
const Edge = require('./edge');

const SIZESHIFT = 20;
const PROOFSIZE = 42;
const HALFSIZE = 1 << SIZESHIFT;
const SIZE = 1 << (SIZESHIFT + 1);
const NODEMASK = HALFSIZE - 1;

const DIFFICULTY = 50 * SIZE / 100;

class Cuckoo {
    constructor(data) {
        this.hdrkey = Hasher.hash(data);
        this.sip = new Siphash(this.hdrkey);
    }

    update(data) {
        this.hdrkey = Hasher.hash(data);
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
module.exports = exports = Cuckoo;