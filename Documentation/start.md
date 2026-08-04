Since I know your goals (backend portfolio + DevOps + homelab deployment), I would not build a basic URL shortener like the hundreds of tutorials on YouTube.

I'd build one that demonstrates backend engineering, distributed systems concepts, observability, security, caching, Docker, CI/CD, and production deployment. A URL shortener is actually one of the best backend portfolio projects because companies like TinyURL, Bitly, Dub, and Short.io all solve variations of this problem.

Overall Architecture
                        Internet
                            │
                     Cloudflare DNS
                            │
                    Cloudflare Tunnel
                            │
                         Caddy
                            │
                    api.ritikkumar.dev
                            │
                    NestJS Application
                            │
         ┌──────────────────┼─────────────────┐
         │                  │                 │
         │                  │                 │
     PostgreSQL          Redis           Background Queue
         │                  │                 │
         │             Cache URLs         Analytics Jobs
         │                                   │
         └───────────────────────────────────┘
                         │
                     Grafana
                     Prometheus
                        Loki

Everything runs inside Docker Compose.

Tech Stack
Backend
NestJS
TypeScript
Prisma ORM
PostgreSQL
Redis
BullMQ
Zod Validation
JWT Authentication
Swagger
Infrastructure
Docker
Docker Compose
Caddy
Cloudflare Tunnel
GitHub Actions
GHCR
Prometheus
Grafana
Loki
Nice Extras

GeoIP lookup

Rate limiting

Caching

QR code generation

Custom domains

Click analytics

Expiration dates

Password protected URLs

Functional Requirements
Anonymous users

Create short URL

Redirect

View QR Code

Logged in users

Dashboard

Create links

Edit links

Delete links

Analytics

Custom aliases

Expiration

Password protection

API Keys

Admin

Manage users

Delete abuse

View metrics

Database Design
users
id
email
password_hash
name
created_at
links
id
user_id
short_code
original_url
title
expires_at
password_hash
is_active
clicks
created_at
updated_at
clicks
id
link_id
timestamp
country
city
device
browser
os
referrer
ip_hash

Notice:

Never store raw IPs.

Hash them.

Privacy-friendly.

api_keys
id
user_id
key_hash
created_at
last_used
API Design

Authentication

POST /auth/register

POST /auth/login

POST /auth/refresh

Links

POST /links

GET /links

PATCH /links/:id

DELETE /links/:id

GET /links/:id

Public

GET /:code

Redirects

Analytics

GET /analytics/:id

GET /analytics/:id/daily

GET /analytics/:id/countries

GET /analytics/:id/devices

QR Code

GET /qr/:code
Folder Structure
src/

 modules/

   auth/

   links/

   analytics/

   users/

   api-key/

   qr/

 common/

 config/

 database/

 redis/

 queue/

 middleware/

 filters/

 interceptors/

 decorators/

 guards/

 pipes/

 utils/

 main.ts
URL Creation Flow
Client

↓

POST /links

↓

Validate URL

↓

Generate unique shortcode

↓

Save into PostgreSQL

↓

Cache in Redis

↓

Return short URL
Redirect Flow

This is the important part.

GET /abc123

↓

Redis lookup

↓

Found?

YES

↓

Redirect immediately

↓

Queue analytics event

↓

Worker saves analytics


If Redis misses

↓

PostgreSQL

↓

Cache in Redis

↓

Redirect

↓

Queue analytics

Notice:

Analytics never blocks redirect.

The user gets redirected instantly.

Cache Strategy

Redis key

url:abc123

contains

{
originalUrl,
expires,
active
}

TTL

24 hours
Queue Design

BullMQ

Queues

analytics

cleanup

email


Analytics worker

save click

detect country

browser

OS

device

referrer

Cleanup worker

Delete expired URLs

every hour
Short Code Generation

Don't use random UUIDs.

Instead

Base62

0123456789

abcdefghijklmnopqrstuvwxyz

ABCDEFGHIJKLMNOPQRSTUVWXYZ

Example

aZ91bc

6–8 characters

Collision?

Retry.

Security

Helmet

CORS

Rate limiting

Validation

SQL injection prevention

Password hashing

JWT

Refresh tokens

API key hashing

Input sanitization

Open Redirect prevention

Rate Limiting

Anonymous

20 requests/min

Authenticated

100/min

API keys

1000/min
Logging

Pino

Every request

request id

latency

status

route

user


Logs

↓

Loki

↓

Grafana

Monitoring

Prometheus metrics

HTTP requests

Latency

Errors

Queue size

Redis hits

Redis misses


Grafana dashboards

CI/CD
Push

↓

GitHub Actions

↓

Tests

↓

Lint

↓

Build Docker Image

↓

Push GHCR

↓

SSH

↓

docker compose pull

↓

docker compose up -d

↓

Health Check

↓

Done
Docker Services
caddy

nestjs

postgres

redis

worker

prometheus

grafana

loki


Notice

Worker is a separate container.

Same codebase.

Different command.

api

worker
Environment
DATABASE_URL

REDIS_URL

JWT_SECRET

JWT_REFRESH_SECRET

BASE_URL

PORT

NODE_ENV

Background Jobs

Every hour

delete expired links

Every day

remove old analytics

compress tables

refresh cache
Possible Scaling

Single instance

↓

Redis

↓

Postgres

↓

Multiple NestJS instances

↓

Load Balancer

↓

Read replicas

↓

CDN

↓

Sharding

Even if you never implement all of these, designing with this in mind shows architectural thinking.

Deployment on Your Homelab

Based on your existing homelab setup, I'd deploy it like this:

Cloudflare
      │
Cloudflare Tunnel
      │
Caddy Reverse Proxy
      │
Docker Network
      │
┌────────────────────────────┐
│ URL Shortener API          │
│                            │
│ PostgreSQL                 │
│ Redis                      │
│ Worker                     │
│ Prometheus                 │
│ Grafana                    │
│ Loki                       │
└────────────────────────────┘

You could expose it on a subdomain such as:

go.ritikkumar.dev — public short links (e.g. go.ritikkumar.dev/abc123)
links.ritikkumar.dev — authenticated dashboard/API

This fits well with the Docker, Caddy, Cloudflare Tunnel, and GitHub Actions deployment pipeline you've already been building for your homelab.

Development Roadmap

I would build it in phases rather than trying to implement everything at once.

Phase	Goal
1	NestJS project setup, Docker Compose, PostgreSQL, Prisma, health checks
2	CRUD for links, Base62 short-code generation, redirects
3	Redis caching and cache invalidation
4	Authentication (JWT, refresh tokens) and user dashboard APIs
5	BullMQ worker for asynchronous click analytics
6	Rate limiting, validation, security hardening, structured logging
7	Prometheus metrics, Grafana dashboards, Loki log aggregation
8	GitHub Actions CI/CD, GHCR image publishing, automated homelab deployment
9	Advanced features: QR codes, custom aliases, expiring links, password protection, API keys
What this project demonstrates

A finished project like this shows much more than CRUD:

REST API design
Authentication and authorization
PostgreSQL schema design
Redis caching strategies
Background job processing
Docker and container orchestration
Reverse proxy configuration
CI/CD automation
Observability (logs, metrics, dashboards)
Production deployment practices
Performance and scalability considerations

For a backend-focused portfolio, this is the kind of project that gives you concrete topics to discuss in interviews beyond "I built a CRUD app." It demonstrates how you think about building and operating a service in production, not just writing endpoints.