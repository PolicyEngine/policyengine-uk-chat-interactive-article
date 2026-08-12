# PolicyEngine UK Chat: an AI interface for tax and benefits

_Introducing PolicyEngine's newest AI-powered tool to help users understand UK tax and benefit policy_

_11 August 2026_

People are increasingly turning to AI language models to answer complex questions about tax and benefit policy and reform because models can read loosely worded questions and answer them in plain language. This presents a problem: for many users, tax and benefit questions directly affect their lives and livelihoods, so they require correct, verifiable answers. Language models generate responses from learned statistical patterns, and an answer may be partly or wholly wrong.

PolicyEngine therefore built UK Chat, an AI interface to PolicyEngine's deterministic rules and simulation engine. A language model interprets an open-ended request and proposes a structured plan. The gateway checks the proposed inputs and output against the current PolicyEngine catalogue; only then do deterministic tools compute quantitative policy results from actual tax and benefit rules.

## Separating calculation

A language model generates text by predicting continuations, not by applying tax and benefit rules. Ask one what Universal Credit (UC) a lone parent receives and it may return a number without factoring in UC's income-based taper rate, work allowance, or the rates that apply to the household's circumstances.

Prompting does not make a model apply tax and benefit rules. Telling it to state only “real” figures changes the wording, not the source of the calculation. The answer reads the same whether it is right or wrong, so prose alone cannot verify it. The UK Parliament's Parliamentary Office of Science and Technology has noted that confidently presented AI output can make errors difficult to challenge.

This matters when results inform decisions, as the National Audit Office's review of AI in government illustrates. Anyone comparing two reforms needs figures from a fixed model, not an AI's recollection of figures it has seen. The same applies to a household working out how a reform affects its income: the figure has to come from clear rules, with assumptions written down, so that it can be checked.

We have measured this directly. In PolicyBench, an evaluation built on the US tax and benefit system, we scored how accurately AI models compute taxes and benefits from household prompts with no tools and no lookups, against deterministic PolicyEngine outputs. In the launch results the top model matched PolicyEngine exactly on 80.3% of its scored outputs. Computed amounts scored lowest: income tax before credits scored far below eligibility flags, because getting it right means sequencing income concepts, thresholds, exclusions, and credits in the correct order.

## The boundary

The central design decision is where the predictive layer stops and the deterministic layer starts.

The predictive parts are interpreting wording, deciding which kind of analysis is being requested, drafting the explanation, and suggesting a follow-up. Those tasks are open-ended and language-heavy.

The deterministic parts are the ones users need to be able to check: validating the request, looking up parameters, constructing household inputs, running simulations, computing weighted outputs, and producing chart data. None of these depends on model memory. The runtime enforces the boundary rather than asking the model to respect it in a prompt.

When a question is ready for computation, the model receives the calculation tools plus a reference generated from the installed engine: the engine's capabilities and parameter schema. What the model can be asked to compute is therefore tied to the deployed version of PolicyEngine, not to a hand-written prompt that drifts out of date.

The gateway sits on that line. It takes the plan the model proposes and decides whether it may cross into the deterministic side, which is why the system has three parts rather than two: the model, the gateway, and the tools a plan reaches once the gateway admits it.

## The model proposes a plan

UK Chat breaks the user pathway into three segments: the AI model, the gateway, and supporting tools.

First, the language model does the predictive work. It takes the user's open-ended prompt and develops a simulation or analysis plan. The plan has a required format and must use one or more of the deterministic tools connected to the PolicyEngine UK tax and benefit simulation engine.

Next, UK Chat's gateway verifies and sometimes constrains that plan to ensure PolicyEngine provides the tools required to answer the question. The gateway may also ask the user for clarification before finalising a plan.

## Tools make the calculation deterministic

At this point, UK Chat has a gateway-verified plan, and every figure in the answer comes from the tools that plan calls rather than from the model.

The tools UK Chat exposes to the model are limited in scope. They fall into five types, each keeping the model within supported operations while it creates, verifies, or executes a plan.

### Discovery (9 tools)

Find exact variables, parameters, entities, reform targets, and supported outputs. Discovery keeps the model from guessing the names of things in PolicyEngine.

`list_entities`, `search_variables`, `get_variable`, `search_parameters`, `get_parameter`, `list_reform_targets`, `list_household_input_variables`, `list_society_output_variables`, `list_supported_outputs`

