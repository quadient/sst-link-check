# Claude 3.7 Sonnet

to avoid misconfiguration we need a tool that checks sst temporary output (lambdas to be deployed) and provides easy to read output to verify infrastructure representation has correct bindings

- create typescript + pnpm tool which will scan the `.sst/artifacts` directory check the content of bundle.mjs files
and finds all `Resource.` usages, deduplicates them based on artifact folder name

instead of tsc compilation make the tool runnable via "npx tsx", write it into readme

create README.md

read the pulumi state.json file to find encryption key to decrpypt "resource.enc" files, wich provide the list of "bindings" ... compare with results found by bundle.mjs scan  

write all found discrepancies at the end of program run (with proper artifact name heading), cases with
"Resources in resource.enc file but not in bundle.mjs" with yellow color, cases with "Resources in bundle.mjs but not in resource.enc file:" in red color

refactor code into functions with meaningful naming + and split into multiple files