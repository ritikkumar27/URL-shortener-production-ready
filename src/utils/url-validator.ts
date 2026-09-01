import { BadRequestException } from '@nestjs/common';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'host.docker.internal',
]);

<<<<<<< HEAD
const PRIVATE_IP_REGEX =
  /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})$/;

// validating if target url has a valid link protocol and does not target subnets or local hosts
=======
const PRIVATE_IP_REGEX = /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})$/;
>>>>>>> fresh

export function validateTargetUrl(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new BadRequestException('Invalid URL format');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
<<<<<<< HEAD
    throw new BadRequestException(
      'Only http and https protocols are supported',
    );
=======
    throw new BadRequestException('Only HTTP and HTTPS protocols are supported');
>>>>>>> fresh
  }

  const hostname = parsed.hostname.toLowerCase();

<<<<<<< HEAD
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    PRIVATE_IP_REGEX.test(hostname) ||
    hostname.endsWith('.local')
  ) {
    throw new BadRequestException(
      'Target URL points to a restricted host or internal network',
    );
  }

  return parsed.toString();
}
=======
  if (BLOCKED_HOSTNAMES.has(hostname) || PRIVATE_IP_REGEX.test(hostname) || hostname.endsWith('.local')) {
    throw new BadRequestException('Target URL points to a restricted host or internal network');
  }

  return parsed.toString();
}
>>>>>>> fresh