### Validation (2 tools)

Check reform JSON and synthetic household inputs before calculation. Validation turns malformed inputs into explicit errors rather than plausible-looking results.

`validate_reform`, `validate_household`

### Simulation (2 tools)

Run one illustrative household or a reform across the modelled UK population. These tools apply the tax and benefit rules and return turn-local result handles.

`run_household_simulation`, `run_society_simulation`

### Analysis (7 tools)

Turn a society simulation into specific, weighted policy results. Dedicated derivatives calculate budget, programme, decile, poverty, inequality, and gain-or-loss results.

`compute_budgetary_impact`, `compute_program_breakdown`, `compute_decile_impacts`, `compute_winners_losers`, `compute_poverty_metrics`, `compute_inequality_metrics`, `aggregate_result`

### Presentation (1 tool)

Build a chart from a calculation result using a constrained chart schema. Charts are constructed from stored results, so the displayed artefact stays tied to the calculation.

`generate_chart`

## Under the hood

Here's what happens inside a single request. UK Chat's core runtime is a FastAPI server-sent-events handler that calls the Anthropic SDK directly. There is no generic agent framework in the request path. The chat owns both the opening gateway and the tool loop, so the rules that matter can be enforced at the point where each decision is made. Each stage below is tagged with the segment that owns it.

### 1. Ground — A structured opening plan

_AI model_

A fast model reads the user's words and proposes a structured description of the request. It separates inputs the user supplied from the output they asked for and suggests which tools may be needed. This is an interpretation, not yet permission to calculate.

### 2. Resolve — Current catalogue evidence

_Gateway_

The gateway checks named policies, variables, and requested outputs against PolicyEngine's current catalogue. Exact and strong matches can support the plan; fuzzy matches remain suggestions rather than facts.

It then refines the plan with the relevant tool inputs and declared defaults — for example, using the current year when the user does not name one. Any choice the system cannot resolve safely stays explicit instead of being silently invented.

### 3. Gate — Five deterministic outcomes

_Gateway_

The gateway applies fixed policy to the grounded, catalogue-backed plan and assigns one of five outcomes. Only a ready request may enter the calculation loop.

- Ready: the request is complete and supported, so calculation can begin.
- Needs plan: a required choice is missing, so the chat asks a clarifying question.
- Partial: the request mixes supported and unsupported outputs, so the chat offers the supported part.
- Out of scope: the requested policy output cannot be modelled, so calculation tools stay closed.
- Irrelevant: the request is unrelated to UK tax and benefit policy and takes a lightweight response path.

### 4. Verify — Exact reform construction

_Gateway_

A society-wide reform receives a second bounded check. The resolver searches the rules engine's current reform targets, binds the user's wording to an exact parameter path and date, and constructs reform JSON. The validator must accept that construction before a simulation can run.

### 5. Calculate — A bounded 21-tool runtime

_Supporting tools_

A model selected for the request's type and size executes the verified plan through one or more of 21 public tools. Simulation tools apply the tax and benefit rules; analysis tools derive budget, programme, distributional, poverty, inequality, or gain-and-loss results from a stored simulation.

The model chooses and sequences tools, but it does not supply the figures. Each number comes back as tool data produced by the PolicyEngine UK model.

### 6. Stream — An inspectable response

_Gateway_

The gateway streams text chunks, tool starts, tool inputs, completion summaries, and the final answer as server-sent events. The interface can therefore show what the system tried and which computations completed while the answer is being produced.

The tool loop remains bounded by a 30-round cap, repeated-call detection, result-size limits, and explicit terminal events. Tool errors return as data so the model can recover without inventing a result.

## One reform, end to end

Consider: “For 2026, set the Child Benefit eldest-child rate to £30 a week and show the annual budgetary impact.” The request contains a policy, a final value, a year, and an output. It does not contain a PolicyEngine parameter path, a reform object, or the sequence of tools needed to answer it.

### User request

> For 2026, set the Child Benefit eldest-child rate to £30 a week and show the annual budgetary impact

