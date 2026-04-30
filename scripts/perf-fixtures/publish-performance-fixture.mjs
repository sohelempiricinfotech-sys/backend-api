import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const scenariosPath = path.join(root, ".fixtures", "performance-scenarios.json");
const scenarios = JSON.parse(fs.readFileSync(scenariosPath, "utf8")).scenarios;

const eventPath = process.env.GITHUB_EVENT_PATH;
let commitMessage = "";
if (eventPath && fs.existsSync(eventPath)) {
  const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));
  commitMessage = event?.head_commit?.message ?? "";
}

const forcedPr = process.env.PERF_FIXTURE_PR;
const match = commitMessage.match(/PERF-FIXTURE\s+PR\s+#(\d+)/i);
const prNumber = Number(forcedPr ?? match?.[1]);
const scenario = scenarios.find((candidate) => candidate.pr_number === prNumber);

const output = process.env.GITHUB_OUTPUT;
const setOutput = (key, value) => {
  if (output) fs.appendFileSync(output, `${key}=${value}\n`);
};

setOutput("primary_artifact", "false");
setOutput("supertest_artifact", "false");
setOutput("pr_number", Number.isFinite(prNumber) ? String(prNumber) : "none");

if (!scenario) {
  console.log("No fixture scenario is associated with this push; no performance artifact is emitted.");
  process.exit(0);
}

const baseArtifact = {
  schema_version: 1,
  fixture_mode: true,
  workflow: "API Performance Tests",
  pr_number: scenario.pr_number,
  historical_merged_at: scenario.historical_merged_at,
  head_sha: process.env.GITHUB_SHA ?? "unknown",
  environment: "production",
  measured_at: scenario.measured_at,
  endpoints: scenario.endpoints,
};

if (scenario.validation === "github_actions") {
  fs.writeFileSync("performance-results.json", `${JSON.stringify(baseArtifact, null, 2)}\n`);
  setOutput("primary_artifact", "true");
  console.log(`Published benchmark fixture for PR #${scenario.pr_number}.`);
} else if (scenario.validation === "supertest_only") {
  fs.writeFileSync(
    "supertest-performance-assertions.json",
    `${JSON.stringify({ ...baseArtifact, evidence_type: "lightweight-supertest-performance-assertion" }, null, 2)}\n`
  );
  setOutput("supertest_artifact", "true");
  console.log(`Published Supertest fallback fixture for PR #${scenario.pr_number}.`);
} else if (scenario.validation === "corrupt_primary_then_supertest") {
  const corruptEndpoint = { ...scenario.endpoints[0] };
  delete corruptEndpoint.p99_ms;
  fs.writeFileSync(
    "performance-results.json",
    `${JSON.stringify({ ...baseArtifact, head_sha: "invalid-fixture-sha", endpoints: [corruptEndpoint], fixture_note: "Intentionally invalid primary evidence." }, null, 2)}\n`
  );
  fs.writeFileSync(
    "supertest-performance-assertions.json",
    `${JSON.stringify({ ...baseArtifact, evidence_type: "lightweight-supertest-performance-assertion" }, null, 2)}\n`
  );
  setOutput("primary_artifact", "true");
  setOutput("supertest_artifact", "true");
  console.log(`Published intentionally corrupt primary evidence and valid Supertest fallback for PR #${scenario.pr_number}.`);
} else {
  console.log(`PR #${scenario.pr_number} intentionally has no usable performance evidence.`);
}

