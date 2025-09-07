Prompt: Generate a full-stack enterprise-ready system (with Ansible deploy)

Goal: Generate a complete, modular, production-ready repository that builds and deploys:
	•	React (TypeScript + Vite) frontend with Login/Signup, token management (generate/export tokens up to 4 hours), CRUD UI for projects including JSON fields editing, and RBAC-aware UI flows.
	•	Go backend services (REST/HTTP) that implement CRUD for projects, authentication (signup/login), API token generation/validation/expiration, RBAC enforcement, OpenAPI v3.0 generation, and OpenTelemetry-compliant logging.
	•	PostgreSQL 15 containerized database with a projects table (residential-project oriented fields + JSON fields), loaded with 100 realistic dummy records.
	•	An mcp server (Management/Control Proxy) that aggregates all APIs and exposes a consolidated API surface; includes configuration suitable for integration with Claude Desktop (provide an example configuration file and instructions to wire credentials safely).
	•	A Kubernetes deployment target using a kind cluster configured with Cilium CNI, 2 nodes; if a cluster named kind-hello-01 already exists, reuse it. All applications are containerized and deployed to this cluster.
	•	Persistent volume for PostgreSQL named project-data-0001 (create PVC and PV manifest appropriate for kind).
	•	Generate OpenAPI v3.0 specification files for all public APIs.
	•	Security-related observations and findings written to security-observations/ directory.
	•	Use enterprise-grade logging with OpenTelemetry format; logs must be emitted via a standard logging library and exported to OTLP collector endpoint. Provide both local development and cluster deployment configurations.
	•	RBAC roles: superuser, sysadmin, localadmin, user, guest — implement enforcement in order of priority (superuser highest). Provide role seed data and examples for tests.
	•	Provide an Ansible-based deployment capability to provision and deploy the entire system to a remote Ubuntu server (install prerequisites, create or reuse kind on the remote host, deploy Cilium, and apply Kubernetes manifests).

⸻

Requirements to produce
	1.	Repository layout (high-level)

