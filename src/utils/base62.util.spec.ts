import { generateShortCode } from "./base62.util";

describe('Base62 Utility', () => {

    // test 1 : checking if the default length is correct

    it('should generate a string of exactly 6 characters by default', () => {
        const code = generateShortCode();

        expect(code.length).toBe(6);
    });

    // test 2 : checking if the custom code length works

    it('should generate a string of 8 characters when passed 8', () => {
        const code = generateShortCode();
        expect(code.length).toBe(8);
    });


    //test 3 : ensuring shorcode contains valid charactes

    it('should only contain alphanumeric characters', () => {
        const code = generateShortCode();
        const isValid = /^[a-zA-z0-9]+$/.test(code);

        expect(isValid).toBe(true);
    });





})