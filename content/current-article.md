# PolicyEngine UK Chat: an AI interface for tax and benefits

_Introducing PolicyEngine’s newest AI-powered tool to help users understand UK tax and benefit policy_

People are increasingly turning to AI language models to answer complex questions about tax and benefit policy and reform because models can read loosely worded questions and answer them in plain language. This presents a problem: for many users, tax and benefit questions directly affect their lives and livelihoods, so they require correct, verifiable answers. Language models generate responses from learned statistical patterns, and an answer may be partly or wholly wrong.

PolicyEngine therefore built UK Chat, an AI interface to PolicyEngine’s deterministic rules and simulation engine. A language model interprets an open-ended request and proposes a structured plan. The gateway checks the proposed inputs and output against the current PolicyEngine catalogue; only then do deterministic tools compute quantitative policy results from actual tax and benefit rules.

## Separating calculation

A language model generates text by [predicting continuations](https://en.wikipedia.org/wiki/Large_language_model), not by applying tax and benefit rules. Ask one what Universal Credit (UC) a lone parent receives and it may return a number without factoring in UC’s income-based taper rate, work allowance, or the rates that apply to the household’s circumstances.

Prompting does not make a model apply tax and benefit rules. Telling it to state only “real” figures changes the wording, not the source of the calculation. The answer reads the same whether it is right or wrong, so prose alone cannot verify it. The UK Parliament’s [Parliamentary Office of Science and Technology](https://post.parliament.uk/research-briefings/post-pn-0708/) has noted that confidently presented AI output can make errors difficult to challenge.

This matters when results inform decisions, as the [National Audit Office’s review of AI in government](https://www.nao.org.uk/reports/use-of-artificial-intelligence-in-government/) illustrates. Anyone comparing two reforms needs figures from a fixed model, not an AI’s recollection of figures it has seen. The same applies to a household working out how a reform affects its income: the figure has to come from clear rules, with assumptions written down, so that it can be checked.

## The model proposes a plan

UK Chat breaks the user pathway into three segments: the AI model, the gateway, and supporting tools.

First, the AI language model does the predictive work it excels at. It takes the user’s open-ended natural-language prompt and develops a simulation or analysis plan. This plan has a required format and must use one or more deterministic tools that are directly connected to the PolicyEngine UK tax and benefit simulation engine.

Next, UK Chat’s gateway verifies and sometimes constrains that plan to ensure PolicyEngine provides the tools required to answer the question. The gateway may also ask the user for clarification before finalising a plan.

## Tools make the calculation deterministic

At this point, UK Chat has a gateway-verified plan. This plan relies on one or more deterministic tools so every figure displayed to a user is rooted in verifiable calculations rather than language-model predictions.

UK Chat’s model-facing tools are narrow by design. The tools fall into five types, each used to keep the model within supported operations while creating, verifying, or executing a plan. The interactive article lets readers explore each category and select individual tools for a one-sentence description.

## Under the hood

Here’s what happens inside a single request. UK Chat’s core runtime is a FastAPI server-sent-events handler that calls the Anthropic SDK directly. There is no generic agent framework in the request path. The chat owns both the opening gateway and the tool loop, so the rules that matter can be enforced at the point where each decision is made. Each stage below is tagged with the segment that owns it.

### 1 Ground — A structured opening plan (AI model)

A fast model reads the user’s words and proposes a structured description of the request. It separates inputs the user actually supplied from the output they asked for and suggests which tools may be needed. This is an interpretation, not yet permission to calculate.

### 2 Resolve — Current catalogue evidence (Gateway)

The gateway checks named policies, variables, and requested outputs against PolicyEngine’s current catalogue. Exact and strong matches can support the plan; fuzzy matches remain suggestions rather than facts.

It then refines the plan with the relevant tool inputs and declared defaults—for example, using the current year when the user does not name one. Any choice the system cannot resolve safely stays explicit instead of being silently invented.

### 3 Gate — Five deterministic outcomes (Gateway)

The gateway applies fixed policy to the grounded, catalogue-backed plan and assigns one of five outcomes. Only a **ready** request may enter the calculation loop.

- **Ready:** the request is complete and supported, so calculation can begin.
- **Needs plan:** a required choice is missing, so the chat asks a clarifying question.
- **Partial:** the request mixes supported and unsupported outputs, so the chat offers the supported part.
- **Out of scope:** the requested policy output cannot be modelled, so calculation tools stay closed.
- **Irrelevant:** the request is unrelated to UK tax and benefit policy and takes a lightweight response path.

### 4 Verify — Exact reform construction (Gateway)

A society-wide reform receives a second bounded check. The resolver searches the rules engine’s current reform targets, binds the user’s wording to an exact parameter path and date, and constructs reform JSON. The validator must accept that construction before a simulation can run.

### 5 Calculate — A bounded 21-tool runtime (Supporting tools)

A model selected for the request’s type and size executes the verified plan through one or more of 21 public tools. Simulation tools apply the tax and benefit rules; analysis tools derive budget, programme, distributional, poverty, inequality, or gain-and-loss results from a stored simulation.

The model chooses and sequences tools, but it does not supply the figures. Each number comes back as tool data produced by the PolicyEngine UK model.

### 6 Stream — An inspectable response (Gateway)

The gateway streams text chunks, tool starts, tool inputs, completion summaries, and the final answer as server-sent events. The interface can therefore show what the system tried and which computations completed while the answer is being produced.

The tool loop remains bounded by a 30-round cap, repeated-call detection, result-size limits, and explicit terminal events. Tool errors return as data so the model can recover without inventing a result.

## One reform, end to end

Consider: “For 2026, set the Child Benefit eldest-child rate to £30 a week and show the annual budgetary impact.” The request contains a policy, a final value, a year, and an output. It does not contain a PolicyEngine parameter path, a reform object, or the sequence of tools needed to answer it.

### User request

For 2026, set the eldest-child rate to £30 a week

1. **Ground (AI model)** — Extract £30 a week, 2026, and budgetary impact from the user’s exact words, while keeping the proposed plan separate from verified facts.
2. **Resolve (Gateway)** — Bind “eldest-child rate” to `gov.hmrc.child_benefit.amount.eldest` in the current catalogue and confirm that budgetary impact is supported.
3. **Gate (Gateway)** — Classify the plan as ready because its required policy, value, year, and output are present and supported. Only this outcome opens the calculation loop.
4. **Verify (Gateway)** — Construct an exact reform effective 1 January 2026 that sets the parameter to `30.0`, then validate it against the PolicyEngine UK rules engine.
5. **Calculate (Supporting tools)** — Run current law and the approved reform on the same population with `run_society_simulation`, then pass the stored result to `compute_budgetary_impact`.
6. **Stream (Gateway)** — Stream the calculation trace and final answer with the comparator, dataset, method, and sign convention attached so the result can be inspected.

### Computed result

A production run compares the reform with 2026 current law using PolicyEngine’s Enhanced Family Resources Survey dataset for 2024–25, release 1.56.13. It is a direct static microsimulation estimate.

| Annual change relative to current law |              Change |
| ------------------------------------- | ------------------: |
| Tax revenue                           |     +£181.0 million |
| Benefit spending                      |     +£1.131 billion |
| **Net budgetary impact**              | **−£949.7 million** |

A negative net budgetary impact means a cost to government: about £950 million a year in this run. Figures are rounded, so displayed components may not sum exactly.

If the catalogue returned more than one materially plausible interpretation, or the reform resolver could not determine what year or reform the user was requesting, the calculation would pause before the tool loop and ask the user to confirm the intended construction.

## Limitations

The chat is a modelling tool, not advice. It reports what the model calculates under stated assumptions, and it is not a substitute for professional guidance on an individual’s circumstances.

Society results are direct static microsimulation estimates. They do not estimate behavioural responses, employment effects, inflation, GDP, market reactions, or general-equilibrium effects. When a request mixes a supported policy result with one of those effects, the gateway notifies the user that it cannot calculate these effects, then proceeds with what it can.

Results depend on the dataset, year, and modelling assumptions, and the chat states these dependencies rather than presenting figures as universal. They should still be checked against independent estimates from organisations such as the Institute for Fiscal Studies, Resolution Foundation, or Office for Budget Responsibility.

## What’s next

We want to widen the range of reforms covered by typed tools, improve the speed and inspectability of more specialised analyses, and keep expanding the evidence the gateway can resolve before calculation. UK Chat also works alongside PolicyEngine’s wider Claude integration and plugin ecosystem for researchers building their own analyses.

## Try it yourself

UK Chat’s answers can be cited and reproduced because the figures come from the same open engine that powers the rest of PolicyEngine. [Try it with a reform you care about](https://policyengine-uk-chat.vercel.app/uk/chat), then inspect the stated year, dataset, comparator, and method alongside the answer.
