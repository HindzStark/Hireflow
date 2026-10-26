# 10 · Infrastructure & DevOps

**Order: development first, infra later.**
- **Now (the 5 hours):** Docker Compose runs only the *infrastructure* (Postgres, Kafka, kafka-ui). Your services and web app run with `pnpm dev` (hot reload).
- **Later (Phase C):** package everything for **Kubernetes on kind**, with **Helm** charts and **Terraform** for a one-command setup.

---

## 1. Now: Docker Compose (development)

| Container | Image | Ports | Purpose |
|---|---|---|---|
| postgres | `postgres:16-alpine` | 5432 | one server, 4 databases (init script) |
| kafka | `apache/kafka:3.8.0` (KRaft mode, no ZooKeeper) | 9092 | event broker |
| kafka-ui | `provectuslabs/kafka-ui` | **8080** | see topics and messages in the browser (great for the demo) |

`infra/docker/postgres-init.sql`
```sql
CREATE DATABASE auth_db;
CREATE DATABASE job_db;
CREATE DATABASE candidate_db;
CREATE DATABASE interview_db;
-- later: offer_db, notification_db, reporting_db
```

`docker-compose.yml` (sketch)
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment: { POSTGRES_USER: hireflow, POSTGRES_PASSWORD: hireflow }
    ports: ["5432:5432"]
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./infra/docker/postgres-init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck: { test: ["CMD-SHELL", "pg_isready -U hireflow"], interval: 5s, retries: 10 }

  kafka:
    image: apache/kafka:3.8.0
    ports: ["9092:9092"]
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093,INTERNAL://:29092
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092,INTERNAL://kafka:29092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,CONTROLLER:PLAINTEXT,INTERNAL:PLAINTEXT
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_INTER_BROKER_LISTENER_NAME: INTERNAL
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
      KAFKA_NUM_PARTITIONS: 3

  kafka-ui:
    image: provectuslabs/kafka-ui:v0.7.2
    ports: ["8080:8080"]
    environment:
      KAFKA_CLUSTERS_0_NAME: hireflow
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:29092
    depends_on: [kafka]

volumes: { pgdata: {} }
```
> Two listeners: your services on your laptop connect to `localhost:9092`, while containers (kafka-ui) use `kafka:29092`. This is the most common Kafka-in-Docker gotcha.

### Run it
```
docker compose up -d          # postgres + kafka + kafka-ui
pnpm install
pnpm db:migrate               # prisma migrate in each service
pnpm db:seed                  # seed in order: auth → job → candidate → interview
pnpm dev                      # web :3000, gateway :4000, services :4001–4004
```
Open: app http://localhost:3000 · health http://localhost:4000/api/v1/health · kafka-ui http://localhost:8080

### `.env.example`
```
NODE_ENV=development
WEB_URL=http://localhost:3000
GATEWAY_PORT=4000
AUTH_URL=http://localhost:4001
JOB_URL=http://localhost:4002
CANDIDATE_URL=http://localhost:4003
INTERVIEW_URL=http://localhost:4004

AUTH_DATABASE_URL=postgresql://hireflow:hireflow@localhost:5432/auth_db
JOB_DATABASE_URL=postgresql://hireflow:hireflow@localhost:5432/job_db
CANDIDATE_DATABASE_URL=postgresql://hireflow:hireflow@localhost:5432/candidate_db
INTERVIEW_DATABASE_URL=postgresql://hireflow:hireflow@localhost:5432/interview_db

KAFKA_BROKERS=localhost:9092
JWT_SECRET=change-me-at-least-32-characters-long
INTERNAL_TOKEN=change-me-internal-secret
```

### Root scripts
```
pnpm dev | build | test | lint | typecheck
pnpm db:migrate | db:seed | db:reset     # run across all services
```

---

## 2. Later: Kubernetes in 5 minutes (for beginners)

| Concept | Meaning | HireFlow example |
|---|---|---|
| **Cluster** | A group of machines running containers for you | the kind cluster on your laptop |
| **kind** | "Kubernetes IN Docker": a real k8s cluster running as Docker containers locally | `kind create cluster --name hireflow` |
| **Pod** | The smallest unit: one running container (sometimes a few) | one candidate-service process |
| **Deployment** | "Keep N copies of this pod running; replace crashed ones; roll out new versions" | `candidate-service` with 1–2 replicas |
| **Service** | A stable internal name + port for a set of pods | `http://candidate-service:4003` |
| **Ingress** | The front door from outside the cluster (routes by host/path) | `hireflow.localhost/` → web, `/api` → gateway |
| **ConfigMap / Secret** | Configuration / passwords given to pods as env vars | `KAFKA_BROKERS`, `JWT_SECRET` |
| **Probe** | k8s calls `/health`; restarts or holds traffic from unhealthy pods | our `/health` endpoint |
| **Helm** | A package manager / templating for k8s YAML | one chart reused for all services |
| **Operator** | A k8s add-on that manages complex software for you | **Strimzi** runs Kafka |

