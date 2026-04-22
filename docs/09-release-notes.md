# 09 — Release Notes Style Guide

This doc defines how release notes are written for **Deadlock Companion**. Every release note — whether authored by a human or an agent — should follow this structure and voice so the published changelog feels consistent, warm, and player-first.

Read [`AGENTS.md`](../AGENTS.md) first for project-wide conventions.

---

## 1. Voice and tone

- **Second person, present tense.** Address the player directly: "you can", "your matches", "stay one step ahead". Never "users" or "the user".
- **Benefit-first.** Lead with what the player gets, not how the feature is built. Mention the mechanism only when it's meaningful (e.g. "powered by Overwolf Game Events").
- **Warm and community-driven.** The app is built *with* players, not *for* them. Use framing like "help power the ecosystem", "alongside you", "be part of building".
- **Confident but honest.** Call out known limitations, caveats, and in-progress work plainly — never hide them. Use `*Note: ...*` italics for short asides.
- **No hype filler.** Avoid "revolutionary", "game-changing", marketing superlatives. Let the feature speak through concrete capabilities.
- **Emojis: almost never.** A single ❤️ in the closing line of a milestone release is the only precedent. Do not sprinkle emojis through headings or bullets.

---

## 2. Document structure

A release note is a standalone Markdown document. It is **not** prefixed with a version number or date in the body — those are attached by the release pipeline. The body starts directly with the first section.

### 2.1 Overall skeleton

```
<optional opening paragraph — only for milestone releases>

---

## <Feature Name>[ - <Tagline>]

<optional 1-sentence intro paragraph>

### What You Can Do

- **<Action>** – <benefit>.
- **<Action>** – <benefit>.

*Note: <caveat, if any>.*

---

## <Next Feature Name>[ - <Tagline>]

...

---

## Bug Fixes

- <Past-tense description of what was fixed>.

---

## Known Issues

- <Honest description of the limitation>.
- <What's being done about it>.

---

*<Italic closing signoff.>*
```

Not every release has every section. **Bug Fixes** and **Known Issues** are optional and omitted when empty. The opening paragraph is reserved for milestone releases (first release, big redesigns). Most update releases start directly with the first `## Feature` section.

### 2.2 Separators

- Use a horizontal rule (`---` on its own line) between every top-level section, **and** before the closing signoff.
- Do **not** use `---` between sub-bullets or inside a feature block.
- Always put a blank line before and after the `---`.

### 2.3 Headings