repo-root/
├─ frontend/                      # React + TypeScript + Vite
├─ backend/                       # Go services (auth, projects, mcp)
│  ├─ cmd/
│  ├─ internal/
│  ├─ api/                         # OpenAPI-generated handlers / specs
│  ├─ migrations/                  # SQL migrations (sqlc or goose/fluent)
│  └─ Dockerfile
├─ infra/
│  ├─ kind/                        # kind cluster provisioning manifests + scripts
│  ├─ k8s/                         # Kubernetes manifests / Helm charts
│  ├─ storage/                     # PV/PVC definitions (project-data-0001)
│  ├─ otel/                        # OpenTelemetry collector manifests
│  └─ ansible/                     # Ansible playbooks & roles for remote Ubuntu deploy
├─ scripts/
│  ├─ seed_projects.go             # generates 100 dummy records and inserts into Postgres
│  └─ local_dev.sh                 # starts containers locally with docker-compose
├─ openapi/                        # generated OpenAPI v3.0 JSON/YAML
├─ security-observations/          # security notes and remediation suggestions
├─ docs/
│  ├─ architecture.md
│  └─ deployment.md
├─ ansible/                        # top-level Ansible playbooks + inventory example
└─ README.md

	2.	Frontend

	•	Stack: React + TypeScript + Vite, React Router, Zustand (or Redux) for state, Tailwind CSS for UI (choose one and be consistent).
	•	Pages/components:
	•	Signup, Login (username/email + password)
	•	Token management page: generate API token (server creates JWT or opaque token with 4-hour expiration), export token (download as file), list active tokens, revoke/expire token.
	•	Projects list, Project create/edit/delete, Project detail with raw JSON editor for JSON fields (use a code editor component like monaco or react-ace for JSON fields).
	•	Admin console to manage users/roles (assign roles from the 5 RBAC roles).
	•	Auth behavior: store the session (short lived) in memory and persist API token in secure storage only when user explicitly exports; use Authorization: Bearer  header for API calls.
	•	Provide environment variable-driven API base URL and build scripts.

	3.	Backend (Go)

	•	Stack: Go 1.21+, Gin HTTP router, pgx or GORM for DB access (prefer sqlc + pgx for type-safety), Casbin for RBAC enforcement, zap for structured logging, OpenTelemetry instrumentation and OTLP exporter.
	•	Microservices/org:
	•	auth service: signup, login, session, API-token generation and management (create, list, revoke). Tokens expire at 4 hours by default and must be enforced server-side. Provide refresh-token flow if needed for UI sessions; API tokens are separate and have the 4-hour limit.
	•	projects service: CRUD endpoints for projects table. All endpoints require a valid API token in Authorization header except signup/login. Enforce RBAC per endpoint: e.g., create/update/delete require at least localadmin (or higher) except superuser/sysadmin who always succeed.
	•	mcp server: single entrypoint that mirrors/aggregates these services, exposes consolidated OpenAPI, and acts as reverse-proxy with TLS termination optional for cluster deployment. Include an example claude-desktop.yaml snippet showing endpoint, token usage, and recommended security settings.
	•	Security:
	•	Passwords hashed with argon2id and salted.
	•	Validate JSON fields against optional JSON Schema if provided.
	•	Inputs validated & parameterized queries to avoid SQL injection.
	•	All security observations logged to security-observations/ with timestamps and trace IDs.

	4.	Database (PostgreSQL 15)

	•	Provide SQL migration to create projects table. Suggested schema (adjustable):

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  owner_name TEXT,
  status TEXT,
  budget NUMERIC,
  start_date DATE,
  end_date DATE,
  metadata JSONB,
  documents JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

	•	Seed script scripts/seed_projects.go that inserts 100 realistic dummy rows via direct DB connection. Provide docker-compose or psql CLI commands to run the seed.
	•	Ensure storage uses a PV/PVC project-data-0001 in the infra/k8s/ manifests. For kind, use a hostPath-backed PV or local-path provisioner with explicit PV name.

	5.	Kubernetes & kind with Cilium

	•	Provide a shell script infra/kind/create_kind.sh that:
	•	Checks for an existing kind cluster named kind-hello-01; if found, reuse it and print notice.
	•	If not found, create a kind cluster with 2 nodes and install Cilium CNI with Hubble enabled.
	•	Deploy the OpenTelemetry collector, PostgreSQL, backend services, frontend, and MCP server to the cluster.
	•	Provide infra/k8s/ manifests or Helm charts for:
	•	postgres statefulset or deployment + PVC bound to project-data-0001.
	•	backend deployments (auth, projects, mcp) and services.
	•	frontend deployment + service + optional ingress.
	•	otel-collector deployment and config to receive OTLP and forward to console or logging backend.
	•	All manifests must include liveness/readiness probes, resource requests/limits, and appropriate security contexts.

	6.	Ansible remote deployment (new)

	•	Add ansible/ at repo root containing:
	•	inventory/hosts.ini.example — example inventory describing remote Ubuntu host(s).
	•	playbooks/site.yml — top-level playbook that runs roles in order: common, docker, kind, cilium, deploy-apps.
	•	roles/common/tasks/main.yml — ensure apt packages, users, firewall rules.
	•	roles/docker/tasks/main.yml — install Docker Engine, Docker Compose plugin, configure daemon.
	•	roles/kind/tasks/main.yml — install kind, kubectl, create or reuse kind-hello-01 on the remote host.
	•	roles/cilium/tasks/main.yml — install Cilium in the remote kind cluster (use Helm or cilium CLI), enable Hubble.
	•	roles/deploy-apps/tasks/main.yml — copy Kubernetes manifests and images (or use remote docker build + kind load docker-image), apply manifests, create PVC project-data-0001.
	•	roles/verify/tasks/main.yml — run health checks: check pods, services, seed DB, run smoke tests (login, token generation, CRUD).
	•	Provide ansible/README.md with exact ansible-playbook commands, example SSH key config, and vault/secret guidance for protecting credentials.
	•	Include an ansible/vars/vars.yml.example with variables for Docker image registry, service versions, postgres password (as placeholder), and cluster settings.

	7.	OpenAPI & Documentation

	•	Generate OpenAPI v3.0 spec for each service (auth, projects, mcp). Include Swagger UI deployment in infra/k8s/ or an Ansible task to expose the docs on the remote host.
	•	docs/deployment.md must contain exact kubectl, kind, and ansible-playbook commands to deploy and verify the system, including how to mount project-data-0001 for the postgres PV.

	8.	Logging & Observability

	•	Use zap and emit logs following OpenTelemetry semantic conventions. Provide OTLP endpoint env var support.
	•	Instrument APIs with traces and metrics (HTTP spans, DB spans). Expose Prometheus metrics endpoint on each service (e.g., /metrics).
	•	Provide an infra/otel/ directory with a sample collector config and a deployment manifest.

	9.	Security Observations Directory

	•	Create security-observations/README.md describing purpose and format.
	•	Write sample files with example findings (e.g., 2025-09-07-01-sql-injection-risk.md) including remediation steps. Include token-expiration audit logs and any Ansible-related hardening notes.

	10.	Tests & CI

	•	Unit tests for backend handlers and DB layer.
	•	Integration test to run against a local docker-compose or kind test namespace that:
	•	Spins up Postgres, seeds 100 records,
	•	Runs the Go services,
	•	Runs a small e2e test that logs in, creates a token, performs a CRUD sequence against projects, and validates RBAC enforcement.
	•	Provide a GitHub Actions workflow ci.yml that runs tests and builds Docker images.

	11.	Deliverables

