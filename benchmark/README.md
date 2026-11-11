# Benchmark access and local use

The real benchmark is a derived MIMIC-IV dataset. It is intentionally not uploaded to GitHub, including this private repository.

PhysioNet's MIMIC-IV page states that derived datasets should be shared through PhysioNet under the same agreement as the source: https://physionet.org/content/mimiciv/3.1/ . Obtain the source data through its credentialed access process and arrange an approved distribution of the derived benchmark with the project owner.

Keep authorized benchmark JSON, exclusion IDs and outcome labels in a local directory outside Git. Configure the workflow's local input and exclusion placeholders as described in `docs/SETUP.md`. The exact original benchmark cannot be reconstructed from the synthetic example or this repository alone. No 200-case sample or new cohort was selected during export.

`format-example.json` is wholly synthetic and illustrates only the wrapper and field names. It must not be mixed into study results. Its identifier has no corresponding patient/admission in the research database.
