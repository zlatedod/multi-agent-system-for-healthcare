# Setup and operational checks

## Prerequisites

- n8n with the node types in the JSON: Code, PostgreSQL, merge/aggregate/loop nodes, LangChain agents, OpenAI and Anthropic nodes, and HTTP Request.
- Authorized local MIMIC-IV data and separately prepared project-specific relations.
- Provider accounts/credentials for every enabled external branch.

Exact model parameters are retained in the export, including GPT-5 and the configured Claude/Meditron identifiers. Their current availability is not certified. Review the Meditron URL and authentication before use. Do not assume a model substitution reproduces the published experiment.

## PostgreSQL

The live workflow queries these relations:

- `mimiciv_hosp.admissions`
- `mimiciv.agent_demographics_fast`
- `mimiciv.agent_lab_fast`
- `mimiciv.agent_pharmacy_v2`
- `mimiciv.mimiciv_part_b`
- `mimiciv.eval_runs`

The first three retrieval nodes call embedded SQL directly, rather than the earlier query functions. The query texts are exported in `sql/`; parameters and n8n expressions remain in the workflow JSON. Relation definitions and source data are not bundled. Read the SQL to verify required columns and units against your database before attempting execution.

The live cohort queries exclude admissions of the index patient's subject ID. This does not by itself establish temporal isolation, independent evaluation or a six-hour feature cutoff. Laboratory/pharmacy hospital-mortality values are explicitly unavailable in those cohort queries. LOS units and adapters must be inspected, not guessed.

The result sink uses an upsert into `mimiciv.eval_runs` keyed by `(run_id, case_id)`. Configure a separate experimental destination or unique run IDs to avoid overwriting results. Ground truth is read from `mimiciv.mimiciv_part_b` on a separate evaluation branch; inspect the full graph before making leakage claims.

## Benchmark input

`Process test cases file` expects the first input item's `binary.data.data` to hold base64-encoded JSON. The JSON may be an array or an object with `cases` or `data`. An entry may wrap the presentation in `public_case` or `part_a_presentation`; otherwise the entry itself is used.

Required parser fields are `scenario_id` and `patient_context`. Only `scenario_id`, `cohort_meta`, `narrative_sop`, `patient_context` and `role_views` are forwarded. The parser's minimum checks do not guarantee sufficient downstream clinical fields. Use the authorized real schema and preserve the matching outcome IDs locally.

Replace the blocked input node with a local file-read/adaptation step preserving the binary shape. Restore the local exclusion list; do not silently use an empty list and label it the same benchmark.

## Known exported behavior

- The workflow is inactive but retains a manual trigger.
- The input and exclusion placeholders deliberately stop execution until configured.
- Meditron's output is not connected to result aggregation in this live snapshot. It may still incur a provider call when the branch is reached. No repair was applied during export.
- Original model calls, SQL, prompts, validation and merge logic were preserved rather than retroactively corrected.
- No end-to-end execution, model call or database write was performed for packaging.

Start with a new n8n workflow and read-only database credentials while inspecting; enable writes only for an explicitly chosen result destination. Store credentials in n8n, not JSON or Git. Protect execution logs because they may contain patient information.
