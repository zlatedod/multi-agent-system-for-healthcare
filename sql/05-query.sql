-- n8n node: Execute a SQL query1
-- Query parameters are in the workflow; n8n expressions are not standalone SQL.
insert into mimiciv.eval_runs (run_id, case_id, payload)
values ($1, $2, $3::jsonb)
on conflict (run_id, case_id)
do update set payload = excluded.payload;

