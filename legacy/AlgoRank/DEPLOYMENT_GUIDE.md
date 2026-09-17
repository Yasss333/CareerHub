# Oracle Cloud Always Free — Safe Piston Deployment Guide

Goal: run Piston (the code-execution sandbox) on Oracle Cloud **without ever billing
your friend's credit card**. Everything below uses only **Always Free** resources inside
your **Home Region**.

> ⚠️ **CRITICAL DATE (2026):** Oracle halved the Always Free ARM (Ampere A1) allowance
> to **max 2 OCPUs / 12 GB RAM** per tenancy (effective ~June 15, 2026, enforced ~Aug 18).
> Any ARM instance above that is **auto-terminated** and, on a PAYG account, may bill the
> excess. **Never pick 4 OCPU / 24 GB.**

---

## Golden rules (protect the borrowed card)

1. Create **only Always Free** resources.
2. Keep everything in your **Home Region** (anything else bills).
3. Never exceed: **2 OCPU / 12 GB ARM** (or free micro), **≤200 GB** storage, **10 TB** egress.
4. Set a **$1/month budget alert** as a trip wire.
5. No extra block volumes, no backups, no load balancers, no static public IPs.

---

## Step 0 — Safety setup FIRST (before any VM)

1. **Billing & Cost Management → Cost Management → Budgets → Create Budget**
   - Scope: **Total** (whole tenancy), Amount: **$1.00/month**
   - Alert rules at 50% (forecast), 80% (actual), 100% (actual) → your email.
2. **Governance & Administration → Tenancy** → note your **Home Region**.
3. In the console, always filter to **Free Tier** + home region.

---

## Step 1 — Pick a safe VM shape

| Shape | Free? | Piston OK? |
|---|---|---|
| `VM.Standard.A1.Flex` 2 OCPU / 12 GB | ✅ (new max) | ✅ Best |
| `VM.Standard.A1.Flex` 1 OCPU / 6 GB | ✅ | ✅ Good |
| `VM.Standard.E2.1.Micro` (1 GB) | ✅ | ❌ Too small |

**Recommendation:** A1.Flex **1 OCPU / 6 GB** (or 2/12 if capacity available).

> **"Out of capacity"?** Don't switch to a paid shape. Retry later / change Availability
> Domain, or run the free **oci-arm-hunter** tool to auto-claim free ARM capacity.

---

## Step 2 — Create the VM

1. **Compute → Instances → Create Instance**
2. Name: `piston`
3. Image: **Canonical Ubuntu 24.04 (LTS)**
4. Shape → **Ampere** → `VM.Standard.A1.Flex` → **OCPU=1, Memory=6 GB**
5. Networking: your VCN / public subnet; **Assign public IPv4** ✅
6. SSH: upload a public key (or generate + **download private key now**)
7. Boot volume ~47 GB (total stays < 200 GB)
8. **Create** → note the **Public IP**

Do NOT add extra volumes / backups / load balancers.

---

## Step 3 — Open port 2000

- **Networking → VCN → Security Lists** (on the public subnet)
- **Add Ingress Rule:** Source `0.0.0.0/0`, TCP, **Destination Port: 2000**
- Ensure port `22` is open for SSH.

---

## Step 4 — SSH + Docker + Piston

```bash
ssh -i ~/.ssh/your_key ubuntu@<PUBLIC_IP>
```

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER && newgrp docker
sudo systemctl enable --now docker
```

```bash
mkdir -p ~/piston && cd ~/piston
cat > docker-compose.yml <<'EOF'
services:
  piston:
    image: ghcr.io/engineer-man/piston
    container_name: algo-piston
    privileged: true
    restart: unless-stopped
    ports:
      - "2000:2000"
    environment:
      PISTON_RUN_TIMEOUT: "10000"
      PISTON_RUN_CPU_TIME: "10000"
      PISTON_COMPILE_TIMEOUT: "20000"
      PISTON_COMPILE_CPU_TIME: "20000"
    volumes:
      - pistondata:/piston
volumes:
  pistondata:
EOF
docker compose up -d
```

Install runtimes (the backend supports JAVASCRIPT, PYTHON, CPP, JAVA — install all four):
```bash
cd ~/piston
git clone --depth 1 https://github.com/engineer-man/piston.git piston-cli
cd piston-cli/cli && npm install
node index.js ppman install node
node index.js ppman install python
node index.js ppman install gcc
node index.js ppman install java
```
> Note: each runtime must exist on the Piston server or the backend returns
> `400 "runtime is unknown"` for that language. Verify with:
> `curl http://<PUBLIC_IP>:2000/api/v2/runtimes`

Verify:
```bash
curl http://localhost:2000/api/v2/runtimes
# from your PC:
curl http://<PUBLIC_IP>:2000/api/v2/runtimes
```

---

## Step 5 — Point Render backend at it

Backend now reads `PISTON_API_URL` env var (falls back to localhost). In Render, set:

```
PISTON_API_URL=http://<PUBLIC_IP>:2000/api/v2/execute
```

Restart the backend service.

---

## Step 6 — Ongoing "don't bill my friend" checklist

- Check **Budget dashboard** → confirm **$0.00 actual**.
- Confirm VM **≤ 2 OCPU / 12 GB**, storage **< 200 GB**, no extras.
- When done: **terminate** the instance (Stop ≠ free; Oracle reaps idle anyway).

---

## Cost-risk notes (PAYG)

- Because the account is PAYG (card on file), Oracle provides free Ampere usage as the
  first N OCPU/GB-hours per month; post-halving the docs say **1,500 OCPU hrs / 9,000 GB-hrs**
  per month, and PAYG treatment is **unclear/conflicting**.
- Safest path: never create anything that exceeds free limits; rely on the $1 budget alert.
