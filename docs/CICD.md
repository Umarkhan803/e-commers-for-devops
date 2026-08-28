# Nova Commerce — CI/CD Pipeline Guide

This document explains the **end-to-end CI/CD pipeline** for the Nova Commerce full-stack app: what runs, in what order, which tools are involved, and how a code change becomes a live Kubernetes release via GitOps.

---

## 1. What you get

| Capability | Tool | Role |
| ---------- | ---- | ---- |
| Continuous Integration | **GitHub Actions** | Build, validate, orchestrate every stage |
| Static code analysis | **SonarQube / SonarCloud** | Code quality, bugs, smells, security hotspots |
| Container security | **Trivy** | Scan Docker images for CRITICAL/HIGH CVEs before push |
| Image registry | **Docker Hub** | Store `e-commerce-api` and `e-commerce-web` images |
| Continuous Delivery (GitOps) | **Argo CD** | Sync cluster state from Git (`kubernetes/`) |

**Resume-aligned summary**

- End-to-end CI/CD with GitHub Actions: build → test/validate → Docker images → deploy path  
- SonarQube for static analysis; Trivy for image vulnerability scanning  
- Kubernetes releases via Argo CD using GitOps (manifests in Git are the source of truth)

---

## 2. High-level architecture

```text
┌─────────────┐     push / PR      ┌──────────────────────────────────────────┐
│  Developer  │ ─────────────────► │           GitHub (main / PR)             │
└─────────────┘                    └─────────────────┬────────────────────────┘
                                                     │
                                                     ▼
                                       ┌─────────────────────────┐
                                       │   GitHub Actions CI/CD  │
                                       │   .github/workflows/    │
                                       │        ci-cd.yml        │
                                       └───────────┬─────────────┘
                     ┌─────────────────────────────┼─────────────────────────────┐
                     ▼                             ▼                             ▼
            ┌────────────────┐          ┌─────────────────┐          ┌──────────────────┐
            │ 1. Quality     │          │ 2. SonarQube    │          │ 3. Build + Trivy │
            │ npm ci/build   │          │ scan + gate     │          │ Docker Hub push  │
            │ node --check   │          │ (opt-in)        │          │                  │
            └────────────────┘          └─────────────────┘          └────────┬─────────┘
                                                                              │
                                                                              ▼
                                                                 ┌──────────────────────┐
                                                                 │ 4. GitOps commit     │
                                                                 │ update image tags in │
                                                                 │ kubernetes/*.yaml       │
                                                                 │ [skip ci]            │
                                                                 └──────────┬───────────┘
                                                                            │
                                                                            ▼
                                                                 ┌──────────────────────┐
                                                                 │      Argo CD         │
                                                                 │ watches kubernetes/    │
                                                                 │ syncs cluster        │
                                                                 └──────────┬───────────┘
                                                                            │
                                                                            ▼
                                                                 ┌──────────────────────┐
                                                                 │   Kubernetes cluster │
                                                                 │   namespace:          │
                                                                 │   nova-commerce      │
                                                                 └──────────────────────┘
```

---

## 3. Pipeline stages (exactly what happens)

Workflow file: [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml)

### Triggers

| Event | Behavior |
| ----- | -------- |
| Pull request → `main` | Quality + (optional) Sonar + build + **Trivy** — **no** Docker push, **no** GitOps commit |
| Push to `main` | Full pipeline including push + GitOps tag update |
| Tag `v*` | Build/push with semver tags from `docker/metadata-action` |
| `workflow_dispatch` | Manual run |

Concurrency: one run per branch/ref; newer runs cancel older ones.

---

### Stage 1 — `quality` (Build & Validate)

**Purpose:** Fail fast if the app cannot install or build.

| Step | What happens |
| ---- | ------------ |
| Checkout | Clones the repo |
| Setup Node 22 | Matches Docker base image (`node:22-alpine`) |
| `npm ci` (frontend) | Clean install from lockfile |
| `npm run build` | Vite production build (`VITE_API_BASE_URL=/api/v1`) |
| `npm ci` (backend) | Clean install of API deps |
| `node --check` | Syntax-validates `server.js` / `app.js` |
| Upload artifact | Stores `frontend/dist` for 3 days (debug / audit) |

If this job fails, **nothing else runs** (no images, no deploy).

---

### Stage 2 — `sonarqube` (Static analysis)

**Purpose:** Improve code quality and catch issues before packaging.

