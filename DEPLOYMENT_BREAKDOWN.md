# CI/CD Breakdown

This repo deploys a Next app to a self-hosted VPS with:

- GitHub Actions
- GHCR image registry
- Docker on VPS
- nginx reverse proxy in front of app

This file is the mental model + debug sheet.

## High Level Flow

1. You push to `main`.
2. GitHub Actions runs `.github/workflows/deploy.yml`.
3. Actions builds a Docker image from this repo.
4. Actions pushes that image to `ghcr.io`.
5. Actions SSHes into VPS.
6. VPS pulls the exact image digest that was just built.
7. VPS stops old `study-sesh` container.
8. VPS starts new `study-sesh` container on port `3000`.
9. nginx proxies public traffic to that app port.

Public request path:

`browser -> domain -> nginx -> docker container :3000 -> Next app`

Deploy path:

`git push -> GitHub Actions -> build image -> push GHCR -> ssh VPS -> docker pull/run`

## Workflow Breakdown

Source: [.github/workflows/deploy.yml](/Users/adrianwill/Dev/study-sesh/.github/workflows/deploy.yml)

### Job 1: `build-push`

This job:

- checks out repo
- sets up Docker build tools
- logs into GHCR
- builds image from `Dockerfile`
- pushes image as `ghcr.io/<repo>:latest`
- exposes the pushed image digest for next job

Important detail:

It deploys by digest, not just by tag.

That is good bc digest is immutable. It means VPS pulls the exact image built in that workflow run.

### Job 2: `deploy`

This job SSHes into the VPS and runs:

1. `docker pull ghcr.io/adriantwill/study-sesh@<digest>`
2. `docker stop study-sesh || true`
3. `docker rm study-sesh || true`
4. `docker run -d --name study-sesh -p 3000:3000 --restart unless-stopped ...`
5. `docker image prune -af`

Meaning:

- old container is deleted each deploy
- new container is recreated fresh each deploy
- app is reachable on VPS port `3000`
- nginx must proxy to that exact port

## Dockerfile Breakdown

Source: [Dockerfile](/Users/adrianwill/Dev/study-sesh/Dockerfile)

This is a multi-stage build.

### `deps` stage

Purpose:

- install `node_modules`
- install native build tools needed during install

### `builder` stage

Purpose:

- copy code
- inject build args for public Supabase env vars
- run `npm run build`

Important:

`NEXT_PUBLIC_*` vars are used at build time here.

If wrong/missing:

- client-side config can break
- built output can point at wrong Supabase project

### `runner` stage

Purpose:

- create lean production image
- install runtime system dep `poppler-utils`
- copy `.next/standalone`, static assets, and `public`
- run `node server.js`

This is the live app container.

## Runtime Env Model

There are 2 diff env buckets in your stack.

### Build-time env

Passed during image build:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

These are baked into built client/server output where Next needs them at build time.

### Runtime env

Passed in `docker run` on VPS:

- `HYPERBOLIC_API_KEY`

This exists only when container starts on VPS.

If app later needs more runtime secrets and they are not passed in `docker run`, features can fail even though deploy succeeded.

## nginx's Job

nginx is not your app. nginx is the traffic router in front.

Usually it does:

- listen on ports `80`/`443`
- terminate TLS
- proxy requests to `http://127.0.0.1:3000`

So:

- if nginx misroutes, users see `404`/`502`/`504` before Next even matters
- if nginx points to wrong port, app can be healthy but site still fails

### nginx config for this app

If this app only lives at `study.adrianwill.com`, nginx only needs to do 2 things:

- terminate TLS for `study.adrianwill.com`
- proxy all traffic to `localhost:3000`

Minimal shape:

```nginx
server {
    server_name study.adrianwill.com;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/study.adrianwill.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/study.adrianwill.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    listen 80;
    server_name study.adrianwill.com;
    return 301 https://$host$request_uri;
}
```

Notes:

- `client_max_body_size 100M` matters for large PDF uploads
- `300s` timeouts make sense here bc upload + PDF processing + AI calls can be slow
- `Upgrade` / `Connection upgrade` headers are optional for this app unless you know you need websocket-style upgrade behavior

Important:

If your port `80` server block does **not** include `study.adrianwill.com`, HTTP requests to the subdomain will not redirect to HTTPS correctly.

Also:

- a server block for `adrianwill.com` or `www.adrianwill.com` is separate from this app
- keep it only if you intentionally want nginx to handle those domains in the same config

## What A 404 Means In This Stack

A `404` means something answered, but said "not found".

In this stack there are 2 main sources:

### 1. nginx 404

Means nginx received request but config/server block/path rule did not match what you expected.

Common causes:

- wrong domain in nginx config
- default nginx site handling request instead of your app config
- bad `location` rules
- proxying wrong path prefix

