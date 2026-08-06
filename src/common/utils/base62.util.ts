import { randomBytes } from "crypto";

const BASE62_CHARSET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const RESERVED_SLUGS = new Set([
    'api',
    'docs',
    'health',
    'auth',
    'links',
    'analytics',
    'users',
    'admin',
    'dashboard',
    'qr',
    'favicon.ico',
    'robots.txt',
]);

export class Base62 {
    // generate a random base62 short code of specific length - 6

    static generate(length = 6): string {
        const bytes = randomBytes(length);
        let result = '';
        for(let i = 0; i<length; i++){
            result += BASE62_CHARSET[bytes[i] % BASE62_CHARSET.length];
        }
        return result;
    }

    static isReserved(slug: string): boolean {
        return RESERVED_SLUGS.has(slug.toLowerCase().trim());
    }
}