| Step | What happens |
| ---- | ------------ |
| Full history checkout | `fetch-depth: 0` for accurate blame / new-code detection |
| Install deps | Gives the scanner a complete project graph |
| Sonar scan | Uses [`sonar-project.properties`](../sonar-project.properties) |
| Quality Gate | Blocks the pipeline if the gate fails |

**Opt-in:** This job runs only when the repository variable `ENABLE_SONARQUBE=true` is set.  
That lets the rest of the pipeline work before Sonar is configured.

Config highlights (`sonar-project.properties`):

- **Sources:** `backend/src`, `frontend/src`
- **Excludes:** `node_modules`, `dist`, seed data, public assets

---

### Stage 3 — `build-scan-push` (Docker + Trivy)

**Purpose:** Build production images, scan them, push only if scans pass.

Runs as a **matrix** for two images:

| Matrix name | Build context | Dockerfile | Docker Hub image |
| ----------- | ------------- | ---------- | ---------------- |
| `api` | `./backend` | `backend/Dockerfile` | `<user>/e-commerce-api` |
| `web` | `.` (repo root) | `nginx/Dockerfile` | `<user>/e-commerce-web` |

Flow per image:

1. **Build** with Buildx (GHA cache) and **load** into the runner (not push yet).
2. **Trivy** table scan — fails the job on **CRITICAL** or **HIGH** (unfixed ignored).
3. **Trivy** SARIF upload → GitHub **Security** tab (when available).
4. **Push** to Docker Hub — only on non-PR events (after scan success).

Image tags (via `docker/metadata-action`):

- `latest` — on `main`
- `sha-<7-char-git-sha>` — every build
- branch / PR / semver tags when applicable

**PR behavior:** build + Trivy only (images are not pushed).

---

### Stage 4 — `gitops-update` (Argo CD feed)

**Purpose:** Make Git the source of truth for what the cluster should run.

Runs only on **successful** `main` builds (not on PRs).

1. Computes tag `sha-<short-sha>`.
2. Updates:
   - `kubernetes/api-deploy.yaml` → `image: <user>/e-commerce-api:sha-...`
   - `kubernetes/web-deploy.yaml` → `image: <user>/e-commerce-web:sha-...`
   - `kubernetes/kustomization.yaml` → matching `newTag` values
3. Commits with message containing **`[skip ci]`** so the bot commit does not re-trigger the pipeline.
4. Pushes to `main`.

**Argo CD** (already watching `kubernetes/`) detects the Git change and syncs the cluster — rolling out new pods with the new digests/tags.

---

## 4. GitOps with Argo CD

### Why GitOps here?

| Without GitOps | With Argo CD |
| -------------- | ------------ |
| CI runs `kubectl apply` (push deploy) | CI only updates Git; cluster pulls desired state |
| Cluster can drift from manifests | Argo **self-heals** drift |
| Hard to audit “who deployed what” | Every release is a Git commit |

### Manifests

| Path | Role |
| ---- | ---- |
| [`argocd/application.yaml`](../argocd/application.yaml) | Argo `Application` pointing at `kubernetes/` on `main` |
| [`argocd/project.yaml`](../argocd/project.yaml) | Optional tighter `AppProject` |
| [`kubernetes/kustomization.yaml`](../kubernetes/kustomization.yaml) | Bundles all K8s resources + image tags |
| `kubernetes/*-deploy.yaml` etc. | Deployments, Services, ConfigMaps, PVCs |

### One-time cluster setup

```bash
# 1) Install Argo CD (example)
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 2) Register this app
kubectl apply -f argocd/project.yaml      # optional
kubectl apply -f argocd/application.yaml

# 3) Open UI (port-forward)
kubectl -n argocd port-forward svc/argocd-server 8080:443
```

Argo settings used in `application.yaml`:

- **Automated sync** — apply Git changes without clicking Sync  
- **Prune** — delete cluster resources removed from Git  
- **Self-heal** — revert manual `kubectl` drift  
- **CreateNamespace** — ensure `nova-commerce` exists  

Update `repoURL` in `argocd/application.yaml` if your fork URL differs.

---

## 5. Secrets & variables to configure

### GitHub Actions → Settings → Secrets and variables → Actions

| Secret | Required | Used for |
| ------ | -------- | -------- |
| `DOCKERHUB_USERNAME` | **Yes** | Image path + login |
| `DOCKERHUB_TOKEN` | **Yes** | Docker Hub push |
| `SONAR_TOKEN` | If Sonar enabled | SonarQube / SonarCloud auth |
| `SONAR_HOST_URL` | If Sonar enabled | e.g. `https://sonarcloud.io` or your server URL |

