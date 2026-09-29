---
name: software-project-alignment-interview
description: Use when analyzing software project changes, architecture proposals, refactoring scope, technical decisions, feature boundaries, or ambiguous implementation requests that require stakeholder alignment before planning or coding.
---

# Software Project Alignment Interview

## Overview

Conduct an interactive software project alignment interview before producing architecture analysis, technical plans, or implementation guidance.

Core principle: **negation before analysis**. First define what will not be analyzed, what can wait, and what only enters scope if explicitly confirmed.

## Operating Mode

Always assume the work is interactive.

Do not produce final recommendations, detailed plans, or code in the first response. The first response must align scope through interview questions.

Prefer multiple-choice questions. Ask one question at a time unless the user explicitly requests a full questionnaire.

## Required First Response

Start with:

```md
Antes de analisar a solucao, vou alinhar o escopo.

Nesta primeira rodada, minha premissa e NAO analisar tudo. Vou separar o que fica fora, o que pode ficar para depois e o que so entra se voce confirmar explicitamente.
```

Then present:

```md
## Escopo Negado Inicial

Posso ignorar nesta primeira analise?

- [ ] Implementacao em codigo
- [ ] Refatoracao ampla fora do ponto solicitado
- [ ] Seguranca, privacidade e compliance
- [ ] Performance, carga e benchmark
- [ ] Infraestrutura, deploy e CI/CD
- [ ] UI/UX detalhado
- [ ] Observabilidade avancada
- [ ] Estrategia completa de testes
- [ ] Migracao de dados
- [ ] Custos, licenciamento e vendor lock-in
- [ ] Documentacao operacional
- [ ] Roadmap de longo prazo
```

Then ask only the first alignment question:

```md
## Pergunta 1 - Qual e o objetivo principal desta analise?

Escolha uma opcao:

- [ ] Entender impacto arquitetural antes de implementar
- [ ] Comparar alternativas de solucao
- [ ] Reduzir risco de over-engineering
- [ ] Revisar uma proposta existente
- [ ] Preparar um plano tecnico futuro
- [ ] Outro: descreva brevemente
```

## Three Lenses

Use these lenses only after the initial scope is confirmed.

| Lens | Role | Key Question |
| --- | --- | --- |
| Software Architect | Evaluate structure, boundaries, coupling, risks, trade-offs, and evolution | What is the smallest coherent architectural decision for now? |
| Knowledge Engineer | Organize domain knowledge, constraints, dependencies, assumptions, and decision context | What must be explicit so the team can decide rationally? |
| Prompt Engineer | Turn ambiguity into precise instructions, options, criteria, and questions | Is the request clear enough to produce a reliable answer or plan? |

## Process

### 1. Declare Negation Scope

Before analysis, classify out-of-scope topics:

```md
## Escopo

### Ignorar nesta fase
- [item]

### Tratar em uma segunda rodada
- [item]

### Incluir somente se mencionado explicitamente
- [item]
```

If an excluded topic appears necessary, do not silently include it. Mention it at the end and ask for confirmation.

### 2. Interview Before Analysis

Ask one question at a time. Use multiple choice by default:

```md
Escolha uma opcao:

- [ ] Opcao A
- [ ] Opcao B
- [ ] Opcao C
- [ ] Outro: descreva brevemente
```

Use open-ended questions only when predefined options would distort the decision.

### 3. Map Decision Axes

After the initial answers, identify only relevant decision axes, such as:

- Functional scope
- Module boundaries
- Input/output contracts
- State and data lifecycle
- Persistence and consistency
- External integrations
- Error handling
- Testability
- Maintainability
- Future evolution

### 4. Analyze With Three Lenses

For each relevant axis:

```md
## Eixo: [nome]

### Software Architect
- Structural impact
- Coupling
- Complexity
- Evolution path

### Knowledge Engineer
- Required context
- Domain rules
- Missing information
- Decision dependencies

### Prompt Engineer
- Ambiguities
- Terms needing definition
- Acceptance criteria
- Questions required before execution
```

### 5. Expose Assumptions

Convert hidden assumptions into multiple-choice confirmations:

```md
## Suposicao

Estou assumindo que [suposicao]. Confirma?

- [ ] Sim
- [ ] Nao
- [ ] Parcialmente
- [ ] Outro: explique brevemente
```

### 6. Present Alternatives

For meaningful decisions, present alternatives before recommending:

```md
| Alternativa | Pros | Contras | Custo para mudar depois |
| --- | --- | --- | --- |
| Simples | Menor esforco, menor risco | Menos flexivel | Baixo |
| Intermediaria | Equilibra clareza e evolucao | Exige mais desenho | Medio |
| Robusta | Mais preparada para escala | Pode ser over-engineering agora | Alto |
```

### 7. Confirm Next Step

End each round with:

```md
## Proxima Etapa

Como deseja prosseguir?

- [ ] Continuar entrevista de alinhamento
- [ ] Gerar analise tri-lente
- [ ] Gerar alternativas com trade-offs
- [ ] Gerar plano tecnico de alto nivel
- [ ] Consolidar decisoes e parar aqui
- [ ] Outro: descreva brevemente
```

## Stop Rules

Do not produce final recommendations, detailed implementation plans, or code while:

- The negation scope is not confirmed.
- The main objective is unclear.
- Critical assumptions are not validated.
- Ambiguities could change the decision.
- The stakeholder has not selected the next step.

## Handling Ambiguity

If ambiguity appears, stop and ask:

```md
Identifiquei um ponto turvo antes de prosseguir: [descricao curta].

Como devo tratar isso?

- [ ] Ignorar nesta fase
- [ ] Incluir na analise agora
- [ ] Deixar para uma segunda rodada
- [ ] Reformular o pedido antes de continuar
- [ ] Outro: descreva brevemente
```

## Common Mistakes

- Producing a full analysis before confirming what can be ignored.
- Treating excluded topics as implicitly included.
- Asking several open-ended questions at once.
- Recommending architecture before exposing assumptions.
- Turning the first response into an implementation plan.

## Expected Output

Produce progressive alignment, not a monolithic answer. Quality is measured by:

- Explicit negation scope
- Clear questions
- Selectable response options
- Exposed assumptions
- Alternatives with trade-offs
- Confirmed next step
