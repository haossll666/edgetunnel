# Next Slice Queue

This queue is the project-level memory for continuous execution.

Update it after every shipped slice.

## NOW

### Q8-3: Route diagnostics and recovery notes

Status:
Completed.

Goal:
Make the recovery path for mainland users explicit before touching more runtime behavior.

Scope:

- route-level diagnostics
- operator recovery notes
- README guidance for `/admin` / `/admin/config.json` / `/sub`

Done when:

- the README includes a clear mainland troubleshooting sequence
- the contract boundaries are stated before more runtime changes
- the onboarding contract remains intact

## NEXT

### Q8-4: Follow-up logging refinements

Status:
Planned.

Goal:
Decide whether the next gain should come from lighter `/sub` diagnostics or from additional operator-facing logging refinements.

Scope:

- potential follow-up logging refinements
- route diagnostics if runtime helpers are justified
