# PolicyEngine UK Chat: a new conversational interface for understanding tax and benefits

*Introducing PolicyEngine’s newest AI-powered tool to help users understand UK tax and benefit policy*

People are increasingly turning to AI language models to answer complex questions about tax and benefit policy and reform, since models can read loosely worded questions and answer them in plain language. This presents a problem: for many users, tax and benefit questions directly impact their lives and livelihoods, and they require correct, verified answers. However, language models produce outputs from their learned training data, producing results that may be partially or completely incorrect.

So, PolicyEngine built its newest tool, UK Chat, an AI chat interface that offers users the best of conversational AI, undergirded by PolicyEngine’s own deterministic rules and simulation engine. UK Chat takes a user’s conversational input, uses a series of probabilistic checks to determine what the user is asking for, then computes quantitative policy results from actual tax and benefit rules.

## Separating calculation

An AI language model generates text by predicting continuations, not by applying tax and benefit rules. Ask one what Universal Credit (UC) a lone parent receives and it may return a number without factoring in the UC’s income-based taper rate, its work allowance, or its differing benefit rates based on life situation.

Prompting does not change this. For example, instructing a model to state only “real” figures does not correct its understanding of tax and benefit rules, it changes the wording around the same predicted textual outputs. Further, the AI model’s output reads identically whether its output is right or wrong, so it is impossible to verify whether an answer is correct by reading it. In fact, a figure that is wrong, but reads as a correct answer, can be harder to catch than no figure at all.

This matters when results power decisions. Anyone comparing two reforms needs figures that come from a fixed model, not from an AI’s recollection of figures it has seen. The same applies to a household trying to work out how a tax reform affects its own income: the figure has to come from clear, delineated rules, with assumptions written down, so that it can be verified.

## The model proposes a plan

UK Chat breaks the user pathway into three segments: the AI model, the gateway, and supporting tools.

First, the AI language model still does the predictive work it excels at. It takes the user’s open-ended natural-language prompt and develops a simulation/analysis plan. This plan has a required format and is required to use one or more deterministic tools (more on those later) that are directly connected to the PolicyEngine UK tax and benefit simulation engine.

Next, UK Chat’s gateway verifies, and sometimes constrains, that plan to ensure that PolicyEngine provides the tooling required to answer the user’s question(s). The gateway may also ask a user for clarification, before finalizing a plan.

## Tools make that plan deterministic

At this point, UK Chat has a gateway-verified plan. This plan relies on one or more deterministic tools that UK Chat exposes to ensure that every figure displayed to a user is rooted in verifiable facts as opposed to AI large-language predictions.

UK Chat’s AI model-facing tools are narrow by design. The tools fall into one of five types, each used to constrain the AI model and ensure correct outputs while creating, verifying, or executing a plan. Explore these categories in the interactive below.

## Under the hood

Let’s delve further into the UK Chat user pathway. UK Chat’s core runtime is a FastAPI server-sent-events handler that calls the Anthropic SDK directly. There is no generic agent framework in the request path. The chat owns both the opening gateway and the tool loop, so the rules that matter can be enforced at the point where each decision is made.

### 1 Ground — A structured opening plan

After receiving a user inquiry, UK Chat analyzes the input and uses a fast routing step to try to describe the user’s request as a structured plan: the user’s supplied input(s), their requested output(s), and any tools the model intends to use.

### 2 Resolve — Current catalogue evidence

Server-side discovery uses exposed tools to check named policies and variables against the current PolicyEngine catalogue. Exact and strong matches can support the plan; fuzzy matches remain suggestions rather than facts.

The server also refines the plan using relevant tool inputs and UK Chat-specified defaults (e.g., if no year is provided by the user, infer that they want the current one). After this step, unresolved user choices remain explicit.

### 3 Gate — Five deterministic outcomes

Using the structured plan that we started in stage 1 and refined in stage 2, UK Chat decides what to do next. A complete request with inputs clearly stated by the user proceeds to computation. If any required inputs are missing, UK Chat asks the user for clarification. Mixed, unsupported, and unrelated requests take separate lightweight paths without calculation tools.

### 4 Verify — Exact reform construction

If UK Chat determines that the user wants to understand the society-wide impacts of a given tax or reform policy, then it performs a second, bounded check. The resolver searches the rules engine’s reform targets to construct a user’s requested reform, then passes it through a validator to ensure it can be run.

### 5 Calculate — A bounded 21-tool runtime

At this point, UK Chat has created a verified execution plan. An AI model selected for the type and size of the request uses one or more of the 21 public tools to execute the plan.

### 6 Stream — An inspectable response

Text chunks, tool starts, tool inputs, completion summaries, and the final answer are streamed as server-sent events to the chat interface. The client can show what the system tried while the answer is being produced.

The tool loop remains bounded by a 30-round cap, repeated-call detection, result-size limits, and explicit terminal events. Tool errors return as data so the model can recover without inventing a result.

## One reform, end to end

Consider: “Set the Child Benefit eldest-child rate to £30 a week and show the annual budgetary impact.” The request contains a policy, a final value, and an output. It does not contain a PolicyEngine parameter path, a reform object, or the sequence of tools needed to answer it.

### User request

Set the eldest-child rate to £30 a week

1. **Ground** — exact wording; budgetary impact. Identify the requested policy change, year, and output without turning assumptions into facts.
2. **Verify** — catalogue search; reform validation. Bind “eldest-child rate” to a current reform target and validate the exact reform construction.
3. **Calculate** — `run_society_simulation`; `compute_budgetary_impact`. Run the approved reform once, then pass its result handle to the requested derivative.
4. **Report** — Enhanced FRS 2024–25; current law. Explain the computed change with the year, comparator, population, dataset, and method attached.

If the catalogue returned more than one materially plausible interpretation, or the reform resolver could not determine what year or reform the user was requesting, the calculation would pause after verification and ask the user to confirm the intended construction.

## Limitations

The chat is a modelling tool, not advice. It reports what the model calculates under stated assumptions, and it is not a substitute for professional guidance on an individual's circumstances.

Society results are direct static microsimulation estimates. They do not estimate behavioural responses, employment effects, inflation, GDP, market reactions, or general-equilibrium effects. When a request mixes a supported policy result with one of those effects, the gateway notifies the user that it cannot calculate these effects, then proceeds with what it can.

Results depend on the dataset, year, and modelling assumptions, and the chat states these dependencies rather than presenting figures as universal. Its answers can be cited and reproduced because the figures come from the same open engine that powers the rest of PolicyEngine, and they can be checked against independent estimates such as those from the IFS, Resolution Foundation, or OBR.

## Try it yourself

We want to widen the range of reforms the typed tools cover, so fewer questions fall back to reviewed Python, and to make that fallback quicker to run and inspect. PolicyEngine UK Chat works alongside our wider use of Claude and our plugin ecosystem, which bring the same engine to researchers building their own analyses.

Try it with a reform you care about, and check the figures against the open-source engine that produced them.