### 2. Next app 404

Means request reached container, but Next has no route/page for that URL.

Common causes:

- missing `src/app/page.tsx`
- missing route folder
- wrong dynamic route path
- bad `basePath` or rewrites

## What A 500 Means In This Stack

A `500` means app code crashed or upstream dependency failed while handling a request.

Your log:

`Error processing slide Error: API error: 500 Internal Server Error`

That likely means:

- request reached app
- app called external API
- external API failed

That does **not** by itself explain site-wide `404`.

So `404` and that log are prob separate issues unless the only route you hit triggers that feature.

## Fast Debug Ladder

Run these in order on VPS.

### 1. Is container alive?

```bash
docker ps
```

You want:

- container named `study-sesh`
- status `Up ...`
- port mapping like `0.0.0.0:3000->3000/tcp`

### 2. Does app answer directly on VPS?

```bash
curl -I http://127.0.0.1:3000
curl -I http://localhost:3000
```

Interpretation:

- `200` or `307/308`: app is up, likely nginx issue
- `404`: Next is answering but route missing
- connection refused: container not serving or wrong port mapping

### 3. What does container log say?

```bash
docker logs study-sesh --tail 200
```

Look for:

- startup success
- Next listening on port `3000`
- app crashes
- missing env vars
- repeated upstream API failures

### 4. Is nginx routing to right place?

Check nginx site config. You want something close to:

```nginx
server {
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

If nginx points somewhere else, users never reach Next.

### 5. Is nginx itself returning the 404?

```bash
curl -I http://your-domain.com
curl -I http://127.0.0.1:3000
```

Compare results.

If domain returns `404` but localhost:3000 returns `200`, nginx is issue.

### 6. Is homepage route present?

Check:

- [src/app/page.tsx](/Users/adrianwill/Dev/study-sesh/src/app/page.tsx)

If `/` does not exist in app, Next will 404 even if deploy is healthy.

## Common Failure Modes

### Deploy succeeded, site 404s

Usually:

- nginx config wrong
- domain hits wrong server block
- app route missing

### Container up, domain 502/504

Usually:

- nginx cannot reach port `3000`
- container crashed after boot
- app listening on wrong interface/port

### Container up, app route works locally, domain still broken

Usually:

- nginx misconfig
- firewall/security group
- DNS/domain pointed wrong host

### App loads, but features fail

Usually:

- missing runtime env var
- upstream API failure
- DB/storage auth issue

### New deploy did not change behavior

Usually:

- old image still running
- nginx pointing to diff container/service
- workflow built one image but VPS pulled diff tag manually

In your workflow this is less likely bc deploy uses digest.

## Good Commands To Memorize

```bash
docker ps
docker logs study-sesh --tail 200
docker inspect study-sesh
curl -I http://127.0.0.1:3000
curl -I https://your-domain.com
sudo nginx -t
sudo systemctl status nginx
sudo tail -n 200 /var/log/nginx/error.log
sudo tail -n 200 /var/log/nginx/access.log
```

## How To Think About Diagnosis

Split stack into layers. Test one layer at a time.

### Layer 1: GitHub Actions

Question:

- did image build and push?

Evidence:

- workflow green
- digest produced

### Layer 2: VPS Docker

Question:

- did VPS pull and run correct image?

Evidence:

- `docker ps`
- `docker logs`
- `docker inspect`

### Layer 3: Next app

Question:

- does app answer on `127.0.0.1:3000`?

Evidence:

- `curl localhost:3000`

### Layer 4: nginx

Question:

- does public traffic reach app?

Evidence:

- compare domain response vs localhost:3000 response

### Layer 5: App dependencies

Question:

- do Supabase / Hyperbolic / storage calls work?

Evidence:

- app logs
- feature-specific failures

## Suggested Improvements Later

Not required, but useful.

### Add health check route

Example:

- `/api/health`

Return simple `200 ok`.

That makes it easy to separate:

- app alive
- app route issue
- proxy issue

### Add post-deploy verification

After `docker run`, workflow could SSH-run:

```bash
curl -f http://127.0.0.1:3000 || exit 1
```

That fails deploy if container is up but app not serving.

### Keep nginx config in repo

Then infra is versioned too.

### Log env assumptions

Document which vars are build-time vs runtime.

That avoids "deploy succeeded but feature broken" confusion.

## Short Mental Model

When debugging:

1. Is image built?
2. Is container running?
3. Does app answer on VPS port 3000?
4. Does nginx proxy to that port?
5. Are app dependencies failing after request reaches app?

If `localhost:3000` fails, debug app/container.

If `localhost:3000` works but domain fails, debug nginx/domain.

If page loads but actions fail, debug env vars or upstream APIs.
