# Multi Agent System for Healthcare — MAS-mcp

MAS-mcp is a multi-agent workflow for healthcare prediction. It combines demographic, laboratory and pharmacy agents with cohort retrieval and an orchestrator. This repository contains the n8n workflow, agent prompts, SQL queries and setup instructions.

## Contents

| Folder | Contents |
| --- | --- |
| `workflow/mas-mcp.json` | Sanitized n8n workflow; imported inactive |
| `prompts/` | Verbatim specialist/orchestrator prompts and baseline prompt generator |
| `sql/` | Queries embedded in the workflow, with source node names |
| `benchmark/` | Input-format example and instructions for authorized local benchmark access |
| `docs/` | Setup instructions and export details |

## What it does

1. Loads the benchmark presentation and applies a locally configured case exclusion list.
2. Processes cases through a loop and extracts demographic, laboratory and pharmacy features.
3. Retrieves domain-specific cohorts from PostgreSQL and supplies evidence to three specialist agents.
4. Merges and validates specialist results, then supplies them to the orchestrator.
5. Runs configured narrative baselines (OpenAI, Claude and a Meditron HTTP branch), retrieves reference outcomes for evaluation, and writes combined results to PostgreSQL.

The Meditron branch is included but is not connected to result aggregation.

## How to use

1. Import `workflow/mas-mcp.json` into a **new** workflow in your own n8n installation. Do not overwrite a working deployment.
2. Configure PostgreSQL, OpenAI, Anthropic and Hugging Face credentials inside n8n. Credential values and mappings are intentionally absent.
3. Install or obtain the project-specific PostgreSQL relations listed in [setup](docs/SETUP.md). This repository includes query callers, not a complete database restoration.
4. Replace `Get a file` with an authorized local benchmark loader that supplies `binary.data` to `Process test cases file`. Do not upload real records to GitHub.
5. Restore the original exclusion list from your authorized local configuration in `Code in JavaScript2`. The exported node deliberately stops until configured, rather than silently changing the benchmark population.
6. Review the enabled external providers, model availability, endpoint access, database writes, execution logging and budget. Inactive workflows can still be manually executed.
7. Confirm authorization to send the intended data to each provider, then test one case before running the benchmark.

Full details: [setup](docs/SETUP.md), [benchmark access](benchmark/README.md).

## Benchmark data

**Real MIMIC-IV patient records and ground truth are not included.** PhysioNet directs MIMIC-derived datasets to be shared through PhysioNet under the same agreement as the source. A private repository is not a replacement for credentialed access. See [MIMIC-IV sharing guidance](https://physionet.org/content/mimiciv/3.1/).

`benchmark/format-example.json` illustrates the input structure using synthetic content. Supply the benchmark and exclusion list locally; the example is not a runnable clinical case.
