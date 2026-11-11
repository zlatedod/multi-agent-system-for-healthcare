// Expect one item with an array of cases under json.testCases
const arr = items[0]?.json?.testCases;
if (!Array.isArray(arr) || arr.length === 0) {
  throw new Error("Expected an array at json.testCases");
}

// Map to the minimal payload the LLM should see: ONLY the public_case + a stable case_id
const cases = arr.map((x, i) => {
  const pc = x.public_case || x.part_a_presentation || x; // fallback if your field name differs
  if (!pc) throw new Error(`Case at index ${i} is missing public_case/part_a_presentation`);

  // Prefer explicit hadm_id if present at top-level, else scenario_id from public_case
  const case_id =
    x.hadm_id ??
    x.case_id ??
    pc.scenario_id ??
    `case_${i}`;

  return { case_id: String(case_id), public_case: pc };
});

// JSON schema for output (STRUCTURED for clean eval against ground truth)
const schema = {
  type: "array",
  items: {
    type: "object",
    required: [
      "case_id",
      "primary_diagnosis",
      "secondary_diagnoses",
      "in_hospital_mortality_risk_pct",
      "mort30_risk_pct",
      "readmit30_risk_pct",
      "expected_los_hours",
      "key_interventions",
      "safety_flags",
      "rationale"
    ],
    properties: {
      case_id: { type: "string" },

      // PRIMARY: structured (ICD code + version) for exact match against ground truth
      primary_diagnosis: {
        type: "object",
        required: ["code", "version", "description"],
        properties: {
          code: { type: "string", nullable: true },      // e.g., "I21.4" or "1759"; null if unknown
          version: { type: "integer", nullable: true },  // 9 or 10; null if unknown
          description: { type: "string" }                // human label; required
        },
        additionalProperties: false
      },

      // SECONDARY: array of the same structure
      secondary_diagnoses: {
        type: "array",
        items: {
          type: "object",
          required: ["code", "version", "description"],
          properties: {
            code: { type: "string", nullable: true },
            version: { type: "integer", nullable: true },
            description: { type: "string" }
          },
          additionalProperties: false
        }
      },

      // Probabilities in percent (0–100), max 1 decimal, no % sign
      in_hospital_mortality_risk_pct: { type: "number", minimum: 0, maximum: 100 },
      mort30_risk_pct: { type: "number", minimum: 0, maximum: 100 },
      readmit30_risk_pct: { type: "number", minimum: 0, maximum: 100 },

      // LOS: HOURS (so you can compare directly to ground_truth_outcome.labels.los_hours)
      expected_los_hours: { type: "number", minimum: 0 },

      key_interventions: { type: "array", items: { type: "string" } },
      safety_flags: { type: "array", items: { type: "string" } },

      // Keep short; we’ll log this for QA
      rationale: { type: "string", maxLength: 900 }
    },
    additionalProperties: false
  }
};

const system = `
You are a clinical reasoning model. You receive ONLY the **testCases** for each patient (no outcomes).
Your job is to produce structured predictions **strictly from the given inputs** and return ONLY a JSON array that conforms to the schema.

HARD RULES
- Output must be a JSON ARRAY with the SAME order/length as input.
- Include the input "scenario_id" unchanged in every element.
- For primary_diagnosis and secondary_diagnoses:
  - Provide an ICD {code, version, description} object.
  - If you are uncertain of the exact code or version, set code=null and/or version=null but ALWAYS fill description with the best clinical label.
  - If you do provide a code,the version must be ICD 9, code must be digits only, no dots (e.g., 1977, not 197.7)

If unsure, set code=null and provide a short description.
- Risk fields are percentages in [0,100], at most 1 decimal, **no percent sign**. Avoid 0 or 100 unless virtually certain.
- expected_los_hours is numeric hours (not days).
- key_interventions: list the most important immediate therapies/procedures likely needed.
- safety_flags: list concrete, high-signal risks (e.g., “possible sepsis—monitor for hypotension”, “renal risk if using contrast”), grounded in the case data only.
- Keep rationale ≤ 120 words per case; concise, evidence-based.
- NO text outside the JSON array. NO markdown. NO extra keys.

GENERAL GUIDANCE
- Use narrative_sop and patient_context to infer likely diagnoses and risks.
- Prefer common, high-pretest diagnoses consistent with the evidence over rare entities.
- Do not infer outcomes that require knowledge beyond the test case; do not leak ground-truth-style info.
JSON SCHEMA:
${JSON.stringify(schema, null, 2)}
`.trim();

const user = `
INPUT CASES (array of { case_id, public_case }):
${JSON.stringify(cases, null, 2)}

TASKS per case:
1) primary_diagnosis: ICD {code, version, description}
2) secondary_diagnoses: array of ICD {code, version, description}
3) in_hospital_mortality_risk_pct
4) mort30_risk_pct
5) readmit30_risk_pct
6) expected_los_hours
7) key_interventions
8) safety_flags
9) rationale (<=120 words)

OUTPUT: Return ONLY a JSON array matching the schema (no prose).
`.trim();

return [{ json: { prompt: { system, user } } }];

