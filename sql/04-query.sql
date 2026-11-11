-- n8n node: Execute a SQL query
-- Query parameters are in the workflow; n8n expressions are not standalone SQL.
SELECT *
FROM mimiciv.mimiciv_part_b
WHERE case_id = {{$json.case_id}};
