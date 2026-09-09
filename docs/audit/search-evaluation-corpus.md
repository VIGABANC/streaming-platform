# Search Relevance Evaluation Corpus

This corpus is a deterministic product fixture, not a claim about catalog
availability. Each query should keep the expected intent and title family
stable as ranking changes.

| Query | Expected intent | Expected top-result property |
|---|---|---|
| `Dune` | exact title | exact normalized title beats `Dune: Part Two` and popularity |
| `parasite korean 2019` | Korean, 2019 | Korean 2019 result outranks other-language matches |
| `malayalam thriller 2025` | Malayalam, 2025, thriller | Malayalam 2025 thriller candidates lead |
| `new hindi comedy` | Hindi, comedy | Hindi comedy candidates lead; `new` remains query text |
| `dubbed anime` | TV/anime, dubbed | anime candidates lead and intent is returned explicitly |
| `korean drama` | Korean | Korean drama candidates lead |
| `Blade Runner` | ambiguous title | exact title token match remains above popularity-only results |
| `The Office` | ambiguous movie/TV | media-type intent can break ties when supplied |
| `spirited away` | exact original/English title | exact normalized title leads |

The API returns the parsed intent beside results so a future UI can expose
language and dub/sub filters without asking an LLM to parse every keystroke.
