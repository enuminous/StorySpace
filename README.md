# StorySpace
### The experience is real. The story is a hypothesis. The evidence has to be independent.

**StorySpace** is a reproducible, evidence-bounded research and visualization project for unusual experiences of time: déjà vu, apparent premonitions, delayed-choice interpretations, hindsight effects, familiarity without recollection, and the human ability to build a compelling explanation *after* experiencing a signal.

**Status (2026-11-09):** Research scaffold + working local-first browser observatory. **Not an established physical model of retrocausality. No human experiment, prediction advantage, neuroscience result, or physical validation is claimed.**

> "The story arrives after the signal and feels like part of it." — Boardy, relayed in a research discussion.
>
> "The universe does not let a later grant mutate an earlier run." — A line from the discussion.
>
> "All bullshit is welcome. Unlabeled bullshit is not." — Monolithic's editorial standard.

## Live observatory

**[Expected GitHub Pages address](https://enuminous.github.io/StorySpace/)** — becomes accessible after Pages is enabled under **Settings → Pages → Deploy from branch → main / root**. I have **not verified Pages activation**. Follow the [deployment instructions](docs/DEPLOY.md), or open `index.html` locally.

The [index.html](index.html) application also works as an offline site when opened locally. It uses no external scripts, trackers, web APIs, or data uploads.

## The three spaces

| Space | Records | Not allowed to imply |
|---|---|---|
| **Signal** | The person's direct experience, time, intensity and subjective familiarity | That the sensation proves a particular physical cause |
| **Story** | Their interpretation, including ordinary cognitive explanations and proposed retrocausal ones | That a compelling explanation is automatically measured |
| **Evidence** | Prospective frozen predictions, fixed outcomes, source revisions, calibration and independent controls | That a client-side browser timestamp is independently authenticated |

## What you can do

- Record subjective déjà vu or other temporal experiences without declaring their cause.
- Freeze a *local* prospective claim **before** resolving it. Record a fixed event definition, deadline, probability and expected observation. Local time and browser storage are **not trusted timestamps**; export the JSON and place it under independently verifiable custody before the event.
- Reveal an outcome and calculate a proper binary Brier loss **(p − y)²**. Lower is better; zero is perfect. A single hit is not evidence of causality. The built-in 0.5 comparison is merely a fixed illustrative baseline, **not** an estimated event base rate.
- Watch a delayed-sorting toy: the earlier aggregate observations remain unchanged when later labels reveal subgroup patterns. This illustrates **post-selection**, not a quantum experiment or proof about all retrocausal interpretations.
- Inspect a recursive claim/evidence tree that conservatively propagates **PASS / FAIL / UNRESOLVED**.
- Export and import an explicit, readable record. Data remain in this browser unless the user exports them.

## Core scientific rule

A report of *"I knew this would happen"* is not evidence of foreknowledge unless the forecast was fixed before the event, was sufficiently specific to score, had a prospectively chosen comparator, and survived independent checking. Even robust predictive advantage would **not automatically establish backwards-in-time causal influence**; ordinary information and predictive mechanisms must be excluded.

## Protocol and code

- [SS-001 prospective prediction and source-monitoring protocol](protocols/SS-001.md)
- [Machine-readable protocol](protocols/SS-001.json)
- [Scientific boundary and background](docs/RESEARCH_BOUNDARY.md)
- [Primary literature](docs/SOURCES.md)
- [Browser application](index.html)
- [Pure scoring, state transitions and recursive verdict engine](src/core.js)
- [Interactive application logic](src/app.js)
- [Node tests](tests/core.test.cjs)
- [GitHub Actions workflow](.github/workflows/test.yml)

### Reproduce the local controls

Requires Node.js 20+ (no dependencies). [GitHub Actions](https://github.com/enuminous/StorySpace/actions) runs the same controls automatically:

~~~sh
node --test tests/core.test.cjs
~~~

The tests check deterministic scoring, irreversible local state transitions **within the application's model**, data validation and recursion safeguards. They are not cognitive/physical experiments. Browser storage is user-editable and the JS code is inspectable; **this is not cryptographic or independent evidence custody**.

## Scientific starting point

Recognition-memory research identifies familiarity without access to its source as one possible mechanism for déjà vu. In a preregistered behavioral investigation, déjà vu increased *feelings* of prediction without above-chance ability to predict a next turn in the tested navigation task. Neither result explains every subjective temporal experience.

Quantum delayed-choice and quantum-eraser experiments yield distinctive correlations after sorting measurement records, but their conventional operational analysis does not require usable signals to propagate backward in time. Time-symmetric and retrocausal interpretations are legitimate subjects of foundational debate; **their empirical superiority is not established by this project**.

For references and exact scopes, read [docs/SOURCES.md](docs/SOURCES.md).

## Evidence classes

- **OBSERVED (self-report):** experience happened as described, subject to the limits of self-report
- **FROZEN LOCALLY:** claim was marked frozen in this browser; external custody *not established*
- **SCORED:** outcome assigned under the locked event definition; must be independently checked for inference
- **PASS:** a specified gate passes within its declared scope
- **FAIL:** a specified gate is contradicted or misses its threshold
- **UNRESOLVED:** no sufficient evidence or audit has not been run
- **SIMULATED:** generated by the app, never measured human or quantum data

## Ethics, privacy and access

Never publish someone's personal experience without permission. Local browser storage may be read by others using the same browser profile, and exported files are ordinary readable JSON. Avoid collecting identifying health information; unusual experiences by themselves do not imply illness or anomalous physics. The app is keyboard-friendly and respects reduced-motion settings.

**Research lead:** Matthew Chenoweth Wright / Monolithic LLC · [eNuminous](https://github.com/enuminous)  
**Research status:** A program for asking *how we would know*, not a theory claiming that retrocausality has been observed.

*The Zoo abides. The story can be wrong.*
