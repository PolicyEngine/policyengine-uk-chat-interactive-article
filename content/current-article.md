**Beta**

# PolicyEngine UK Chat: an AI interface for tax and benefits

_Introducing PolicyEngine's newest AI-powered tool to help users understand UK tax and benefit policy_

People are increasingly turning to AI language models to answer complex questions about tax and benefit policy and reform because these models can read loosely worded questions and answer them in plain language. This presents a problem: for many users, tax and benefit questions directly affect their lives and livelihoods, so they require correct, verifiable answers. Language models generate responses from learned statistical patterns, and an answer may be partly or wholly wrong.

PolicyEngine therefore built UK Chat, an AI interface to PolicyEngine's deterministic rules and simulation engine. A language model interprets an open-ended request and proposes a structured plan. The gateway checks the proposed inputs and output against the current PolicyEngine catalogue; only then do deterministic tools compute quantitative policy results from actual tax and benefit rules.

UK Chat is released as a **beta**. The pipeline described here is in place and running, but the range of reforms it covers, the wording of its answers, and its judgement about what it cannot compute are all still being tested. We are publishing it at this stage to gather feedback on where it is useful and where it falls short, beginning with PolicyEngine's own policy team.

[Try PolicyEngine UK Chat (beta)](https://policyengine.org/uk/chat)

## How policy analysis is done today

PolicyEngine already answers questions of this kind, but not in conversation. Someone costing a Child Benefit change either builds the reform by hand in the web app, or writes code against the model: find the parameter path, construct a reform, run baseline and reform over the same microdata, read off the measure. Both routes are precise and fully inspectable, and both call the engine UK Chat calls underneath. Both also ask the same thing of the person using them: knowing which parameter carries the policy, how to express the change, and which output answers the question.

For a policy analyst, a journalist, or a household working out what a reform would mean for them, the barrier is the setup rather than the arithmetic — and prompting a general-purpose language model looks like the way around it. The rest of this article is about why that shortcut does not produce a figure anyone can rely on. UK Chat replaces neither route, but for the questions its tools already cover it removes the setup and leaves the calculation where it was.

## Separating calculation

A language model generates text by predicting continuations, not by applying tax and benefit rules. Ask one what Universal Credit (UC) a lone parent receives and it may return a number without factoring in UC's income-based taper rate, work allowance, or the rates that apply to the household's circumstances.

Prompting does not make a language model apply tax and benefit rules. Telling it to state only “real” figures changes the wording, not the source of the calculation. The answer reads the same whether it is right or wrong, so prose alone cannot verify it. The UK Parliament's Parliamentary Office of Science and Technology has noted that confidently presented AI output can make errors difficult to challenge.

This matters when results inform decisions, as the National Audit Office's review of AI in government illustrates. Anyone comparing two reforms needs figures from a fixed microsimulation, not an AI's recollection of figures it has seen. The same applies to a household working out how a reform affects its income: the figure has to come from clear rules, with assumptions written down, so that it can be checked.

We have measured this directly. In PolicyBench, an evaluation built on the US tax and benefit system, we scored how accurately AI models compute taxes and benefits from household prompts with no tools and no lookups, against deterministic PolicyEngine outputs. In the launch results the top language model matched PolicyEngine exactly on 80.3% of its scored outputs. Computed amounts scored lowest: income tax before credits scored far below eligibility flags, because getting it right means sequencing income concepts, thresholds, exclusions, and credits in the correct order.

## The boundary

The central design decision is where the predictive layer stops and the deterministic layer starts.

The predictive parts are interpreting wording, deciding which kind of analysis is being requested, drafting the explanation, and suggesting a follow-up. Those tasks are open-ended and language-heavy.

The deterministic parts are the ones users need to be able to check: validating the request, looking up parameters, constructing household inputs, running simulations, computing weighted outputs, and producing chart data. None of these depends on the language model's memory. The runtime enforces the boundary rather than asking the language model to respect it in a prompt.

When a question is ready for computation, the language model receives the calculation tools, but not a list of what exists in the model. It has to ask: names are confirmed by calling discovery tools against the deployed package, so a policy the model half-remembers either resolves to a real parameter path or fails to resolve at all. The gateway works the same way from the other side, describing the tools from their own schemas so its vocabulary cannot drift from what the tools actually accept.

The gateway sits on that line. It takes the plan the language model proposes and decides whether it may cross into the deterministic side. That is why the system has three parts rather than two: the language model, the gateway, and the tools a plan reaches once the gateway admits it.

## The language model proposes a plan

UK Chat breaks the user pathway into three segments: the language model, the gateway, and supporting tools.

First, the language model does the predictive work. It takes the user's open-ended prompt and develops a simulation or analysis plan. The plan has a required format and must use one or more of the deterministic tools connected to the PolicyEngine UK tax and benefit simulation engine.

Next, UK Chat's gateway verifies and sometimes constrains that plan to ensure PolicyEngine provides the tools required to answer the question. The gateway may also ask the user for clarification before finalising a plan.

## Tools make the calculation deterministic

At this point, UK Chat has a gateway-verified plan, and every figure in the answer comes from the tools that plan calls rather than from the language model.

The tools UK Chat exposes to the language model are limited in scope. They fall into five types, each keeping it within supported operations while it creates, verifies, or executes a plan.

### Discovery (9 tools)

Find exact variables, parameters, entities, reform targets, and supported outputs. Discovery keeps the language model from guessing the names of things in PolicyEngine.

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

Build a chart from a calculation result using a constrained chart schema. Policy charts are built from a stored result, so the displayed artefact stays tied to the calculation it came from.

`generate_chart`

## Under the hood

Here's what happens inside a single request. UK Chat's core runtime is a FastAPI server-sent-events handler that calls the Anthropic SDK directly. There is no generic agent framework in the request path. The chat owns both the opening gateway and the tool loop, so the rules that matter can be enforced at the point where each decision is made. Each stage below is tagged with the segment that owns it.

### 1. Ground — A structured opening plan

_Language model_

A fast language model reads the user's words and proposes a structured description of the request. It separates inputs the user supplied from the output they asked for and suggests which tools may be needed. This is an interpretation, not yet permission to calculate.

### 2. Resolve — Current catalogue evidence

_Gateway_

The gateway checks named policies, variables, and requested outputs against PolicyEngine's current catalogue. Exact and strong matches can support the plan; fuzzy matches remain suggestions rather than facts.

It then refines the plan with the relevant tool inputs and declared defaults — for example, using the current year when the user does not name one. Any choice the system cannot resolve safely stays explicit instead of being silently invented.

### 3. Gate — Five deterministic outcomes

_Gateway_

The gateway applies fixed policy to the grounded, catalogue-backed plan and assigns one of five outcomes. Only a ready request may enter the calculation loop.

The gate is deliberately biased towards computing. If the classifier errors or returns something the server cannot read, the request is treated as ready rather than refused, on the view that a wrong refusal costs more than a wrong attempt. The guarantees that follow come from the tools, not from the gate.

- Ready: the request is complete and supported, so calculation can begin.
- Needs plan: a required choice is missing, so the chat asks a clarifying question.
- Partial: the request mixes supported and unsupported outputs, so the chat offers the supported part.
- Out of scope: the requested policy output cannot be modelled, so calculation tools stay closed.
- Irrelevant: the request is unrelated to UK tax and benefit policy and takes a lightweight response path.

### 4. Verify — Exact reform construction

_Gateway_

A society-wide reform receives a second bounded check. The resolver searches the rules engine's current reform targets, binds the user's wording to an exact parameter path and date, and constructs reform JSON. The validator must accept that construction before a simulation can run.

What the gateway approves is then the only reform that can run. The simulation tool compares the reform it is handed against the approved construction and refuses anything that does not match, so a different reform cannot be substituted after the check has passed.

### 5. Calculate — A bounded 21-tool runtime

_Supporting tools_

A language model selected for the request's type and size executes the verified plan through one or more of 21 public tools. Simulation tools apply the tax and benefit rules; analysis tools derive budget, programme, distributional, poverty, inequality, or gain-and-loss results from a stored simulation.

The language model chooses and sequences tools, but it does not supply the figures. Each number comes back as tool data produced by the PolicyEngine UK model.

### 6. Stream — An inspectable response

_Gateway_

The gateway streams text chunks, tool starts, tool inputs, completion summaries, and the final answer as server-sent events. The interface can therefore show what the system tried and which computations completed while the answer is being produced.

The tool loop remains bounded by a 30-round cap, repeated-call detection, result-size limits, and explicit terminal events. Tool errors return as data so the language model can recover without inventing a result.

## One reform, end to end

Consider: “For 2026, set the Child Benefit eldest-child rate to £30 a week and show the annual budgetary impact.” The request contains a policy, a final value, a year, and an output. It does not contain a PolicyEngine parameter path, a reform object, or the sequence of tools needed to answer it.

### User request

> For 2026, set the Child Benefit eldest-child rate to £30 a week and show the annual budgetary impact

1. **Ground** — _Language model_ — £30 a week, 2026, budgetary impact. Extract the requested value, policy year, and output from the user’s exact words, while keeping the proposed plan separate from verified facts.
2. **Resolve** — _Gateway_ — catalogue search, exact parameter. Bind “eldest-child rate” to gov.hmrc.child_benefit.amount.eldest in the current catalogue and confirm that budgetary impact is supported.
3. **Gate** — _Gateway_ — ready, all inputs explicit. Classify the plan as ready because its required policy, value, year, and output are present and supported. Only this outcome opens the calculation loop.
4. **Verify** — _Gateway_ — effective 1 January 2026, validate_reform. Construct an exact dated reform that sets the parameter to 30.0 pounds per week, then validate it against the PolicyEngine UK rules engine before simulation.
5. **Calculate** — _Supporting tools_ — run_society_simulation, compute_budgetary_impact. Run current law and the approved reform on the same population, store the result, and pass its handle to the budgetary-impact derivative.
6. **Stream** — _Gateway_ — tool events, method and result. Stream the calculation trace and final answer with the comparator, dataset, method, and sign convention attached so the result can be inspected.

Those stages describe what the system decides. Underneath, the turn is a short sequence of typed calls, each one taking an argument that an earlier call produced. This is that sequence for the request above.

### Tool-call trace — 5 calls, one turn

**1. Find the target** — _Discovery_

```
list_reform_targets(
  query="child benefit eldest"
)
```

- ✓ gov.hmrc.child_benefit.amount.eldest
- · returned from the installed UK package, not from memory
- · “eldest-child rate” is an alias the catalogue resolves

**2. Read current law** — _Discovery_

```
get_parameter(
  path="gov.hmrc.child_benefit.amount.eldest",
  year=2026
)
```

Returned:

```
{
  "unit": "currency-GBP",
  "period": "week",
  "value": …the 2026 rate in the deployed package…
}
```

- · the comparator is whatever the package holds, not a remembered rate
- · the unit and period fix what “£30 a week” has to be written as

**3. Validate** — _Validation_

```
validate_reform(
  reform={
    "gov.hmrc.child_benefit.amount.eldest": {
      "2026-01-01.2026-12-31": 30.0
    }
  },
  year=2026
)
```

- ✓ the path exists in the parameter schema
- ✓ 30.0 is the right type for a currency-GBP parameter
- ✓ the date range falls inside the package's coverage
- Note: an unrecognised path is rejected here.

**4. Simulate** — _Simulation_

```
run_society_simulation(
  reform={ …validated above… },
  year=2026
)
```

Returned to the language model:

```
{
  "simulation_id": "sim_…",
  "dataset": "enhanced_frs",
  "year": 2026
}
```

Not returned:

- ✗ household rows
- ✗ survey weights
- ✗ any serialisable simulation object

**5. Compute** — _Analysis_

```
compute_budgetary_impact(
  simulation_id="sim_…"
)
```

Computed inside the engine:

- ✓ baseline and reform totals for tax revenue and benefit spending
- ✓ the net budgetary impact reported below
- ✓ survey weights applied inside the PolicyEngine UK model
- Stored: `result_id` → typed handle, turn-local.

Two features of the sequence carry most of the design. The first is that `run_society_simulation` hands back a handle rather than data: the language model receives a `simulation_id`, a dataset name, and a year, and never receives household rows, survey weights, or any serialisable simulation object. Weighting happens inside the PolicyEngine UK model, and the seven analysis tools are the only route from a stored simulation to a number.

The second is provenance. Every parameter path, value, and handle in the sequence was either supplied by the user or produced by a preceding call, so each argument can be traced to its source. Nothing in it was recalled.

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

The Child Benefit reform above is one of four kinds of questions supported today, and users can stack these questions within one conversation without starting a new chat.

### Households — Illustrative calculations

> A single parent, two children, earning £28,000 — what do they take home?

The household is constructed as a synthetic input, validated, and run through the PolicyEngine UK model to produce taxes, benefits, and net income under stated assumptions. Each call covers one household containing one benefit unit. More complex arrangements need separate calls.

`list_household_input_variables`, `validate_household`, `run_household_simulation`

### Reforms — Population-wide impact

> How much does raising the personal allowance by £2,000 cost, and who gains?

Parametric reforms run across the modelled UK population: budgetary impact, programme-level changes, poverty measures, decile impacts, winners and losers, and weighted caseload counts, each from its own derivative tool.

`validate_reform`, `run_society_simulation`, `compute_budgetary_impact`

### Charts — Computed outputs, drawn

> Show me that by decile.

When a comparison reads better as a picture than as prose, the computed output is mapped onto a fixed chart preset. A policy preset has to name the stored result it draws, so that chart and the text around it cannot disagree.

`generate_chart`

### Follow-ups — One continuous thread

> And what if I made it £3,000 instead?

Follow-ups stay in the same thread. The conversation carries the context; the simulation handles do not. Each turn re-runs what it needs, so a later answer never quietly rests on an earlier turn’s in-memory state.

## Limitations

Some of what follows is a deliberate boundary that will not change. The rest is the current state of a beta: reform coverage is incomplete, answers vary in how fully they state their assumptions, and gateway behaviour will move as we act on what users report.

The chat is a modelling tool, not advice. It reports what the engine calculates under stated assumptions, and it is not a substitute for professional guidance on an individual's circumstances.

Society results are direct static microsimulation estimates. They do not estimate behavioural responses, employment effects, inflation, GDP, market reactions, or general-equilibrium effects. When a request mixes a supported policy result with one of those effects, the gateway says which part it cannot calculate and asks whether to run the part it can, rather than running anything that turn.

Results depend on the dataset, year, and modelling assumptions, and the chat states these dependencies rather than presenting figures as universal. They should still be checked against independent estimates from organisations such as the Institute for Fiscal Studies, Resolution Foundation, or Office for Budget Responsibility.

## What's next

We want to widen the range of reforms covered by typed tools, improve the speed and inspectability of more specialised analyses, and keep expanding the evidence the gateway can resolve before calculation. UK Chat also works alongside PolicyEngine's wider generative AI integrations and plugin ecosystem for researchers building their own analyses.

## Try it yourself

UK Chat's answers can be cited and reproduced because the figures come from the same open engine that powers the rest of PolicyEngine. Try it with a reform, then inspect the stated year, dataset, comparator, and method alongside the answer.

Because this is a beta, the cases where it fails are more useful to us than the cases where it works: a request refused that the tools should support, an answer that omits an assumption it should state, or a figure that does not match what the engine returns for the same reform. PolicyEngine's policy team is working through the same exercise, and what they and other early users report will decide what we change first.

[Try PolicyEngine UK Chat (beta)](https://policyengine.org/uk/chat)