- `##` for each feature, bug-fix group, known-issues block, or community call-to-action.
- `###` for sub-sections inside a feature (`### What You Can Do` is the canonical pattern, but `### <Descriptive Header>` is fine when the feature has multiple facets — see the milestone release's `### Summary Tab` / `### Detailed Tab` nested bullets).
- Never use `#` — the release title is rendered by the pipeline.
- Never use `####` or deeper.

### 2.4 Feature titles with taglines

For update releases, feature headers often use the pattern:

```
## <Feature Name> - <Short Tagline>
```

The tagline is a 2–4 word phrase that frames the *feeling* of the feature, not a description. Examples from shipped releases:

- `## Item Purchase Alerts - Real-Time Awareness`
- `## Overlay Editor - Customize Your Experience`

Use a regular hyphen surrounded by spaces (` - `), **not** an em dash, between the name and the tagline. The tagline is optional — simple feature blocks can use just `## <Feature Name>`.

---

## 3. Bullet formatting

Bullets are the workhorse of release notes. Follow this exact pattern:

```markdown
- **<Bold label>** – <lowercase sentence describing the benefit>.
```

Rules:

- **Bold the label.** It's usually a verb phrase ("Analyze win rates", "Get instant notifications") or a noun phrase ("Summary Tab", "Detailed Tab").
- **Separator is an en dash `–`** with a single space on each side. Not a hyphen (`-`), not an em dash (`—`). On Windows, the en dash is `Alt+0150`; copy from an existing release note if unsure.
- **Lowercase** the word after the en dash unless it's a proper noun.
- **End every bullet with a period.**
- **One idea per bullet.** If you're tempted to use a semicolon, split it.

### 3.1 Nested bullets

Nested bullets are used when a bullet has structured sub-items. Follow the milestone release pattern:

```markdown
- Each match includes:
  - **Summary Tab** – powered by Overwolf Game Events.
  - **Detailed Tab** – deeper stats powered by an open-source API.
```

Indent nested bullets with **2 spaces**. The parent bullet ends in a colon, not a period.

### 3.2 Plain bullets (no bold label)

For Bug Fixes and Known Issues, bullets are usually plain sentences without a bold label:

```markdown
## Bug Fixes

- Fixed an issue where the app displayed release notes from the wrong companion app.
```

Bug-fix bullets start with a past-tense verb: **Fixed**, **Resolved**, **Corrected**. Known-issue bullets describe the current state plainly.

---

## 4. Recurring sections

### 4.1 `### What You Can Do`

This is the canonical sub-section for announcing a new feature. Use it whenever a feature exposes multiple player-facing capabilities. The bullets inside should be action-oriented — every bullet starts with a bold verb phrase describing something the player *does* or *gets*.

### 4.2 `## Bug Fixes`

Plain bulleted list, past-tense. One bullet per fix. Keep each fix short and user-visible. Don't describe internal refactors here.

### 4.3 `## Known Issues`

Used to pre-empt confusion about limitations. Format:

```markdown
## Known Issues

- <Plain description of the limitation and its cause>.
- <What the team is doing about it>.
- <Why the feature still ships despite the issue>, if applicable.
```

Be specific about the cause when it's external (e.g. "Due to recent changes in **Overwolf's Game Events**").

### 4.4 Community / Discord / Contribute blocks

When a release includes a community call-to-action, give it its own `##` section. Examples from shipped releases:

- `## Join Our Discord`
- `## Community-Driven Platform`
- `### Contribute (Community-Driven Data)`

These sections can use prose paragraphs more freely than feature sections, and are a good place for inline links:

```markdown
We've launched an [official Discord server](https://discord.gg/rUNRBxV9bz) to stay connected with the community.
```

Use standard Markdown link syntax. Never paste bare URLs.

### 4.5 Closing signoff

End the document with a single italic line, preceded by a `---`. Examples:

- `*Thanks for using Deadlock Companion. Your feedback continues to shape every update - see you in the next match.*`
- For milestone releases only, a warmer multi-line close is acceptable, ending with `❤️`.

The signoff is **always italic**, **always player-facing**, and **never** mentions versions, commits, or internal terminology.

---

## 5. Inline formatting

- **Bold** (`**text**`) for: feature names on first mention, bullet labels, emphasized key terms.
- *Italic* (`*text*`) for: short asides prefixed with `*Note: ...*`, and the closing signoff.
- `Backticks` are **not** used in release notes. These are player-facing — no code, no file paths, no API identifiers.
- Links use `[label](url)` inline. Link labels should read naturally in a sentence ("official Discord server"), not as bare URLs or "click here".

---

## 6. What to include vs. what to leave out

**Include:**

- New player-visible features and views.
- Meaningful UX changes (redesigned screens, new customization).
- Bug fixes the player would have noticed.
- Honest known issues that affect the player experience.
- Community-facing announcements (Discord, contribution programs).

**Leave out:**

- Refactors, internal rewrites, dependency bumps, CI changes.
- Fixes for bugs that never shipped.
- Low-level implementation details (API endpoints, component names, Zustand stores).
- Agent / tooling changes.

If you're unsure whether something belongs, ask: *would a player notice or care about this?* If no, cut it.

---

## 7. Writing checklist

Before shipping a release note, verify:

- [ ] Opens with a feature section or a milestone intro paragraph — not with a date or version number.
- [ ] Every feature has a `##` heading, optionally followed by ` - <Tagline>`.
- [ ] Bullets use `**Label** – description.` with an en dash.
- [ ] Every bullet ends with a period.
- [ ] Caveats are called out with `*Note: ...*` in italics.
- [ ] `## Bug Fixes` (if present) uses plain past-tense bullets.
- [ ] `## Known Issues` (if present) is honest and specific.
- [ ] `---` separators sit between every top-level section and before the signoff.
- [ ] Closes with a single italic signoff line.
- [ ] No backticks, no code, no internal jargon, no unnecessary emojis.
- [ ] Reads as if the player is being spoken to directly.

---

## 8. Reference: canonical examples

The two shipped releases that define this style are:

- **Initial release (1.1.0)** — sets the tone for milestone releases: opens with a welcome paragraph, groups features under `## Core Features`, ends with a warm ❤️ closing.
- **Item Tier List update (1.2.x)** — sets the tone for update releases: no opening paragraph, features as top-level `##` with taglines, `### What You Can Do` sub-sections, `## Bug Fixes` before the italic signoff.

When in doubt, open the closest matching shipped release and mirror its structure.
