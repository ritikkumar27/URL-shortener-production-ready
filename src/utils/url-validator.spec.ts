import { validateTargetUrl } from './url-validator';
import { BadRequestException } from '@nestjs/common';

describe('URL Validator Utility', () => {

  // Test 1: Valid URL
  it('should return the parsed URL string for valid HTTP/HTTPS URLs', () => {
    const url1 = validateTargetUrl('https://google.com');
    const url2 = validateTargetUrl('http://my-website.com/path?query=123');

    // It should just return the URL back if it's safe
    expect(url1).toBe('https://google.com/');
    expect(url2).toBe('http://my-website.com/path?query=123');
  });

  // Test 2: Testing Exceptions (Invalid Formats)
  it('should throw a BadRequestException if the URL format is complete garbage', () => {

    expect(() => {
      validateTargetUrl('not-a-real-url');
    }).toThrow(BadRequestException);
    
    expect(() => {
      validateTargetUrl('www.google.com'); 
    }).toThrow(BadRequestException);
  });

  // Test 3: Testing Restricted Protocols
  it('should throw an error if the protocol is not HTTP or HTTPS', () => {
    expect(() => {
      validateTargetUrl('ftp://server.com/file.zip');
    }).toThrow('Only HTTP and HTTPS protocols are supported');
    
    expect(() => {
      validateTargetUrl('javascript:alert(1)');
    }).toThrow('Only HTTP and HTTPS protocols are supported');
  });

  // Test 4: Testing SSRF Protection (Blocked Hostnames)
  it('should block internal and restricted hostnames', () => {
    const badUrls = [
      'http://localhost:3000',
      'http://127.0.0.1/admin',
      'https://192.168.1.100', // Private IP
      'http://host.docker.internal/api',
      'http://my-server.local' // Ends with .local
    ];


    badUrls.forEach((badUrl) => {
      expect(() => {
        validateTargetUrl(badUrl);
      }).toThrow('Target URL points to a restricted host or internal network');
    });
  });

});