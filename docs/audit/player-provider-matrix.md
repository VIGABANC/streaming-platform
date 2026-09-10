# Provider matrix

| Provider | Origin | Media | Observability | Controls | Trust |
|---|---|---|---|---|---|
| Server 1 | `https://v1.vidsrc.wiki` | movie/TV | C: frame load only | provider-controlled | allowlisted |
| Server 2 | `https://vidsrc.xyz` | movie/TV | C: frame load only | provider-controlled | allowlisted |
| Server 3 | `https://www.2embed.cc` | movie/TV | C: frame load only | provider-controlled | allowlisted |
| Server 4 | `https://player.autoembed.cc` | movie/TV | C: frame load only | provider-controlled | allowlisted; may be unreachable |

No provider currently has a verified documented event origin or direct media API in this repository. DNS-specific failure is not claimed when the browser only exposes a generic iframe failure/timeout.