**Docker Compose vs Kubernetes:** Compose runs containers on one machine for development. Kubernetes runs and *heals* them in production-style clusters. The same Docker images work in both.

## 3. Later: Phase C plan (kind + Helm + Strimzi + Terraform)

```mermaid
flowchart LR
    U((Browser)) --> ING[ingress-nginx<br/>hireflow.localhost]
    ING -->|/| WEB[web pod]
    ING -->|/api| GW[gateway pod]
    GW --> SVC[auth · job · candidate · interview pods]
    SVC --> PG[(Postgres<br/>Bitnami chart)]
    SVC --> K[Kafka<br/>Strimzi operator]
    KUI[kafka-ui] --> K
```

### Step by step
| Step | What | Command |
|---|---|---|
| 1 | Dockerfile per service (multi-stage: build → small runtime image) | `docker build -t hireflow/candidate-service:dev …` |
| 2 | Create the kind cluster with ports 80/443 mapped | `kind create cluster --config infra/kind/cluster.yaml` |
| 3 | Load images into kind (no registry needed) | `kind load docker-image hireflow/candidate-service:dev --name hireflow` |
| 4 | Install the platform: ingress-nginx, Strimzi + a 1-broker `Kafka` resource, Postgres, kafka-ui | `helm install …` |
| 5 | Deploy the services with the generic chart | `helm upgrade --install candidate-service deploy/helm/hireflow-service -f deploy/helm/values/candidate-service.yaml` |
| 6 | Open http://hireflow.localhost | — |

### Generic Helm chart (one chart, many services)
```
deploy/helm/
  hireflow-service/             # used by EVERY service (same idea as services/_template)
    Chart.yaml
    values.yaml                 # defaults: replicas 1, port, probes on /health, resources
    templates/
      deployment.yaml           # + initContainer: prisma migrate deploy
      service.yaml
      configmap.yaml
      secret.yaml
  values/
    gateway.yaml  auth-service.yaml  job-service.yaml  candidate-service.yaml  interview-service.yaml  web.yaml
```
Example `values/candidate-service.yaml`:
```yaml
name: candidate-service
image: hireflow/candidate-service:dev
port: 4003
env:
  KAFKA_BROKERS: hireflow-kafka-kafka-bootstrap.kafka:9092    # Strimzi service name
  DATABASE_URL: postgresql://hireflow:hireflow@postgres-postgresql:5432/candidate_db
```

### Terraform for one-command setup (targets kind, not a cloud)
```
infra/terraform/
  providers.tf   # tehcyx/kind, hashicorp/helm, hashicorp/kubernetes
  cluster.tf     # kind_cluster "hireflow" (with port mappings 80/443)
  platform.tf    # helm_release: ingress-nginx, strimzi-kafka-operator, postgresql, kafka-ui
                 # kubernetes_manifest: Strimzi Kafka + KafkaNodePool (1 broker, KRaft)
  apps.tf        # helm_release for_each over var.services → deploy/helm/hireflow-service
  variables.tf   # services = { gateway = { port = 4000 }, auth-service = { port = 4001 }, … }
```
```
make images           # docker build all + kind load
cd infra/terraform && terraform init && terraform apply     # cluster + platform + apps
terraform destroy     # remove everything
```
Adding a service later = one line in `var.services` + one values file.

### Later still (future ideas)
Managed cloud (EKS + MSK or Confluent Cloud), Argo CD (GitOps), HPA autoscaling, Prometheus/Grafana.

## 4. Security checklist
- [ ] Only the gateway (and web) are reachable from outside; services are internal
- [ ] `/internal/*` requires `x-internal-token` and is never routed by the gateway
- [ ] httpOnly cookie; CORS only for `WEB_URL`; `helmet()` on Express
- [ ] Zod validation on every route **and every consumed event**
- [ ] Secrets only in `.env` (git-ignored) / k8s Secrets
