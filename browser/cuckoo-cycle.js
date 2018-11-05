'use strict';

(function(w) {

const MAXPATHLEN = 4096;
const SIZESHIFT = 20;
const PROOFSIZE = 42;
const HALFSIZE = 1 << SIZESHIFT;
const SIZE = 1 << (SIZESHIFT + 1);
const NODEMASK = HALFSIZE - 1;

const DIFFICULTY = 50 * SIZE / 100;

class Edge {
    constructor(x,y) {
        this.u = x;
        this.v = y;
    }

    equals(e) {
        return e.u === this.u && e.v === this.v;
    }
}

const hash = (d) => {
    return w.nacl.hash(Hasher.utf8ToBytes(d));
};


/////
///// This is a 32bit implementation of Siphash-2-4 for producing integers
///// With modification to draw the key from a 32 byte key or greater
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

    //expects an array of at least 64 bytes
    updateKey(key) {
        if(key.length < 64) throw new Error('key byte array length must be at least 64 bytes');

        this.k[0] = u8to32(key, 0) ^ u8to32(key, 4) ^ u8to32(key, 8) ^ u8to32(key, 12);
        this.k[1] = u8to32(key, 16) ^ u8to32(key, 20) ^ u8to32(key, 24) ^ u8to32(key, 28);
        this.k[2] = u8to32(key, 32) ^ u8to32(key, 36) ^ u8to32(key, 40) ^ u8to32(key, 44);
        this.k[3] = u8to32(key, 48) ^ u8to32(key, 52) ^ u8to32(key, 56) ^ u8to32(key, 60);
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

class Cuckoo {
    constructor(data) {
        this.hdrkey = hash(data);
        this.sip = new Siphash(this.hdrkey);
    }

    updateKey(data) {
        this.hdrkey = hash(data);
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

w.Cuckoo = Cuckoo;

class Solver {
    constructor(hdr, en) {
        this.graph = new Cuckoo(hdr);
        this.easiness = en;
        this.solution = new Uint32Array(PROOFSIZE);
        this.cuckoo = new Uint32Array(1+SIZE);
    }

    updateKey(key) {
        this.graph.updateKey(key);
        this.reset();
    }

    reset() {
        //clear cuckoo out
        //this is more efficient than recreating the 
        //Uint32Array from scratch
        //also saves from garbage collection
        for(let i = 0; i < this.cuckoo.length; i++) {
            this.cuckoo[i] = 0;
        }
    }

    path(u, us) {
        const cuckoo = this.cuckoo;
        let nu = 0;
        for(nu = 0; u != 0; u = cuckoo[u]) {
            if(++nu >= MAXPATHLEN) {
                //just return out of bounds
                return -1;
            }
            us[nu] = u;
        }
        return nu;
    }

    find(us, nu, vs, nv) {
        const cycle = [];
        let easiness = this.easiness;

        let n = 0;
        cycle.push(new Edge(us[0],vs[0] - HALFSIZE));
        while(nu-- > 0) {
            cycle.push(new Edge(us[(nu+1)&~1],us[nu|1] - HALFSIZE));
        }
        while(nv-- > 0) {
            cycle.push(new Edge(vs[nv|1],vs[(nv+1)&~1] - HALFSIZE));
        }
        for(let nonce = n = 0; nonce < easiness; nonce++) {
            const e = this.graph.sipedge(nonce);
            const idx = cycle.findIndex((o) => { return e.equals(o); });

            if(idx > -1) {
                this.solution[n++] = nonce;
                cycle.splice(idx,1);

                if(n == PROOFSIZE) {
                    break;
                }
            }
        }
        if(n == PROOFSIZE) {
            return this.solution;
        }

        return false;
    }
}

class SimpleMiner {
    constructor(solver, index, total) {
        this.solve = solver;
        this.id = index || 0;
        this.total = total || 1;
        this.vs = new Uint32Array(MAXPATHLEN);
        this.us = new Uint32Array(MAXPATHLEN);
    }

    run() {
        const us = this.us, vs = this.vs;
        
        //reset path buffers
        //this is more efficient than recreating
        //the uint32 array
        for(let i = 0; i < MAXPATHLEN; i++) {
            us[i] = 0;
            vs[i] = 0;
        }
        
        const cuckoo = this.solve.cuckoo;
        const solve = this.solve;
        for(let nonce = this.id; nonce < solve.easiness; nonce+=this.total) {
            
            let u0 = solve.graph.sipnode(nonce, 0);
            let v0 = solve.graph.sipnode(nonce, 1) + HALFSIZE;

            let u = cuckoo[u0];
            let v = cuckoo[v0];

            vs[0] = v0;
            us[0] = u0;

            if(u == vs[0] || v == us[0]) continue;

            let nu = solve.path(u, us);
            let nv = solve.path(v, vs);

            //out of bounds? exit early
            if(nu == -1 || nv == -1) {
                return false;
            }

            if(us[nu] == vs[nv]) {
                let min = nu < nv ? nu : nv;
                for(nu -= min, nv -= min; us[nu] != vs[nv]; nu++, nv++);
                let len = nu + nv + 1;
                //const perc = (nonce*100/solve.easiness)
                if(len == PROOFSIZE) {
                    const sol = solve.find(us,nu,vs,nv);
                    if(sol) {
                        return sol;
                    }
                }
            }
            else if(nu < nv) {
                while(nu-- > 0) {
                    cuckoo[us[nu+1]] = us[nu];
                }
                cuckoo[u0] = v0;
            }
            else {
                while(nv-- > 0) {
                    cuckoo[vs[nv+1]] = vs[nv];
                }
                cuckoo[v0] = u0;
            }
        }

        return false;
    }
}

w.Solver = Solver;
w.SimpleMiner = SimpleMiner;

})(self);