### Repository variables

| Variable | Value | Effect |
| -------- | ----- | ------ |
| `ENABLE_SONARQUBE` | `true` | Turns on the Sonar job + quality gate |

### SonarCloud quick setup

1. Create project at [sonarcloud.io](https://sonarcloud.io) (or use self-hosted SonarQube).  
2. Set `sonar.projectKey` / org in `sonar-project.properties` if your key differs.  
3. Add `SONAR_TOKEN` + `SONAR_HOST_URL=https://sonarcloud.io`.  
4. Set `ENABLE_SONARQUBE=true`.

---

## 6. Local / cluster verification

### After a successful main pipeline

```bash
# Images on Docker Hub
#   <user>/e-commerce-api:sha-<sha>
#   <user>/e-commerce-web:sha-<sha>

# Argo CD status
argocd app get nova-commerce
argocd app sync nova-commerce   # only if automation is off

# Cluster workloads
kubectl -n nova-commerce get pods,deploy,svc
kubectl -n nova-commerce describe deploy api web
```

### Storefront access (current NodePort)

- Web Service maps host **NodePort 31000** → container 80 (see `kubernetes/web-services.yaml`).  
- API is NodePort on container 4000 (dynamic nodePort unless fixed).

---

## 7. Repository layout (CI/CD related)

```text
nova-commerce/
├── .github/workflows/ci-cd.yml    # Full pipeline
├── sonar-project.properties       # SonarQube project definition
├── .trivyignore                   # Optional CVE allowlist
├── argocd/
│   ├── application.yaml           # Argo CD Application (GitOps)
│   └── project.yaml               # Optional AppProject
├── kubernetes/                    # Desired cluster state (Argo watches this)
│   ├── kustomization.yaml
│   ├── api-*.yaml
│   ├── web-*.yaml
│   ├── mongo-*.yaml
│   └── redis-*.yaml
├── backend/Dockerfile             # API image
├── nginx/Dockerfile               # Web (React build + Nginx) image
└── docs/CICD.md                   # This guide
```

---

## 8. Typical developer journey

1. Create a feature branch and open a **PR** to `main`.  
2. CI runs **quality** → optional **Sonar** → **build + Trivy** (no push).  
3. Fix any build / Sonar gate / CRITICAL-HIGH CVE failures.  
4. Merge to **main**.  
5. CI rebuilds, rescans, **pushes** images, commits new tags to `kubernetes/`.  
6. **Argo CD** syncs; pods roll to the new `sha-…` images.  
7. Verify via Argo UI or `kubectl`.

---

## 9. Failure modes (how to read them)

| Failure | Meaning | What to do |
| ------- | ------- | ---------- |
| `quality` failed | Frontend build or backend syntax broken | Fix code locally (`npm run build`, `node --check`) |
| `sonarqube` Quality Gate | Code quality below policy | Open Sonar UI, fix blockers/coverage rules |
| Trivy `exit-code: 1` | CRITICAL/HIGH CVE in image | Upgrade base image / deps; or document in `.trivyignore` if accepted |
| Docker login/push failed | Bad Hub credentials | Rotate `DOCKERHUB_TOKEN` |
| GitOps commit no change | Manifests already at that tag | Re-run or check sed/python patch output |
| Argo OutOfSync / Degraded | Cluster ≠ Git or pods unhealthy | `argocd app get`, pod logs, probes, secrets |

---

## 10. Security notes

- Prefer **not** committing real Mongo/JWT secrets in `kubernetes/api-secret.yaml`. Use Sealed Secrets, External Secrets, or create the Secret out-of-band.  
- Trivy SARIF lands in GitHub **Security** for triage.  
- Pipeline uses least privilege: `contents: write` only on the GitOps job; image push uses Hub token secret.  
- `[skip ci]` on the bot commit prevents infinite CI loops.

---

## 11. Resume / interview talking points

You can describe the system as:

> “I designed an end-to-end CI/CD pipeline with GitHub Actions that validates the React and Express apps, runs SonarQube static analysis, builds Docker images for the API and Nginx/SPA, and blocks promotion when Trivy finds CRITICAL/HIGH vulnerabilities. Successful main builds push images to Docker Hub and update Kubernetes manifests in Git; Argo CD applies GitOps so the cluster continuously converges to the versioned desired state.”

That maps 1:1 to the jobs in `ci-cd.yml` and the Argo Application under `argocd/`.
