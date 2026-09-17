import { generateShortCode } from "./base62.util";

describe('Base62 Utility', () => {
    // test 1 : checking if the default length is correct

    it('should generate a string of exactly 6 characters by default', () => {
        const code = generateShortCode();

        expect(code.length).toBe(6);
    })
})