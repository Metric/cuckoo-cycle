'use strict';

class Hasher {
    static toHex(bytes) {
        return Array.prototype.map.call(bytes, (b) => {
            return ('0' + (b & 0xFF).toString(16)).slice(-2);
        }).join('');
    }

    static utf8ToBytes(d) {
        let out = [], p = 0;
        for (let i = 0; i < d.length; i++) {
          let c = d.charCodeAt(i);
          if (c < 128) {
            out[p++] = c;
          } else if (c < 2048) {
            out[p++] = (c >> 6) | 192;
            out[p++] = (c & 63) | 128;
          } else if (
              ((c & 0xFC00) == 0xD800) && (i + 1) < d.length &&
              ((d.charCodeAt(i + 1) & 0xFC00) == 0xDC00)) {
            // Surrogate Pair
            c = 0x10000 + ((c & 0x03FF) << 10) + (d.charCodeAt(++i) & 0x03FF);
            out[p++] = (c >> 18) | 240;
            out[p++] = ((c >> 12) & 63) | 128;
            out[p++] = ((c >> 6) & 63) | 128;
            out[p++] = (c & 63) | 128;
          } else {
            out[p++] = (c >> 12) | 224;
            out[p++] = ((c >> 6) & 63) | 128;
            out[p++] = (c & 63) | 128;
          }
        }
        return new Uint8Array(out);
    }

    static hexToBytes(hex) {
        const result = [];
        while(hex.length >= 2) {
            result.push(parseInt(hex.substring(0,2), 16));
            hex = hex.substring(2, hex.length);
        }
        return new Uint8Array(result);
    }

    static hash(data) {
        return Hasher.toHex(nacl.hash(data));
    }

    /**
     * sign should be the signature in hex format
     * key is the public key in hex format
     */
    static verify(message, sign, key) {
        return nacl.sign.detached.verify(Hasher.utf8ToBytes(message), Hasher.hexToBytes(sign), Hasher.hexToBytes(key));
    }

    /**
     * key is private key and should also be in hex format
     */
    static sign(message, key) {
        return Hasher.toHex(nacl.sign.detached(Hasher.utf8ToBytes(message), Hasher.hexToBytes(key))).toLowerCase();
    }

    static keypair() {
        const pair = nacl.sign.keyPair();
        return {
            public: Hasher.toHex(pair.publicKey).toLowerCase(),
            private: Hasher.toHex(pair.secretKey).toLowerCase()
        };
    }
}