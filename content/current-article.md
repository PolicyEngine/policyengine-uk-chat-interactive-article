**Beta**

# PolicyEngine UK Chat: an AI interface for tax and benefits

_Introducing PolicyEngine's newest AI-powered tool to help users understand UK tax and benefit policy_

People are increasingly turning to AI language models to answer complex questions about tax and benefit policy and reform because these models can read loosely worded questions and answer them in plain language. This presents a problem: for many users, tax and benefit questions directly affect their lives and livelihoods, so they require correct, verifiable answers. Language models generate responses from learned statistical patterns, and an answer may be partly or wholly wrong.

PolicyEngine therefore built UK Chat, an AI interface to PolicyEngine's deterministic rules and simulation engine. A language model interprets an open-ended request and proposes a structured plan. The gateway checks the proposed inputs and output against the current PolicyEngine catalogue; only then do deterministic tools compute quantitative policy results from actual tax and benefit rules.

UK Chat is released as a **beta**. The pipeline described here is in place and running, but the range of reforms it covers, the wording of its answers, and its judgement about what it cannot compute are all still being tested. We are publishing it at this stage to gather feedback on where it is useful and where it falls short.

[Try PolicyEngine UK Chat (beta)](https://policyengine.org/uk/chat)

## How policy analysis is done today

PolicyEngine already provides tools to answer tax and benefit questions, but not in conversational format. For example, someone looking to determine the cost of a change to the Child Benefit can use one of two PolicyEngine features to do so. They can build the reform by hand in the web app, setting each parameter through the interface and reading the results off the charts it returns. Or they can write code against the PolicyEngine country model: find the parameter path in the catalogue, construct a reform object, run baseline and reform policies over the same survey microdata, then take the budgetary or distributional measure from the output. Either way, a first pass usually takes several attempts to settle the parameter, the date, and the measure.

Both routes are precise and fully inspectable, and both call the same engine UK Chat calls underneath. Both also ask the same thing of the person using them: knowing which parameter carries the policy, how to express the change, and which output answers the question. For a policy analyst, a journalist, or a household working out what a reform would mean for them, this setup is a real barrier.

To this user, prompting a general-purpose AI model may feel like a way around the barrier. However, as this article covers later, this shortcut does not necessarily produce reliable figures, given the current limitations of standard AI models. UK Chat overcomes this limitation by applying the strengths of conversational models to the same engine that already powers the web app and country models, reducing the setup friction mentioned earlier by providing a series of typed tools that ensure results are still deterministically calculated and grounded in fact.

## Separating calculation

A language model generates text by predicting continuations, not by applying tax and benefit rules. Ask one what Universal Credit (UC) a lone parent receives and it may return a number without factoring in UC's income-based taper rate, work allowance, or the rates that apply to the household's circumstances.

Prompting does not make a language model apply tax and benefit rules. Telling it to state only “real” figures changes the wording, not the source of the calculation. The answer reads the same whether it is right or wrong, so prose alone cannot verify it. The UK Parliament's Parliamentary Office of Science and Technology has noted that confidently presented AI output can make errors difficult to challenge.

This matters when results inform decisions, as the National Audit Office's review of AI in government illustrates. Anyone comparing two reforms needs figures from a fixed microsimulation, not an AI's recollection of figures it has seen. The same applies to a household working out how a reform affects its income: the figure has to come from clear rules, with assumptions written down, so that it can be checked.

We have measured this directly. In PolicyBench, an evaluation built on the US tax and benefit system, we scored how accurately AI models compute taxes and benefits from household prompts with no tools and no lookups, against deterministic PolicyEngine outputs. In the launch results the top language model matched PolicyEngine exactly on 80.3% of its scored outputs. Computed amounts scored lowest: income tax before credits scored far below eligibility flags, because getting it right means sequencing income concepts, thresholds, exclusions, and credits in the correct order.

## The boundary

UK Chat's central design decision is where the predictive layer stops and the deterministic layer starts.

The predictive parts are interpreting wording, deciding which kind of analysis is being requested, drafting the explanation, and suggesting a follow-up. Those tasks are open-ended and language-heavy.

The deterministic parts are the ones users need to be able to check: validating the request, looking up parameters, constructing household inputs, running simulations, computing weighted outputs, and producing chart data. None of these depends on the language model's memory. The runtime enforces the boundary rather than asking the language model to respect it in a prompt.

This boundary creates a three-part request path: the language model, the gateway, and supporting tools. The language model turns the user's open-ended prompt into a structured simulation or analysis plan. The gateway checks whether that plan is complete and supported, constraining it or asking the user for clarification when necessary, before calculation begins. Once the plan can proceed, the language model receives the calculation tools, but not a static catalogue of PolicyEngine policies and parameters. It must use discovery tools to resolve the user's wording against the deployed PolicyEngine package, so a policy name either maps to a current parameter path or remains unresolved. The gateway likewise derives its description of each tool from that tool's schema, keeping its checks aligned with the inputs those tools actually accept.

## Tools make the calculation deterministic

At this point, UK Chat has a gateway-verified plan, and every figure in the answer comes from the tools that plan calls rather than from the language model.

The tools UK Chat exposes to the language model are limited in scope. They fall into five types, each keeping it within supported operations while it creates, verifies, or executes a plan.

### Discovery (9 tools)

Find exact variables, parameters, entities, reform targets, and supported outputs. Discovery keeps the language model from guessing the names of things in PolicyEngine.

**`list_entities`** — Lists the PolicyEngine UK model entities and the number of variables defined for each one.

```
list_entities()
# returns
{
  "status": "success",
  "entities": [{ "name": "person", "variable_count": … }, …]
}
```

**`search_variables`** — Searches the UK variable registry and identifies each match’s entity and default-output status.

```
search_variables(
  query="employment income",
  entity="person"
)
# returns
{
  "variables": [
    { "name": "employment_income", "entity": "person",
      "value_type": "float", "definition_period": "year" }
  ]
}
```

**`get_variable`** — Verifies one exact UK variable and returns its metadata, entity, and default-output status.

```
get_variable(name="household_net_income")
# returns
{
  "variable": {
    "name": "household_net_income", "entity": "household",
    "value_type": "float", "is_default_society_output": true
  }
}
```

**`search_parameters`** — Searches policy parameters by path, label, description, or known alias.

```
search_parameters(query="personal allowance")
# returns
{
  "parameters": [
    { "path": "gov.hmrc.income_tax.allowances.personal_allowance.amount",
      "unit": "currency-GBP", "aliases": ["personal allowance", …] }
  ]
}
```

**`get_parameter`** — Looks up one exact policy parameter and returns its metadata and value for a selected year.

```
get_parameter(
  path="gov.hmrc.income_tax.allowances.personal_allowance.amount",
  year=2026
)
# returns
{
  "parameter": {
    "unit": "currency-GBP", "year": 2026,
    "value": …the 2026 allowance in the deployed package…
  }
}
```

**`list_reform_targets`** — Searches the current catalogue for parameter paths that can be used in a reform.

```
list_reform_targets(query="universal credit standard allowance")
# returns
{
  "targets": [
    { "path": "gov.dwp.universal_credit.standard_allowance.amount.SINGLE_OLD",
      "aliases": ["universal credit standard allowance", …] }
  ]
}
```

**`list_household_input_variables`** — Lists known variables that can be supplied as overrides for an illustrative household.

```
list_household_input_variables(entity="person")
# returns
{
  "entity": "person",
  "variables": [{ "name": "employment_income", … }, …],
  "input_contract": "policyengine.py accepts any known variable on its declared entity…"
}
```

**`list_society_output_variables`** — Lists the variables a society simulation materialises by default, grouped by entity.

```
list_society_output_variables(entity="household")
# returns
{
  "default_variables_by_entity": {
    "household": ["household_net_income", "household_tax", "household_benefits", …]
  },
  "default_variable_count": …
}
```

**`list_supported_outputs`** — Lists the household, society, derivative, and chart outputs supported by the chat runtime.

```
list_supported_outputs(scope="derivative")
# returns
{
  "scope": "derivative",
  "outputs": [
    { "scope": "derivative", "name": "budgetary_impact", "description": … }, …
  ]
}
```

### Validation (2 tools)

Check reform JSON and synthetic household inputs before calculation. Validation turns malformed inputs into explicit errors rather than plausible-looking results.

**`validate_reform`** — Validates flat PolicyEngine reform JSON for a selected year without running a simulation.

```
validate_reform(
  reform={ "gov.hmrc.income_tax.allowances.personal_allowance.amount": 15000 },
  year=2026
)
# returns
{
  "valid": true,
  "parameter_paths": ["gov.hmrc.income_tax.allowances.personal_allowance.amount"],
  "warnings": []
}
```

**`validate_household`** — Validates an illustrative synthetic UK household against PolicyEngine variable metadata.

```
validate_household(
  people=[{ "age": 35, "employment_income": 28000 }, { "age": 6 }, { "age": 3 }],
  household={ "country": "ENGLAND" }
)
# returns
{
  "valid": true,
  "year": 2026,
  "people_count": 3, "warnings": []
}
```

### Simulation (2 tools)

Run one illustrative household or a reform across the modelled UK population. These tools apply the tax and benefit rules and return turn-local result handles.

**`run_household_simulation`** — Runs an illustrative synthetic household through the PolicyEngine UK tax-benefit model.

```
run_household_simulation(
  people=[{ "age": 35, "employment_income": 28000 }, { "age": 6 }, { "age": 3 }],
  household={ "country": "ENGLAND" }
)
# returns
{
  "reform_applied": false,
  "household": { "household_net_income": …, "household_tax": … },
  "result_id": "household_simulation_…"
}
```

**`run_society_simulation`** — Runs baseline and reform UK simulations and returns metadata plus a turn-local result handle.

```
run_society_simulation(
  reform={ "gov.hmrc.income_tax.allowances.personal_allowance.amount": 15000 },
  year=2026
)
# returns
{
  "year": 2026, "reform_applied": true,
  "dataset": { "label": "Enhanced FRS 2024-25", "row_level_access": false },
  "result_id": "society_simulation_…"
}
```

### Analysis (7 tools)

Turn a society simulation into specific, weighted policy results. Dedicated derivatives calculate budget, programme, decile, poverty, inequality, and gain-or-loss results.

**`compute_budgetary_impact`** — Calculates changes in tax revenue, benefit spending, and the net budgetary impact of a reform.

```
compute_budgetary_impact(simulation_id="society_simulation_…")
# returns
{
  "tax_revenue": { "baseline": …, "reform": …, "change": … },
  "benefit_spending": { "baseline": …, "reform": …, "change": … },
  "net_budgetary_impact": …, "result_id": "budgetary_impact_…"
}
```

**`compute_program_breakdown`** — Calculates programme-level totals, caseloads, winners, and losers from a society simulation.

```
compute_program_breakdown(
  simulation_id="society_simulation_…",
  programs=["child_benefit", "universal_credit"]
)
# returns
{
  "programs": [
    { "program": "universal_credit", "is_tax": false,
      "change": …, "baseline_count": …, "winners": …, "losers": … }, …
  ]
}
```

**`compute_decile_impacts`** — Calculates changes in mean household income across a selected income- or wealth-decile concept.

```
compute_decile_impacts(
  simulation_id="society_simulation_…",
  decile_concept="household_net_income"
)
# returns
{
  "measure_label": "household net income",
  "grouping_label": "Household net income decile",
  "deciles": [{ "decile": 1, "absolute_change": …, "relative_change": … }, …]
}
```

**`compute_winners_losers`** — Calculates people-weighted gain, loss, and no-change shares within income or wealth deciles.

```
compute_winners_losers(
  simulation_id="society_simulation_…",
  basis="income"
)
# returns
{
  "grouping_label": "Income decile",
  "deciles": [
    { "decile": 1, "gain_more_than_5pct": …, "no_change": …, … }, …
  ]
}
```

**`compute_poverty_metrics`** — Calculates UK poverty rates and headcounts overall and by age under baseline and reform.

```
compute_poverty_metrics(simulation_id="society_simulation_…")
# returns
{
  "rates": [
    { "poverty_type": "relative_bhc", "group": "all", "baseline_rate": …,
      "reform_rate": …, "rate_change": …, "baseline_headcount": … }, …
  ]
}
```

**`compute_inequality_metrics`** — Calculates the Gini coefficient and changes in the top 10%, top 1%, and bottom 50% income shares.

```
compute_inequality_metrics(simulation_id="society_simulation_…")
# returns
{
  "metrics": {
    "gini": { "baseline": …, "reform": …, "change": …, "relative_change": … },
    "top_10_share": { … }, "top_1_share": { … }, "bottom_50_share": { … }
  }
}
```

**`aggregate_result`** — Calculates a weighted sum, mean, or count for a verified variable without returning survey rows.

```
aggregate_result(
  simulation_id="society_simulation_…",
  entity="household", variable="household_id", operation="count",
  filter_variable="benunit_count_children", filter_variable_geq=3
)
# returns
{
  "result": { "operation": "count", "target": "reform",
    "filter_variable_geq": 3, "value": … },
  "privacy": "Aggregate only; no row-level records returned."
}
```

### Presentation (1 tool)

Build a chart from a calculation result using a constrained chart schema. Policy charts are built from a stored result, so the displayed artefact stays tied to the calculation it came from.

**`generate_chart`** — Generates frontend-renderable chart markdown from a stored result or constrained chart data.

```
generate_chart(
  chart_kind="decile_relative_bar",
  result_id="decile_impacts_…",
  title="Change in household net income by decile"
)
# returns
{
  "chart_markdown": …a fenced chart block, included verbatim in the answer…,
  "spec": { "type": "preset", "preset": "decile_relative_bar",
    "groupLabel": "Household net income decile", "data": [ … ] }
}
```

## See one answer being built

UK Chat owns both the opening gateway and the tool loop in a FastAPI server-sent-events handler that calls the Anthropic SDK directly. There is no generic agent framework in the request path. Follow one request through that boundary, from the language model's proposed plan to a tool-backed answer.

This guided reconstruction uses the real stages, tools, assumptions, and result from the Child Benefit example; it is not a live chat session.

### User request

> For 2026, set the Child Benefit eldest-child rate to £30 a week and show the annual budgetary impact.

### 1. Ground — A structured opening plan

_Language model_

A fast language model reads the user's words and proposes a structured description of the request. It separates inputs the user supplied from the output they asked for and suggests which tools may be needed. This is an interpretation, not yet permission to calculate.

For this request, the proposed plan identifies the Child Benefit eldest-child rate, a final value of £30 a week, the 2026 policy year, and annual budgetary impact as the requested output.

### 2. Resolve — Current catalogue evidence

_Gateway_

The gateway checks named policies, variables, and requested outputs against PolicyEngine's current catalogue. Exact and strong matches can support the plan; fuzzy matches remain suggestions rather than facts.

It then refines the plan with the relevant tool inputs and declared defaults — for example, using the current year when the user does not name one. Any choice the system cannot resolve safely stays explicit instead of being silently invented.

Here, the prompt wording “Child Benefit eldest-child rate” matches `gov.hmrc.child_benefit.amount.eldest`, budgetary impact is supported, and no user-owned choices remain unresolved. The identifier comes from the installed UK package rather than the language model's memory, and the wording matches the parameter's catalogue label.

### 3. Gate — Five deterministic outcomes

_Gateway_

The gateway applies fixed policy to the grounded, catalogue-backed plan and assigns one of five outcomes. Only a ready request may enter the calculation loop.

The gate is deliberately biased towards computing. If the classifier errors or returns something the server cannot read, the request is treated as ready rather than refused, on the view that a wrong refusal costs more than a wrong attempt. The guarantees that follow come from the tools, not from the gate.

- Ready: the request is complete and supported, so calculation can begin.
- Needs plan: a required choice is missing, so the chat asks a clarifying question.
- Partial: the request mixes supported and unsupported outputs, so the chat offers the supported part.
- Out of scope: the requested policy output cannot be modelled, so calculation tools stay closed.
- Irrelevant: the request is unrelated to UK tax and benefit policy and takes a lightweight response path.

The complete Child Benefit request is ready: its policy, value, year, and output are explicit and supported.

### 4. Verify — Exact reform construction

_Gateway_

A society-wide reform receives a second bounded check. The resolver searches the rules engine's current reform targets, binds the user's wording to an exact parameter path and date, and constructs reform JSON. The validator must accept that construction before a simulation can run.

For this request, the approved construction sets `gov.hmrc.child_benefit.amount.eldest` to £30 a week for 2026. Rules-engine validation confirms that the path exists, `30.0` is valid for a currency-GBP parameter, and the date range falls inside the package's coverage. An unrecognised path would be rejected. The tool context will also reject a society reform that differs from the approved construction.

### 5. Calculate — A bounded 21-tool runtime

_Supporting tools_

A language model selected for the request's type and size executes the verified plan through one or more of 21 public tools. Simulation tools apply the tax and benefit rules; analysis tools derive budget, programme, distributional, poverty, inequality, or gain-and-loss results from a stored simulation.

The language model chooses and sequences tools, but it does not supply the figures. Each number comes back as tool data produced by the PolicyEngine UK model.

For this request, the tool loop makes five public calls. The first three independently reconstruct and validate the reform the gateway approved; the simulation tool then enforces that the reform it receives matches the approved construction.

**1. Find the target — `list_reform_targets`**

```
list_reform_targets(query="child benefit eldest")
# returns gov.hmrc.child_benefit.amount.eldest
```

The target comes from the installed UK package, and “eldest-child rate” matches its catalogue label.

**2. Read current law — `get_parameter`**

```
get_parameter(
  path="gov.hmrc.child_benefit.amount.eldest",
  year=2026
)
# returns
{
  "unit": "currency-GBP",
  "period": "week",
  "value": …the 2026 rate in the deployed package…
}
```

The deployed value supplies the current-law comparator, while the unit and period determine how “£30 a week” must be expressed.

**3. Validate — `validate_reform`**

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

The validator confirms the path, value type, and date range. An unrecognised path is rejected.

**4. Simulate — `run_society_simulation`**

```
run_society_simulation(
  reform={ …validated above… },
  year=2026
)
# returns
{
  "result_id": "society_simulation_…",
  "dataset": { "label": "Enhanced FRS 2024-25", … },
  "year": 2026
}
```

The language model receives a typed result handle and metadata, not household rows, survey weights, or a serialisable simulation object.

**5. Compute — `compute_budgetary_impact`**

```
compute_budgetary_impact(
  simulation_id="society_simulation_…"
)
```

The analysis tool uses the preceding `result_id` as its `simulation_id`, applies survey weights inside the PolicyEngine UK model, and returns baseline and reform totals for tax revenue and benefit spending together with their net budgetary impact. Every argument in the sequence therefore comes from the user or a preceding call.

### 6. Stream — An inspectable response

_Gateway_

The gateway streams text chunks, tool starts, tool inputs, completion summaries, and the final answer as server-sent events. The interface can therefore show what the system tried and which computations completed while the answer is being produced.

The tool loop remains bounded by a 30-round cap, repeated-call detection, result-size limits, and explicit terminal events. Tool errors return as data so the language model can recover without inventing a result.

_Turn events_

```
ToolStarted → ToolUsed → ToolCompleted → TextChunk → TurnCompleted
```

_Server-sent frames_

```
data: { "type": "tool_use", "tool_name": "compute_budgetary_impact",
        "status": "pending" }
data: { "type": "done", "content": …, "stop_reason": …, "usage": { … } }
```

### Computed result: About £0.9 billion a year in additional government cost

A production run compares the reform with 2026 current law using PolicyEngine's Enhanced Family Resources Survey dataset for 2024–25, release 1.56.13. It is a direct static microsimulation estimate. Tax revenue rises because a higher Child Benefit rate increases the High Income Child Benefit Charge paid by higher-income families.

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

Some of what follows is a deliberate boundary that will not change. The rest is the current state of a beta: reform coverage is incomplete, answers vary in how fully they state their assumptions, and gateway behaviour will move as we act on what users report. Widening the range of reforms the typed tools cover, and the evidence the gateway can resolve before calculation, is where the work goes next.

The chat is a modelling tool, not advice. It reports what the engine calculates under stated assumptions, and it is not a substitute for professional guidance on an individual's circumstances.

Society results are direct static microsimulation estimates. They do not estimate behavioural responses, employment effects, inflation, GDP, market reactions, or general-equilibrium effects. When a request mixes a supported policy result with one of those effects, the gateway says which part it cannot calculate and asks whether to run the part it can, rather than running anything that turn.

Results depend on the dataset, year, and modelling assumptions, and the chat states these dependencies rather than presenting figures as universal. They should still be checked against independent estimates from organisations such as the Institute for Fiscal Studies, Resolution Foundation, or Office for Budget Responsibility.

## Try it yourself

UK Chat's answers can be cited and reproduced because the figures come from the same open engine that powers the rest of PolicyEngine, and it sits alongside PolicyEngine's wider generative AI integrations and plugin ecosystem for researchers building their own analyses. Try it with a reform, then inspect the stated year, dataset, comparator, and method alongside the answer.

Because this is a beta, the cases where it fails are more useful to us than the cases where it works: a request refused that the tools should support, an answer that omits an assumption it should state, or a figure that does not match what the engine returns for the same reform. PolicyEngine's policy team is working through the same exercise, and what they and other early users report will decide what we change first.

[Try PolicyEngine UK Chat (beta)](https://policyengine.org/uk/chat)