When executed, the generator should produce:
	•	A complete repository tree (see layout) with source files, Dockerfiles, Kubernetes manifests or Helm charts, migration scripts, seed script, OpenAPI YAML/JSON files, security-observations/ folder populated with at least two sample observations, and an ansible/ folder with playbooks and roles.
	•	infra/kind/create_kind.sh that reuses kind-hello-01 if present; otherwise creates cluster and installs Cilium.
	•	A README.md with step-by-step local dev, cluster, and Ansible remote deployment instructions, including exact commands to seed DB, generate API token from UI and via CLI, and how to run the e2e tests.

⸻

Non-functional requirements
	•	Code must be modularized; backend should follow clean architecture (cmd/, internal/, pkg/ separation).
	•	All secrets must be read from environment variables, Kubernetes secrets, or Ansible Vault (for remote deploy) — do not hardcode credentials in source. Provide .example secret files and instructions.
	•	Use semantic versioning for services and pin base images in Dockerfiles.
	•	Provide make targets in repo root: make build, make run-local, make seed, make kind-deploy, make ansible-deploy, make test, and make clean.

⸻

Example prompt header to feed into a code generator / assistant

You are a senior full-stack engineer. Produce a git repository exactly matching the requirements below. Output file-by-file content with paths and contents enclosed in triple backticks and labeled with the path. Include Dockerfiles, Kubernetes manifests (or Helm charts), shell scripts, Ansible playbooks and roles, Go source files, React source (TSX), SQL migrations, and the OpenAPI v3.0 YAML files. Make sensible choices for libraries: Go 1.21+, Gin, sqlc+pgx, Casbin, zap, OpenTelemetry; React + Vite + TypeScript; Postgres 15. Use JWT for API tokens or opaque tokens stored in DB; tokens must expire after 4 hours. Provide a `create_kind.sh` script that re-uses `kind-hello-01` if present. Name the persistent volume `project-data-0001`. Place security observations under `security-observations/`. Ensure RBAC for roles superuser > sysadmin > localadmin > user > guest enforced by middleware. Add a seed script that inserts 100 dummy `projects`. Generate OpenAPI v3 specs for each service. Provide Ansible playbooks to deploy to remote Ubuntu (install docker, create kind, deploy apps). Provide README and docs. Keep code modular and production-ready.


⸻

Notes / Helpful hints for implementer
	•	For kind and Cilium: the script must check kind get clusters and install Cilium only when creating the cluster; if reusing cluster, check Cilium status before proceeding.
	•	For the PV project-data-0001: on kind, simplest approach is a hostPath-backed PV using a path inside the repo (e.g., ./infra/storage/kind_pv/project-data-0001) and a hostPath PV manifest.
	•	For token expiration: store tokens in DB with expires_at and add an index; invalidate on logout or revoke. Provide scripts/rotate_tokens.go to expire old tokens and write expirations to security-observations/.
	•	For Ansible remote deploy: provide guidance to use Ansible Vault for sensitive variables (DB passwords, registry creds). Ensure SSH key-based access to remote Ubuntu and document ansible_user and ansible_ssh_private_key_file usage.
	•	For OpenAPI generation in Go: use swaggo/swag or oapi-codegen to annotate handlers and emit v3.0 YAML.
	•	For Claude integration: provide an example claude-desktop.yaml which shows the MCP server endpoint and a note on where to store API tokens.

⸻

Final instructions to generator
	•	Output must be a ready-to-save set of files and directories. Avoid placeholders like “TODO” in core logic. Where secrets are required, generate .example files and document how to inject real secrets.
	•	Always include make targets in repo root: make build, make run-local, make seed, make kind-deploy, make ansible-deploy, make test, and make clean.

⸻

End of prompt.