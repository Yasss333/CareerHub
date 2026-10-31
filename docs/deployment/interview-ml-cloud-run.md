# Enable session-safe face verification on Cloud Run

Prepared 31 October 2026. These steps have **not** been executed. The current API configuration disables identity verification (`INTERVIEW_ML_SESSION_SCOPED=false`). Emotion analysis and screen/focus monitoring can still work with that setting. Changing the flag alone does not fix identity verification.

## Deploy the correct code

Use `services/proctoring` in this CareerHub repository. Do not deploy either legacy reference folder: older verifiers keep a single global baseline. The bundled implementation requires `session_id` on both registration and verification, caches embeddings under that id, and returns no embeddings to the browser.

1. Open Google Cloud Console and select the project that owns `ai-mock-ml-service` in `us-central1`. The numeric project number visible in the existing hostname is `129155535988`; confirm the actual project **ID** in the console rather than guessing it.
2. In Secret Manager, create `careerhub-interview-service-token` with a new random secret. Keep the value for the corresponding Render environment setting. Grant the Cloud Run runtime service account access to this one secret. Do not put it into GitHub, Vercel public variables, or command history.
3. Open Cloud Shell, clone/pull CareerHub, and run the following from the repository root after replacing PROJECT_ID. This builds the existing Dockerfile from source. It may require enabling Cloud Build/Artifact Registry and accepting billing in your own project.

```bash
gcloud run deploy ai-mock-ml-service \
  --project PROJECT_ID \
  --region us-central1 \
  --source services/proctoring \
  --memory 8Gi \
  --cpu 2 \
  --concurrency 2 \
  --max-instances 1 \
  --timeout 120 \
  --set-secrets INTERVIEW_ML_TOKEN=careerhub-interview-service-token:latest \
  --allow-unauthenticated
```

The public Cloud Run ingress permits the Render API to reach the service; the FastAPI application still requires the shared `X-Interview-Service-Token` header on inference routes. Keep one instance and one Uvicorn worker while embeddings are in process memory. These are initial resource settings, not measured capacity guarantees. Model downloads/load may need deployment tuning; inspect startup logs for `Face verifier loaded` and actual successful inference. A Ready revision does not prove that every optional model loaded. Cold restarts lose baselines and require a new interview registration. Horizontal scaling needs a shared baseline store or stateless verification design first.

## Verify inference before enabling the flag

Use synthetic or explicitly consented test images only. In the deployed service, check actual `POST /proctor/register` and `POST /proctor/verify` with multipart fields `file` and `session_id`, using the service token header. No health/OpenAPI probe is required.

- Register image A under a fresh QA session A; expect `VERIFIED`.
- Verify A under A; expect a match.
- Verify A under an **unregistered** session B; it must fail, never use A's baseline.
- Register a different image B under B; then verify A under A again. B must not overwrite A.
- Check no-face and multiple-face images return their real statuses, not successful registration.
- Delete the two test baselines with `DELETE /proctor/session/<QA-session-id>`.

The test runner can call through CareerHub after configuration so ownership and consent remain enforced. Keep real candidate images/answers out of logs and the repository.

## Render configuration

After the isolated inference checks succeed, update `careerhub-api`:

```text
INTERVIEW_ML_URL=<the verified Cloud Run service URL>
INTERVIEW_ML_DISCOVERY_MODE=direct
INTERVIEW_ML_TIMEOUT_MS=120000
INTERVIEW_ML_SESSION_SCOPED=true
INTERVIEW_ML_TOKEN=<the same Secret Manager value>
```

The bundled service requires a token; the older deployed service did not. Configure both sides together. Save/redeploy Render, then start a **new** interview on CareerHub and check baseline registration, a later identity match, a live warning and its saved report. Do not relabel historical sessions as verified.

Rollback: restore the previous Render ML URL/token settings and set `INTERVIEW_ML_SESSION_SCOPED=false`. Keep screen/focus monitoring available. In Cloud Run, route traffic to the previous revision if the new one fails. Do not disable the service authentication check to make a failed test pass.

Sources: [Cloud Run source deployment](https://docs.cloud.google.com/run/docs/deploying-source-code), [Cloud Run maximum instances](https://docs.cloud.google.com/run/docs/configuring/max-instances), [Cloud Run secrets](https://docs.cloud.google.com/run/docs/configuring/services/secrets).
