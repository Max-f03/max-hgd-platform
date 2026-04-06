# Design System Admin - Max HGD Platform

## Vision
- Light mode: clarte, vitesse de lecture, productivite.
- Dark mode: focus, confort visuel, profondeur.
- Regle d'or: Light et Dark sont deux systemes paralleles, pas une inversion brutale.

## Core Tokens

### Light
- `--ui-bg`: `#F8FAFC`
- `--ui-card`: `#FFFFFF`
- `--ui-text`: `#0F172A`
- `--ui-text-secondary`: `#334155`
- `--ui-text-muted`: `#64748B`
- `--ui-border`: `#E2E8F0`
- `--ui-primary`: `#2563EB`
- `--ui-primary-hover`: `#1E40AF`
- `--ui-primary-soft`: `#DBEAFE`
- `--ui-input-bg`: `#FFFFFF`

### Dark
- `--ui-bg`: `#0B1220`
- `--ui-card`: `#111827`
- `--ui-text`: `#E5E7EB`
- `--ui-text-secondary`: `#9CA3AF`
- `--ui-text-muted`: `#6B7280`
- `--ui-border`: `#1F2937`
- `--ui-primary`: `#3B82F6`
- `--ui-primary-hover`: `#60A5FA`
- `--ui-primary-soft`: `rgba(59,130,246,0.15)`
- `--ui-input-bg`: `#0F172A`

## Semantic Status Tokens
- `--ui-status-info-bg` / `--ui-status-info-text`
- `--ui-status-success-bg` / `--ui-status-success-text`
- `--ui-status-warning-bg` / `--ui-status-warning-text`
- `--ui-status-neutral-bg` / `--ui-status-neutral-text`

Utiliser ces tokens pour badges, tags, chips et etats plutot que des couleurs hardcodees.

## Dashboard Tokens
- Gradients CTA: `--d-grad-primary-start`, `--d-grad-primary-end`
- Gradient insight: `--d-grad-insight-start`, `--d-grad-insight-mid`, `--d-grad-insight-end`
- Graphiques: `--d-chart-1` a `--d-chart-5`

## Kanban Tokens
- Backlog: `--k-backlog-*`
- Todo: `--k-todo-*`
- In progress: `--k-in-progress-*`
- Review: `--k-review-*`
- Testing: `--k-testing-*`
- Done: `--k-done-*`

Chaque groupe couvre: fond colonne, bordure, header, texte header, dot.

## Component Rules
- Buttons: accent via `--ui-primary`, hover via `--ui-primary-hover`.
- Inputs/Select/Textarea: fond `--ui-input-bg`, bordure `--ui-border`, focus ring primaire.
- Cards/Modal: fond `--ui-card`, bordure `--ui-border`, transitions douces 250ms.
- Ne jamais utiliser de noir pur en dark.
- Eviter les ombres lourdes en dark; privilegier contraste de surface.

## Interaction Rules
- Chaque action critique doit afficher un etat: loading, success ou error.
- Actions deplacement (Kanban) doivent proposer `Undo` quand possible.
- Les feedbacks doivent etre visibles sans casser le flow (toast, badge, inline status).

## Checklist Avant Merge
- Les couleurs sont tokenisees (pas de hardcode inutile).
- Le composant est lisible en Light et Dark.
- Les statuts utilisent les tokens semantiques.
- Les transitions restent subtiles et coherentes.