1. **Ground** — _AI model_ — £30 a week, 2026, budgetary impact. Extract the requested value, policy year, and output from the user’s exact words, while keeping the proposed plan separate from verified facts.
2. **Resolve** — _Gateway_ — catalogue search, exact parameter. Bind “eldest-child rate” to gov.hmrc.child_benefit.amount.eldest in the current catalogue and confirm that budgetary impact is supported.
3. **Gate** — _Gateway_ — ready, all inputs explicit. Classify the plan as ready because its required policy, value, year, and output are present and supported. Only this outcome opens the calculation loop.
4. **Verify** — _Gateway_ — effective 1 January 2026, validate_reform. Construct an exact dated reform that sets the parameter to 30.0 pounds per week, then validate it against the PolicyEngine UK rules engine before simulation.
5. **Calculate** — _Supporting tools_ — run_society_simulation, compute_budgetary_impact. Run current law and the approved reform on the same population, store the result, and pass its handle to the budgetary-impact derivative.
6. **Stream** — _Gateway_ — tool events, method and result. Stream the calculation trace and final answer with the comparator, dataset, method, and sign convention attached so the result can be inspected.

### Computed result: About £0.9 billion a year in additional government cost

A production run compares the reform with 2026 current law using PolicyEngine's Enhanced Family Resources Survey dataset for 2024–25, release 1.56.13. It is a direct static microsimulation estimate. Tax revenue rises because a higher Child Benefit rate increases the High Income Child Benefit Charge paid by higher-income families.

| Measure              | Change        |
| -------------------- | ------------- |
| Tax revenue          | +£0.2 billion |
| Benefit spending     | +£1.1 billion |
| Net budgetary impact | −£0.9 billion |

A negative net budgetary impact means a cost to government. Figures are rounded to the nearest £0.1 billion.

If the catalogue returned more than one materially plausible interpretation, or the reform resolver could not determine what year or reform the user was requesting, the calculation would pause before the tool loop and ask the user to confirm the intended construction.

## What you can ask

The Child Benefit reform above is one of four kinds of question supported today. A single thread can move between them — from a household example, to a full reform analysis, to a chart — without the reader leaving the conversation.

### Households — Illustrative calculations

> A single parent, two children, earning £28,000 — what do they take home?

The household is constructed as a synthetic input, validated, and run through the model to produce taxes, benefits, and net income under stated assumptions. One household containing one benefit unit per call; more complex arrangements need separate calls.

`list_household_input_variables`, `validate_household`, `run_household_simulation`

### Reforms — Population-wide impact

> How much does raising the personal allowance by £2,000 cost, and who gains?

Parametric reforms run across the modelled UK population: budgetary impact, programme-level changes, poverty measures, decile impacts, winners and losers, and weighted caseload counts, each from its own derivative tool.

`validate_reform`, `run_society_simulation`, `compute_budgetary_impact`

### Charts — Computed outputs, drawn

> Show me that by decile.

When a comparison reads better as a picture than as prose, the computed output is mapped onto a fixed chart preset. The chart is drawn from the same typed result as the text, so the two cannot disagree.

`generate_chart`

### Follow-ups — One continuous thread

> And what if I made it £3,000 instead?

Follow-ups stay in the same thread. The conversation carries the context; the simulation handles do not. Each turn re-runs what it needs, so a later answer never quietly rests on an earlier turn’s in-memory state.

## Limitations

The chat is a modelling tool, not advice. It reports what the model calculates under stated assumptions, and it is not a substitute for professional guidance on an individual's circumstances.

Society results are direct static microsimulation estimates. They do not estimate behavioural responses, employment effects, inflation, GDP, market reactions, or general-equilibrium effects. When a request mixes a supported policy result with one of those effects, the gateway notifies the user that it cannot calculate these effects, then proceeds with what it can.

Results depend on the dataset, year, and modelling assumptions, and the chat states these dependencies rather than presenting figures as universal. They should still be checked against independent estimates from organisations such as the Institute for Fiscal Studies, Resolution Foundation, or Office for Budget Responsibility.

## What's next

We want to widen the range of reforms covered by typed tools, improve the speed and inspectability of more specialised analyses, and keep expanding the evidence the gateway can resolve before calculation. UK Chat also works alongside PolicyEngine's wider generative AI integrations and plugin ecosystem for researchers building their own analyses.

## Try it yourself

UK Chat's answers can be cited and reproduced because the figures come from the same open engine that powers the rest of PolicyEngine. Try it with a reform, then inspect the stated year, dataset, comparator, and method alongside the answer.
