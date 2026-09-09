# VEYRA Skill and Plugin Ledger

This ledger records only capabilities verified from the current Codex inventory
or from successful local execution. A listed capability is not evidence that an
external connector is authenticated.

| Domain | Skill/plugin | Status | Source | Why needed | Used for | Evidence |
|---|---|---|---|---|---|---|
| Orchestration | Superpowers / using-superpowers | INSTALLED | Codex skill inventory | Required engineering lifecycle | Goal classification and workflow | Skill instructions read locally |
| Design | Superpowers / brainstorming | INSTALLED | Codex skill inventory | Architectural decomposition and approval gate | P0/P1/P2 phase design | Skill instructions read locally |
| Planning | Superpowers / writing-plans | INSTALLED | Codex skill inventory | Multi-step implementation plan | Planned after the P0 spec gate | Skill instructions read locally |
| Isolation | Superpowers / using-git-worktrees | INSTALLED | Codex skill inventory | Protect the main branch | Isolation assessment | Current checkout verified as `main`; dirty user changes preserved |
| Testing | Superpowers / test-driven-development | INSTALLED | Codex skill inventory | Regression-first bug fixing | Stale player callback regression | Skill instructions read locally; focused test passes |
| Browser | Browser automation | AVAILABLE_PLUGIN | Recommended plugin inventory | Live player and mobile verification | Not authenticated/used in this phase | No browser connector action completed |
| Security | Codex Security | AVAILABLE_PLUGIN | Recommended plugin inventory | CSP, iframe, and postMessage review | Not installed | No authenticated security plugin available |
| Security review | secure-project-engineer | INSTALLED | Codex skill inventory | Repository security review and threat-boundary audit | Provider/CSP/API/secrets review | `docs/audit/security-review-report.md`; local tool inventory recorded |
| Accessibility | accessibility-review | INSTALLED | Codex skill inventory | Keyboard, ARIA, and mobile target review | Pending P1 | Skill listed; not yet invoked |
| Performance | ultra-performance-engineer | INSTALLED | Codex skill inventory | Player and discovery performance | Pending P1/P2 | Skill listed; not yet invoked |
| Discovery | find-skills | INSTALLED | Codex skill inventory | Specialist skill discovery | Pending specialist search | Skill listed; not yet invoked |
| External data | Telegram/community connector | UNAVAILABLE | Pasted goal capability constraints | Community evidence only | Not used as authoritative evidence | No connector exposed |
| Deployment | Vercel connector | UNAVAILABLE | Pasted goal capability constraints | Deployment verification | Not used | No authenticated deployment action in this phase |
| Storage | Supabase connector | UNAVAILABLE | Pasted goal capability constraints | Aggregate telemetry/reporting | Not used | No authenticated connector action in this phase |
| UI design | Figma | NOT_NEEDED | Recommended plugin inventory | Design-file review | Not applicable to P0 reliability | No design-file task |
| Media generation | Runway / creative plugins | NOT_NEEDED | Recommended plugin inventory | Creative production | Not applicable | No media-generation task |

## Status rules

- `INSTALLED` means the skill is present in the Codex inventory and its local
  instructions were available.
- `AVAILABLE_PLUGIN` means the plugin was recommended but not installed or
  authenticated in this worktree.
- `UNAVAILABLE` means the requested capability was not exposed in this session.
- `USED` is intentionally not used as a status unless an authenticated action or
  direct skill execution provides evidence.
