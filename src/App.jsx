import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconChevronDown,
  IconPaperclip,
} from '@tabler/icons-react';
import SiteHeader from './SiteHeader';
import anthonyVolkHeadshot from './assets/authors/anthony-volk.webp';
import vahidAhmadiHeadshot from './assets/authors/vahid-ahmadi.webp';

const toolFamilies = [
  {
    name: 'Discovery',
    summary: 'Find exact variables, parameters, entities, reform targets, and supported outputs.',
    purpose: 'Discovery keeps the language model from guessing the names of things in PolicyEngine.',
    tools: [
      {
        name: 'list_entities',
        summary: 'Lists the PolicyEngine UK model entities and the number of variables defined for each one.',
        call: 'list_entities()',
        returns: `{
  "status": "success",
  "entities": [{ "name": "person", "variable_count": … }, …]
}`,
      },
      {
        name: 'search_variables',
        summary:
          'Searches the UK variable registry and identifies each match’s entity and default-output status.',
        call: `search_variables(
  query="employment income",
  entity="person"
)`,
        returns: `{
  "variables": [
    { "name": "employment_income", "entity": "person",
      "value_type": "float", "definition_period": "year" }
  ]
}`,
      },
      {
        name: 'get_variable',
        summary:
          'Verifies one exact UK variable and returns its metadata, entity, and default-output status.',
        call: 'get_variable(name="household_net_income")',
        returns: `{
  "variable": {
    "name": "household_net_income", "entity": "household",
    "value_type": "float", "is_default_society_output": true
  }
}`,
      },
      {
        name: 'search_parameters',
        summary: 'Searches policy parameters by path, label, description, or known alias.',
        call: 'search_parameters(query="personal allowance")',
        returns: `{
  "parameters": [
    { "path": "gov.hmrc.income_tax.allowances.personal_allowance.amount",
      "unit": "currency-GBP", "aliases": ["personal allowance", …] }
  ]
}`,
      },
      {
        name: 'get_parameter',
        summary:
          'Looks up one exact policy parameter and returns its metadata and value for a selected year.',
        call: `get_parameter(
  path="gov.hmrc.income_tax.allowances.personal_allowance.amount",
  year=2026
)`,
        returns: `{
  "parameter": {
    "unit": "currency-GBP", "year": 2026,
    "value": …the 2026 allowance in the deployed package…
  }
}`,
      },
      {
        name: 'list_reform_targets',
        summary: 'Searches the current catalogue for parameter paths that can be used in a reform.',
        call: 'list_reform_targets(query="universal credit standard allowance")',
        returns: `{
  "targets": [
    { "path": "gov.dwp.universal_credit.standard_allowance.amount.SINGLE_OLD",
      "aliases": ["universal credit standard allowance", …] }
  ]
}`,
      },
      {
        name: 'list_household_input_variables',
        summary: 'Lists known variables that can be supplied as overrides for an illustrative household.',
        call: 'list_household_input_variables(entity="person")',
        returns: `{
  "entity": "person",
  "variables": [{ "name": "employment_income", … }, …],
  "input_contract": "policyengine.py accepts any known variable on its declared entity…"
}`,
      },
      {
        name: 'list_society_output_variables',
        summary: 'Lists the variables a society simulation materialises by default, grouped by entity.',
        call: 'list_society_output_variables(entity="household")',
        returns: `{
  "default_variables_by_entity": {
    "household": ["household_net_income", "household_tax", "household_benefits", …]
  },
  "default_variable_count": …
}`,
      },
      {
        name: 'list_supported_outputs',
        summary: 'Lists the household, society, derivative, and chart outputs supported by the chat runtime.',
        call: 'list_supported_outputs(scope="derivative")',
        returns: `{
  "scope": "derivative",
  "outputs": [
    { "scope": "derivative", "name": "budgetary_impact", "description": … }, …
  ]
}`,
      },
    ],
  },
  {
    name: 'Validation',
    summary: 'Check reform JSON and synthetic household inputs before calculation.',
    purpose: 'Validation turns malformed inputs into explicit errors rather than plausible-looking results.',
    tools: [
      {
        name: 'validate_reform',
        summary: 'Validates flat PolicyEngine reform JSON for a selected year without running a simulation.',
        call: `validate_reform(
  reform={ "gov.hmrc.income_tax.allowances.personal_allowance.amount": 15000 },
  year=2026
)`,
        returns: `{
  "valid": true,
  "parameter_paths": ["gov.hmrc.income_tax.allowances.personal_allowance.amount"],
  "warnings": []
}`,
      },
      {
        name: 'validate_household',
        summary: 'Validates an illustrative synthetic UK household against PolicyEngine variable metadata.',
        call: `validate_household(
  people=[{ "age": 35, "employment_income": 28000 }, { "age": 6 }, { "age": 3 }],
  household={ "country": "ENGLAND" }
)`,
        returns: `{
  "valid": true,
  "year": 2026,
  "people_count": 3, "warnings": []
}`,
      },
    ],
  },
  {
    name: 'Simulation',
    summary: 'Run one illustrative household or a reform across the modelled UK population.',
    purpose: 'These tools apply the tax and benefit rules and return turn-local result handles.',
    tools: [
      {
        name: 'run_household_simulation',
        summary: 'Runs an illustrative synthetic household through the PolicyEngine UK tax-benefit model.',
        call: `run_household_simulation(
  people=[{ "age": 35, "employment_income": 28000 }, { "age": 6 }, { "age": 3 }],
  household={ "country": "ENGLAND" }
)`,
        returns: `{
  "reform_applied": false,
  "household": { "household_net_income": …, "household_tax": … },
  "result_id": "household_simulation_…"
}`,
      },
      {
        name: 'run_society_simulation',
        summary:
          'Runs baseline and reform UK simulations and returns metadata plus a turn-local result handle.',
        call: `run_society_simulation(
  reform={ "gov.hmrc.income_tax.allowances.personal_allowance.amount": 15000 },
  year=2026
)`,
        returns: `{
  "year": 2026, "reform_applied": true,
  "dataset": { "label": "Enhanced FRS 2024-25", "row_level_access": false },
  "result_id": "society_simulation_…"
}`,
      },
    ],
  },
  {
    name: 'Analysis',
    summary: 'Turn a society simulation into specific, weighted policy results.',
    purpose:
      'Dedicated derivatives calculate budget, programme, decile, poverty, inequality, and gain-or-loss results.',
    tools: [
      {
        name: 'compute_budgetary_impact',
        summary:
          'Calculates changes in tax revenue, benefit spending, and the net budgetary impact of a reform.',
        call: 'compute_budgetary_impact(simulation_id="society_simulation_…")',
        returns: `{
  "tax_revenue": { "baseline": …, "reform": …, "change": … },
  "benefit_spending": { "baseline": …, "reform": …, "change": … },
  "net_budgetary_impact": …, "result_id": "budgetary_impact_…"
}`,
      },
      {
        name: 'compute_program_breakdown',
        summary:
          'Calculates programme-level totals, caseloads, winners, and losers from a society simulation.',
        call: `compute_program_breakdown(
  simulation_id="society_simulation_…",
  programs=["child_benefit", "universal_credit"]
)`,
        returns: `{
  "programs": [
    { "program": "universal_credit", "is_tax": false,
      "change": …, "baseline_count": …, "winners": …, "losers": … }, …
  ]
}`,
      },
      {
        name: 'compute_decile_impacts',
        summary:
          'Calculates changes in mean household income across a selected income- or wealth-decile concept.',
        call: `compute_decile_impacts(
  simulation_id="society_simulation_…",
  decile_concept="household_net_income"
)`,
        returns: `{
  "measure_label": "household net income",
  "grouping_label": "Household net income decile",
  "deciles": [{ "decile": 1, "absolute_change": …, "relative_change": … }, …]
}`,
      },
      {
        name: 'compute_winners_losers',
        summary:
          'Calculates people-weighted gain, loss, and no-change shares within income or wealth deciles.',
        call: `compute_winners_losers(
  simulation_id="society_simulation_…",
  basis="income"
)`,
        returns: `{
  "grouping_label": "Income decile",
  "deciles": [
    { "decile": 1, "gain_more_than_5pct": …, "no_change": …, … }, …
  ]
}`,
      },
      {
        name: 'compute_poverty_metrics',
        summary: 'Calculates UK poverty rates and headcounts overall and by age under baseline and reform.',
        call: 'compute_poverty_metrics(simulation_id="society_simulation_…")',
        returns: `{
  "rates": [
    { "poverty_type": "relative_bhc", "group": "all", "baseline_rate": …,
      "reform_rate": …, "rate_change": …, "baseline_headcount": … }, …
  ]
}`,
      },
      {
        name: 'compute_inequality_metrics',
        summary:
          'Calculates the Gini coefficient and changes in the top 10%, top 1%, and bottom 50% income shares.',
        call: 'compute_inequality_metrics(simulation_id="society_simulation_…")',
        returns: `{
  "metrics": {
    "gini": { "baseline": …, "reform": …, "change": …, "relative_change": … },
    "top_10_share": { … }, "top_1_share": { … }, "bottom_50_share": { … }
  }
}`,
      },
      {
        name: 'aggregate_result',
        summary:
          'Calculates a weighted sum, mean, or count for a verified variable without returning survey rows.',
        call: `aggregate_result(
  simulation_id="society_simulation_…",
  entity="household", variable="household_id", operation="count",
  filter_variable="benunit_count_children", filter_variable_geq=3
)`,
        returns: `{
  "result": { "operation": "count", "target": "reform",
    "filter_variable_geq": 3, "value": … },
  "privacy": "Aggregate only; no row-level records returned."
}`,
      },
    ],
  },
  {
    name: 'Presentation',
    summary: 'Build a chart from a calculation result using a constrained chart schema.',
    purpose:
      'Policy charts are built from a stored result, so the displayed artefact stays tied to the calculation it came from.',
    tools: [
      {
        name: 'generate_chart',
        summary:
          'Generates frontend-renderable chart markdown from a stored result or constrained chart data.',
        call: `generate_chart(
  chart_kind="decile_relative_bar",
  result_id="decile_impacts_…",
  title="Change in household net income by decile"
)`,
        returns: `{
  "chart_markdown": …a fenced chart block, included verbatim in the answer…,
  "spec": { "type": "preset", "preset": "decile_relative_bar",
    "groupLabel": "Household net income decile", "data": [ … ] }
}`,
      },
    ],
  },
];

const questionKinds = [
  {
    id: 'households',
    name: 'Households',
    summary: 'Illustrative calculations',
    question: 'A single parent, two children, earning £28,000 — what do they take home?',
    description:
      'The household is constructed as a synthetic input, validated, and run through the PolicyEngine UK model to produce taxes, benefits, and net income under stated assumptions. Each call covers one household containing one benefit unit. More complex arrangements need separate calls.',
    tools: ['list_household_input_variables', 'validate_household', 'run_household_simulation'],
  },
  {
    id: 'reforms',
    name: 'Reforms',
    summary: 'Population-wide impact',
    question: 'How much does raising the personal allowance by £2,000 cost, and who gains?',
    description:
      'Parametric reforms run across the modelled UK population: budgetary impact, programme-level changes, poverty measures, decile impacts, winners and losers, and weighted caseload counts, each from its own derivative tool.',
    tools: ['validate_reform', 'run_society_simulation', 'compute_budgetary_impact'],
  },
  {
    id: 'charts',
    name: 'Charts',
    summary: 'Computed outputs, drawn',
    question: 'Show me that by decile.',
    description:
      'When a comparison reads better as a picture than as prose, the computed output is mapped onto a fixed chart preset. A policy preset has to name the stored result it draws, so that chart and the text around it cannot disagree.',
    tools: ['generate_chart'],
  },
  {
    id: 'follow-ups',
    name: 'Follow-ups',
    summary: 'One continuous thread',
    question: 'And what if I made it £3,000 instead?',
    description:
      'Follow-ups stay in the same thread. The conversation carries the context; the simulation handles do not. Each turn re-runs what it needs, so a later answer never quietly rests on an earlier turn’s in-memory state.',
    tools: [],
  },
];

/* The five public calls made during the Calculate stage. Identifiers are shortened
   and the current-law rate is elided, because both come from whichever PolicyEngine
   UK package is deployed rather than from anything fixed at publication. */
const calculationToolSteps = [
  {
    id: 'find-target',
    toolName: 'list_reform_targets',
    stage: 'Find the target',
    family: 'Discovery',
    body: (
      <>
        <div className="example-section">
          <div className="example-section-title">tool call</div>
          <pre className="example-code">
            <span className="keyword">list_reform_targets</span>
            {'(\n  query='}
            <span className="string">&quot;child benefit eldest&quot;</span>
            {'\n)'}
          </pre>
        </div>
        <div className="example-section">
          <div className="example-section-title">result</div>
          <div className="example-output">
            <div className="example-output-line success">
              <span className="icon">✓</span>
              <span>gov.hmrc.child_benefit.amount.eldest</span>
            </div>
            <div className="example-output-line">
              <span className="icon">·</span>
              <span>returned from the installed UK package, not from memory</span>
            </div>
            <div className="example-output-line">
              <span className="icon">·</span>
              <span>“eldest-child rate” matches the parameter’s catalogue label</span>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'read-current-law',
    toolName: 'get_parameter',
    stage: 'Read current law',
    family: 'Discovery',
    body: (
      <>
        <div className="example-section">
          <div className="example-section-title">tool call</div>
          <pre className="example-code">
            <span className="keyword">get_parameter</span>
            {'(\n  path='}
            <span className="string">&quot;gov.hmrc.child_benefit.amount.eldest&quot;</span>
            {',\n  year='}
            <span className="number">2026</span>
            {'\n)'}
          </pre>
        </div>
        <div className="example-section">
          <div className="example-section-title">returned</div>
          <pre className="example-code">
            {'{\n  '}
            <span className="string">&quot;unit&quot;</span>
            {': '}
            <span className="string">&quot;currency-GBP&quot;</span>
            {',\n  '}
            <span className="string">&quot;period&quot;</span>
            {': '}
            <span className="string">&quot;week&quot;</span>
            {',\n  '}
            <span className="string">&quot;value&quot;</span>
            {': '}
            <span className="comment">…the 2026 rate in the deployed package…</span>
            {'\n}'}
          </pre>
        </div>
        <div className="example-section">
          <div className="example-section-title">why it matters</div>
          <div className="example-output">
            <div className="example-output-line">
              <span className="icon">·</span>
              <span>the comparator is whatever the package holds, not a remembered rate</span>
            </div>
            <div className="example-output-line">
              <span className="icon">·</span>
              <span>the unit and period fix what “£30 a week” has to be written as</span>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'validate',
    toolName: 'validate_reform',
    stage: 'Validate',
    family: 'Validation',
    body: (
      <>
        <div className="example-section">
          <div className="example-section-title">tool call</div>
          <pre className="example-code">
            <span className="keyword">validate_reform</span>
            {'(\n  reform={\n    '}
            <span className="string">&quot;gov.hmrc.child_benefit.amount.eldest&quot;</span>
            {': {\n      '}
            <span className="string">&quot;2026-01-01.2026-12-31&quot;</span>
            {': '}
            <span className="number">30.0</span>
            {'\n    }\n  },\n  year='}
            <span className="number">2026</span>
            {'\n)'}
          </pre>
        </div>
        <div className="example-section">
          <div className="example-section-title">result</div>
          <div className="example-output">
            <div className="example-output-line success">
              <span className="icon">✓</span>
              <span>the path exists in the parameter schema</span>
            </div>
            <div className="example-output-line success">
              <span className="icon">✓</span>
              <span>30.0 is the right type for a currency-GBP parameter</span>
            </div>
            <div className="example-output-line success">
              <span className="icon">✓</span>
              <span>the date range falls inside the package&apos;s coverage</span>
            </div>
          </div>
        </div>
        <div className="example-section">
          <div className="example-section-title">note</div>
          <div className="example-file">
            <span className="example-file-name">an unrecognised path</span>
            <span className="example-file-status warning">rejected here</span>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'simulate',
    toolName: 'run_society_simulation',
    stage: 'Simulate',
    family: 'Simulation',
    body: (
      <>
        <div className="example-section">
          <div className="example-section-title">tool call</div>
          <pre className="example-code">
            <span className="keyword">run_society_simulation</span>
            {'(\n  reform={ '}
            <span className="comment">…validated above…</span>
            {' },\n  year='}
            <span className="number">2026</span>
            {'\n)'}
          </pre>
        </div>
        <div className="example-section">
          <div className="example-section-title">returned to the language model</div>
          <pre className="example-code">
            {'{\n  '}
            <span className="string">&quot;result_id&quot;</span>
            {': '}
            <span className="string">&quot;society_simulation_…&quot;</span>
            {',\n  '}
            <span className="string">&quot;dataset&quot;</span>
            {': { '}
            <span className="string">&quot;label&quot;</span>
            {': '}
            <span className="string">&quot;Enhanced FRS 2024-25&quot;</span>
            {', '}
            <span className="comment">…</span>
            {' },\n  '}
            <span className="string">&quot;year&quot;</span>
            {': '}
            <span className="number">2026</span>
            {'\n}'}
          </pre>
        </div>
        <div className="example-section">
          <div className="example-section-title">not returned</div>
          <div className="example-output">
            <div className="example-output-line error">
              <span className="icon">✗</span>
              <span>household rows</span>
            </div>
            <div className="example-output-line error">
              <span className="icon">✗</span>
              <span>survey weights</span>
            </div>
            <div className="example-output-line error">
              <span className="icon">✗</span>
              <span>any serialisable simulation object</span>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'compute',
    toolName: 'compute_budgetary_impact',
    stage: 'Compute',
    family: 'Analysis',
    body: (
      <>
        <div className="example-section">
          <div className="example-section-title">tool call</div>
          <pre className="example-code">
            <span className="keyword">compute_budgetary_impact</span>
            {'(\n  simulation_id='}
            <span className="string">&quot;society_simulation_…&quot;</span>
            {'\n)'}
          </pre>
        </div>
        <div className="example-section">
          <div className="example-section-title">computed inside the engine</div>
          <div className="example-output">
            <div className="example-output-line success">
              <span className="icon">✓</span>
              <span>baseline and reform totals for tax revenue and benefit spending</span>
            </div>
            <div className="example-output-line success">
              <span className="icon">✓</span>
              <span>the net budgetary impact reported below</span>
            </div>
            <div className="example-output-line success">
              <span className="icon">✓</span>
              <span>survey weights applied inside the PolicyEngine UK model</span>
            </div>
          </div>
        </div>
        <div className="example-section">
          <div className="example-section-title">stored</div>
          <div className="example-file">
            <span className="example-file-name">result_id → typed handle</span>
            <span className="example-file-status created">turn-local</span>
          </div>
        </div>
      </>
    ),
  },
];

const authors = [
  {
    id: 'vahid-ahmadi',
    name: 'Vahid Ahmadi',
    title: 'Research Associate at PolicyEngine',
    headshot: vahidAhmadiHeadshot,
  },
  {
    id: 'anthony-volk',
    name: 'Anthony Volk',
    title: 'Full-Stack Engineer at PolicyEngine',
    headshot: anthonyVolkHeadshot,
  },
];

const walkthroughUserRequest =
  'For 2026, set the Child Benefit eldest-child rate to £30 a week and show the annual budgetary impact.';

const groundProposedPlan = {
  domain_status: 'uk_or_unspecified',
  capability_status: 'supported',
  tool: 'compute_budgetary_impact',
  catalogue_queries: [
    {
      kind: 'reform_target',
      query: 'eldest-child rate',
    },
  ],
};

const resolveCatalogueCall = `resolve_catalogue_queries([
  { "kind": "reform_target", "query": "eldest-child rate" }
])`;

const resolveCatalogueMatch = {
  identifier: 'gov.hmrc.child_benefit.amount.eldest',
  match_type: 'strong_phrase',
  score: 0.9,
  authoritative: true,
};

const gateCall = `gate(
  in_domain=true, tool="compute_budgetary_impact",
  unmodellable_outputs=[]
)`;

const gateVerdict = {
  outcome: 'ready',
  gating_reasons: [],
};

const verifyReformCall = `emit_reform_assessment(
  reform={ "gov.hmrc.child_benefit.amount.eldest": 30.0 },
  confidence=95
)`;

const approvedReform = {
  approved_reform: {
    'gov.hmrc.child_benefit.amount.eldest': 30.0,
  },
  require_approved_reform: true,
};

const walkthroughAnswerSummary =
  'Setting the Child Benefit eldest-child rate to £30 a week in 2026 would cost the government about £0.9 billion a year compared with current law. Benefit spending rises by about £1.1 billion, while tax revenue rises by about £0.2 billion because the higher rate also increases High Income Child Benefit Charge receipts.';

const walkthroughAnswerMethod =
  'This is a direct static microsimulation estimate using Enhanced FRS 2024–25, release 1.56.13.';

const streamEventSequence = `tool_start   society simulation
tool_use     year + approved reform
tool_result  success + simulation result_id
tool_start   budgetary impact
tool_use     simulation_id
tool_result  success + computed totals
thinking_done
chunk        assistant answer
done         turn complete`;

const requestSteps = [
  {
    number: 1,
    title: 'Ground',
    subtitle: 'A structured opening plan',
    segment: 'Language model',
    body: (
      <>
        <p>
          A fast language model reads the user&apos;s words and proposes a structured description of the
          request. It separates inputs the user supplied from the output they asked for and suggests which
          tools may be needed. This is an interpretation, not yet permission to calculate.
        </p>
      </>
    ),
    example: {
      callTitle: 'the user’s message',
      call: `last_user_message="For 2026, set the Child Benefit eldest-child rate
  to £30 a week and show the annual budgetary impact"`,
      returnsTitle: 'proposed plan',
      returns: `{ "domain_status": "uk_or_unspecified", "capability_status": "supported",
  "tool": "compute_budgetary_impact",
  "catalogue_queries": [{ "kind": "reform_target", "query": "eldest-child rate" }] }`,
    },
  },
  {
    number: 2,
    title: 'Resolve',
    subtitle: 'Current catalogue evidence',
    segment: 'Gateway',
    body: (
      <>
        <p>
          The gateway checks named policies, variables, and requested outputs against PolicyEngine&apos;s
          current catalogue. Exact and strong matches can support the plan; fuzzy matches remain suggestions
          rather than facts.
        </p>
        <p>
          It then refines the plan with the relevant tool inputs and declared defaults — for example, using
          the current year when the user does not name one. Any choice the system cannot resolve safely stays
          explicit instead of being silently invented.
        </p>
      </>
    ),
    example: {
      callTitle: 'catalogue query',
      call: `resolve_catalogue_queries([
  { "kind": "reform_target", "query": "eldest-child rate" }
])`,
      returnsTitle: 'match',
      returns: `{
  "identifier": "gov.hmrc.child_benefit.amount.eldest",
  "match_type": "strong_phrase", "score": 0.9, "authoritative": true
}`,
    },
  },
  {
    number: 3,
    title: 'Gate',
    subtitle: 'Five deterministic outcomes',
    segment: 'Gateway',
    body: (
      <>
        <p>
          The gateway applies fixed policy to the grounded, catalogue-backed plan and assigns one of five
          outcomes. Only a <strong>ready</strong> request may enter the calculation loop.
        </p>
        <p>
          The gate is deliberately biased towards computing. If the classifier errors or returns something the
          server cannot read, the request is treated as ready rather than refused, on the view that a wrong
          refusal costs more than a wrong attempt. The guarantees that follow come from the tools, not from
          the gate.
        </p>
        <ul className="gateway-outcomes">
          <li>
            <strong>Ready:</strong> the request is complete and supported, so calculation can begin.
          </li>
          <li>
            <strong>Needs plan:</strong> a required choice is missing, so the chat asks a clarifying question.
          </li>
          <li>
            <strong>Partial:</strong> the request mixes supported and unsupported outputs, so the chat offers
            the supported part.
          </li>
          <li>
            <strong>Out of scope:</strong> the requested policy output cannot be modelled, so calculation
            tools stay closed.
          </li>
          <li>
            <strong>Irrelevant:</strong> the request is unrelated to UK tax and benefit policy and takes a
            lightweight response path.
          </li>
        </ul>
      </>
    ),
    example: {
      callTitle: 'gated plan',
      call: `gate(
  in_domain=true, tool="compute_budgetary_impact",
  unmodellable_outputs=[]
)`,
      returnsTitle: 'verdict',
      returns: `{
  "outcome": "ready",
  "gating_reasons": []
}`,
    },
  },
  {
    number: 4,
    title: 'Verify',
    subtitle: 'Exact reform construction',
    segment: 'Gateway',
    body: (
      <>
        <p>
          A society-wide reform receives a second bounded check. The resolver searches the rules engine&apos;s
          current reform targets, binds the user&apos;s wording to an exact parameter path and date, and
          constructs reform JSON. The validator must accept that construction before a simulation can run.
        </p>
        <p>
          What the gateway approves is then the only reform that can run. The simulation tool compares the
          reform it is handed against the approved construction and refuses anything that does not match, so a
          different reform cannot be substituted after the check has passed.
        </p>
      </>
    ),
    example: {
      callTitle: 'resolver construction',
      call: `emit_reform_assessment(
  reform={ "gov.hmrc.child_benefit.amount.eldest": 30.0 },
  confidence=95
)`,
      returnsTitle: 'approved for this turn',
      returns: `{
  "approved_reform": { "gov.hmrc.child_benefit.amount.eldest": 30.0 },
  "require_approved_reform": true
}`,
    },
  },
  {
    number: 5,
    title: 'Calculate',
    subtitle: 'A bounded 21-tool runtime',
    segment: 'Supporting tools',
    body: (
      <>
        <p>
          A language model selected for the request&apos;s type and size executes the verified plan through
          one or more of 21 public tools. Simulation tools apply the tax and benefit rules; analysis tools
          derive budget, programme, distributional, poverty, inequality, or gain-and-loss results from a
          stored simulation.
        </p>
        <p>
          The language model chooses and sequences tools, but it does not supply the figures. Each number
          comes back as tool data produced by the PolicyEngine UK model.
        </p>
      </>
    ),
    example: {
      callTitle: 'plan handed to the tool loop',
      call: `Required tool order: run_society_simulation -> compute_budgetary_impact.
Runtime handoff: pass the result_id returned by run_society_simulation
  as simulation_id to the target derivative.`,
      returnsTitle: 'each tool result',
      returns: `{
  "type": "tool_result", "tool_use_id": …,
  "content": …the tool’s JSON, capped at 15,000 characters…
}`,
    },
  },
  {
    number: 6,
    title: 'Stream',
    subtitle: 'An inspectable response',
    segment: 'Gateway',
    body: (
      <>
        <p>
          The gateway streams text chunks, tool starts, tool inputs, completion summaries, and the final
          answer as server-sent events. The interface can therefore show what the system tried and which
          computations completed while the answer is being produced.
        </p>
        <p>
          The tool loop remains bounded by a 30-round cap, repeated-call detection, result-size limits, and
          explicit terminal events. Tool errors return as data so the language model can recover without
          inventing a result.
        </p>
      </>
    ),
    example: {
      callTitle: 'turn events',
      call: 'ToolStarted → ToolUsed → ToolCompleted → TextChunk → TurnCompleted',
      returnsTitle: 'server-sent frames',
      returns: `data: { "type": "tool_use", "tool_name": "compute_budgetary_impact",
        "status": "pending" }
data: { "type": "done", "content": …, "stop_reason": …, "usage": { … } }`,
    },
  },
];

/* The tool and stage examples are stored as literal source strings rather than
   as hand-tagged JSX, so that all 27 of them stay short and comparable. This
   applies the same token classes the call trace above marks up by hand: an
   elision written between ellipses reads as a comment, and everything else is a
   string, a literal, or the name of the thing being called. A phrase elision
   may not span JSON punctuation, or two separate elisions on one line would be
   read as a single comment running through the fields between them. */
const EXAMPLE_TOKENS =
  /(…[^…\n{}":]*…|…)|("(?:[^"\\]|\\.)*")|\b(true|false|null|\d+(?:\.\d+)?)\b|\b([a-z_][a-z0-9_]*)(?=\()/g;

function ExampleCode({ children }) {
  const nodes = [];
  let cursor = 0;

  for (const match of children.matchAll(EXAMPLE_TOKENS)) {
    if (match.index > cursor) {
      nodes.push(children.slice(cursor, match.index));
    }
    const [token, comment, string, literal] = match;
    nodes.push(
      <span
        className={comment ? 'comment' : string ? 'string' : literal ? 'number' : 'keyword'}
        key={match.index}
      >
        {token}
      </span>,
    );
    cursor = match.index + token.length;
  }
  nodes.push(children.slice(cursor));

  return <pre className="example-code">{nodes}</pre>;
}

function ExampleExchange({ className, callTitle, call, returnsTitle, returns }) {
  return (
    <div className={className}>
      <div className="example-section">
        <div className="example-section-title">{callTitle}</div>
        <ExampleCode>{call}</ExampleCode>
      </div>
      <div className="example-section">
        <div className="example-section-title">{returnsTitle}</div>
        <ExampleCode>{returns}</ExampleCode>
      </div>
    </div>
  );
}

function FadeIn({ children, delay = 0, className }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function Hero() {
  return (
    <FadeIn>
      <h1>PolicyEngine UK Chat: an AI interface for tax and benefits</h1>
      <p className="subtitle">
        <span className="hero-beta">Beta</span>
        Introducing PolicyEngine&apos;s newest AI-powered tool to help users understand UK tax and benefit
        policy
      </p>
    </FadeIn>
  );
}

function Introduction() {
  return (
    <FadeIn>
      <p>
        People are increasingly turning to AI language models to answer complex questions about tax and
        benefit policy and reform because these models can read loosely worded questions and answer them in
        plain language. This presents a problem: for many users, tax and benefit questions directly affect
        their lives and livelihoods, so they require correct, verifiable answers. Language models generate
        responses from learned statistical patterns, and an answer may be partly or wholly wrong.
      </p>
      <p>
        PolicyEngine therefore built UK Chat, an AI interface to PolicyEngine&apos;s deterministic rules and
        simulation engine. A language model interprets an open-ended request and proposes a structured plan.
        The gateway checks the proposed inputs and output against the current PolicyEngine catalogue; only
        then do deterministic tools compute quantitative policy results from actual tax and benefit rules.
      </p>
      <p>
        UK Chat is released as a <strong>beta</strong>. The pipeline described here is in place and running,
        but the range of reforms it covers, the wording of its answers, and its judgement about what it cannot
        compute are all still being tested. We are publishing it at this stage to gather feedback on where it
        is useful and where it falls short.
      </p>
      <ChatCta />
    </FadeIn>
  );
}

function TodayWorkflow() {
  return (
    <FadeIn>
      <h2>How policy analysis is done today</h2>
      <p>
        PolicyEngine already provides tools to answer tax and benefit questions, but not in conversational
        format. For example, someone looking to determine the cost of a change to the Child Benefit can use
        one of two PolicyEngine features to do so. They can build the reform by hand in the web app, setting
        each parameter through the interface and reading the results off the charts it returns. Or they can
        write code against the PolicyEngine country model: find the parameter path in the catalogue, construct
        a reform object, run baseline and reform policies over the same survey microdata, then take the
        budgetary or distributional measure from the output. Either way, a first pass usually takes several
        attempts to settle the parameter, the date, and the measure.
      </p>
      <p>
        Both routes are precise and fully inspectable, and both call the same engine UK Chat calls underneath.
        Both also ask the same thing of the person using them: knowing which parameter carries the policy, how
        to express the change, and which output answers the question. For a policy analyst, a journalist, or a
        household working out what a reform would mean for them, this setup is a real barrier.
      </p>
      <p>
        To this user, prompting a general-purpose AI model may feel like a way around the barrier. However, as
        this article covers later, this shortcut does not necessarily produce reliable figures, given the
        current limitations of standard AI models. UK Chat overcomes this limitation by applying the strengths
        of conversational models to the same engine that already powers the web app and country models,
        reducing the setup friction mentioned earlier by providing a series of typed tools that ensure results
        are still deterministically calculated and grounded in fact.
      </p>
    </FadeIn>
  );
}

function Problem() {
  return (
    <FadeIn>
      <h2>Separating calculation</h2>
      <p>
        A language model generates text by{' '}
        <a href="https://en.wikipedia.org/wiki/Large_language_model">predicting continuations</a>, not by
        applying tax and benefit rules. Ask one what Universal Credit (UC) a lone parent receives and it may
        return a number without factoring in UC&apos;s income-based taper rate, work allowance, or the rates
        that apply to the household&apos;s circumstances.
      </p>
      <p>
        Prompting does not make a language model apply tax and benefit rules. Telling it to state only “real”
        figures changes the wording, not the source of the calculation. The answer reads the same whether it
        is right or wrong, so prose alone cannot verify it. The UK Parliament&apos;s{' '}
        <a href="https://post.parliament.uk/research-briefings/post-pn-0708/">
          Parliamentary Office of Science and Technology
        </a>{' '}
        has noted that confidently presented AI output can make errors difficult to challenge.
      </p>
      <p>
        This matters when results inform decisions, as the{' '}
        <a href="https://www.nao.org.uk/reports/use-of-artificial-intelligence-in-government/">
          National Audit Office&apos;s review of AI in government
        </a>{' '}
        illustrates. Anyone comparing two reforms needs figures from a fixed microsimulation, not an AI&apos;s
        recollection of figures it has seen. The same applies to a household working out how a reform affects
        its income: the figure has to come from clear rules, with assumptions written down, so that it can be
        checked.
      </p>
      <p>
        We have measured this directly. In{' '}
        <a href="https://policyengine.org/us/research/introducing-policybench">PolicyBench</a>, an evaluation
        built on the US tax and benefit system, we scored how accurately AI models compute taxes and benefits
        from household prompts with no tools and no lookups, against deterministic PolicyEngine outputs. In
        the launch results the top language model matched PolicyEngine exactly on <strong>80.3%</strong> of
        its scored outputs. Computed amounts scored lowest: income tax before credits scored far below
        eligibility flags, because getting it right means sequencing income concepts, thresholds, exclusions,
        and credits in the correct order.
      </p>
    </FadeIn>
  );
}

function BoundaryDiagram() {
  return (
    <svg
      className="agent-flow-svg boundary-flow-svg"
      viewBox="0 0 900 300"
      role="img"
      aria-label="The boundary between the predictive AI layer and the deterministic engine: the language model interprets the question and calls typed tools; the engine validates, simulates, and computes; the language model then explains the returned numbers."
    >
      <defs>
        {/* A slightly concave, offset head reads as an arrow rather than a
            blunt triangle at this scale; refX keeps the tip on the line end. */}
        <marker
          id="boundary-arrow"
          markerWidth="12"
          markerHeight="10"
          refX="10.5"
          refY="5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M1,0.8 L11,5 L1,9.2 L3.1,5 Z" className="flow-arrow" />
        </marker>
      </defs>

      <rect
        x="20"
        y="40"
        width="410"
        height="220"
        rx="14"
        fill="rgba(13,115,119,0.05)"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeDasharray="8 5"
      />
      <text x="225" y="66" className="lane-label" fill="#0d7377">
        PREDICTIVE — LANGUAGE MODEL
      </text>

      <rect
        x="470"
        y="40"
        width="410"
        height="220"
        rx="14"
        fill="rgba(44,100,150,0.05)"
        stroke="#2c6496"
        strokeWidth="1.5"
        strokeDasharray="8 5"
      />
      <text x="675" y="66" className="lane-label" fill="#2c6496">
        DETERMINISTIC — POLICYENGINE UK
      </text>

      <rect x="38" y="88" width="175" height="56" rx="10" fill="#fff" stroke="#0d7377" strokeWidth="2" />
      <text x="125" y="111" className="network-label">
        Interpret the
      </text>
      <text x="125" y="131" className="network-label">
        question
      </text>

      <rect x="237" y="88" width="175" height="56" rx="10" fill="#fff" stroke="#0d7377" strokeWidth="2" />
      <text x="324" y="111" className="network-label">
        Choose a tool
      </text>
      <text x="324" y="131" className="network-label">
        and arguments
      </text>

      <rect x="138" y="176" width="175" height="56" rx="10" fill="#fff" stroke="#0d7377" strokeWidth="2" />
      <text x="225" y="199" className="network-label">
        Explain the
      </text>
      <text x="225" y="219" className="network-label">
        returned numbers
      </text>

      <rect x="488" y="88" width="175" height="56" rx="10" fill="#fff" stroke="#2c6496" strokeWidth="2" />
      <text x="575" y="111" className="network-label">
        Validate
      </text>
      <text x="575" y="131" className="network-label">
        and look up
      </text>

      <rect x="687" y="88" width="175" height="56" rx="10" fill="#fff" stroke="#2c6496" strokeWidth="2" />
      <text x="774" y="111" className="network-label">
        Simulate
      </text>
      <text x="774" y="131" className="network-label">
        baseline + reform
      </text>

      <rect x="588" y="176" width="175" height="56" rx="10" fill="#fff" stroke="#2c6496" strokeWidth="2" />
      <text x="675" y="199" className="network-label">
        Weighted outputs
      </text>
      <text x="675" y="219" className="network-label">
        and chart rows
      </text>

      {/* Broken into three segments so the two crossing captions sit in the gap
          between the lanes without the dashed line running through them. */}
      {[
        [30, 92],
        [116, 182],
        [196, 270],
      ].map(([y1, y2]) => (
        <line
          key={y1}
          x1="450"
          y1={y1}
          x2="450"
          y2={y2}
          stroke="#1a202c"
          strokeWidth="2"
          strokeDasharray="4 6"
          opacity="0.45"
        />
      ))}
      <text x="450" y="22" className="lane-label boundary-label" fill="#1a202c">
        TYPED TOOL BOUNDARY
      </text>

      <line
        x1="213"
        y1="116"
        x2="231"
        y2="116"
        className="boundary-connector"
        strokeWidth="1.8"
        strokeLinecap="round"
        markerEnd="url(#boundary-arrow)"
      />
      <line
        x1="412"
        y1="116"
        x2="484"
        y2="116"
        className="boundary-connector"
        strokeWidth="1.8"
        strokeLinecap="round"
        markerEnd="url(#boundary-arrow)"
      />
      <text x="450" y="104" className="network-label flow-caption">
        tool call
      </text>
      <line
        x1="663"
        y1="116"
        x2="681"
        y2="116"
        className="boundary-connector"
        strokeWidth="1.8"
        strokeLinecap="round"
        markerEnd="url(#boundary-arrow)"
      />
      {/* Simulate (x 687-862) and Weighted outputs (x 588-763) overlap between
          687 and 763, so a plain vertical drop through the middle of that
          overlap meets the box squarely. */}
      <line
        x1="725"
        y1="144"
        x2="725"
        y2="172"
        className="boundary-connector"
        strokeWidth="1.8"
        strokeLinecap="round"
        markerEnd="url(#boundary-arrow)"
      />
      <line
        x1="584"
        y1="204"
        x2="317"
        y2="204"
        className="boundary-connector"
        strokeWidth="1.8"
        strokeLinecap="round"
        markerEnd="url(#boundary-arrow)"
      />
      <text x="450" y="192" className="network-label flow-caption">
        typed result
      </text>
    </svg>
  );
}

function Boundary() {
  return (
    <FadeIn>
      <h2>The boundary</h2>
      <p>
        UK Chat&apos;s central design decision is where the predictive layer stops and the deterministic layer
        starts.
      </p>
      <p>
        The <strong>predictive</strong> parts are interpreting wording, deciding which kind of analysis is
        being requested, drafting the explanation, and suggesting a follow-up. Those tasks are open-ended and
        language-heavy.
      </p>
      <p>
        The <strong>deterministic</strong> parts are the ones users need to be able to check: validating the
        request, looking up parameters, constructing household inputs, running simulations, computing weighted
        outputs, and producing chart data. None of these depends on the language model&apos;s memory. The
        runtime enforces the boundary rather than asking the language model to respect it in a prompt.
      </p>
      <div className="agent-flow-container boundary-flow-container">
        <BoundaryDiagram />
      </div>
      <p>
        This boundary creates a three-part request path: the language model, the gateway, and supporting
        tools. The language model turns the user&apos;s open-ended prompt into a structured simulation or
        analysis plan. The gateway checks whether that plan is complete and supported, constraining it or
        asking the user for clarification when necessary, before calculation begins. Once the plan can
        proceed, the language model receives the calculation tools, but not a static catalogue of PolicyEngine
        policies and parameters. It must use discovery tools to resolve the user&apos;s wording against the
        deployed PolicyEngine package, so a policy name either maps to a current parameter path or remains
        unresolved. The gateway likewise derives its description of each tool from that tool&apos;s schema,
        keeping its checks aligned with the inputs those tools actually accept.
      </p>
    </FadeIn>
  );
}

const ARROW_STEPS = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/* A card picker with real tab semantics: roving tabindex, arrow/Home/End keys,
   and an explicit tablist/tabpanel pairing. The bare "Select a family…" hint it
   replaces described the interaction without ever exposing it to the keyboard. */
function CardTabs({
  idPrefix,
  label,
  meta,
  items,
  activeIndex,
  onSelect,
  cardsClassName,
  renderCard,
  children,
}) {
  const tabRefs = useRef([]);

  const focusTab = (index) => {
    onSelect(items[index], index);
    tabRefs.current[index]?.focus();
  };

  const handleKeyDown = (event) => {
    const step = ARROW_STEPS[event.key];
    if (step) {
      event.preventDefault();
      focusTab((activeIndex + step + items.length) % items.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusTab(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusTab(items.length - 1);
    }
  };

  return (
    <div className="iteration-container card-tabs">
      <div className="card-tabs-header">
        <span className="card-tabs-label">{label}</span>
        <span className="card-tabs-meta">{meta}</span>
      </div>
      <div className={`iteration-cards ${cardsClassName}`} role="tablist" aria-label={label}>
        {items.map((item, index) => {
          const active = index === activeIndex;
          return (
            <button
              aria-controls={`${idPrefix}-panel`}
              aria-selected={active}
              className={`iteration-card ${active ? 'active' : ''}`}
              id={`${idPrefix}-tab-${index}`}
              key={item.key}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              role="tab"
              tabIndex={active ? 0 : -1}
              type="button"
              onClick={() => onSelect(item, index)}
              onKeyDown={handleKeyDown}
            >
              {renderCard(item, index)}
            </button>
          );
        })}
      </div>
      <div
        aria-labelledby={`${idPrefix}-tab-${activeIndex}`}
        className="iteration-panel"
        id={`${idPrefix}-panel`}
        role="tabpanel"
        tabIndex={0}
      >
        {children}
      </div>
    </div>
  );
}

const familyItems = toolFamilies.map((family) => ({ key: family.name, family }));
const toolCount = toolFamilies.reduce((total, family) => total + family.tools.length, 0);

function ToolExplorer() {
  const [activeFamily, setActiveFamily] = useState(toolFamilies[0]);
  const [activeTool, setActiveTool] = useState(toolFamilies[0].tools[0]);
  const activeIndex = toolFamilies.indexOf(activeFamily);

  const selectFamily = (family) => {
    setActiveFamily(family);
    setActiveTool(family.tools[0]);
  };

  return (
    <FadeIn>
      <h2>Tools make the calculation deterministic</h2>
      <p>
        At this point, UK Chat has a gateway-verified plan, and every figure in the answer comes from the
        tools that plan calls rather than from the language model.
      </p>
      <p>
        The tools UK Chat exposes to the language model are limited in scope. They fall into five types, each
        keeping it within supported operations while it creates, verifies, or executes a plan.
      </p>

      <CardTabs
        idPrefix="tool-family"
        label="Tool families"
        meta={`${toolFamilies.length} families · ${toolCount} tools`}
        items={familyItems}
        activeIndex={activeIndex}
        onSelect={(item) => selectFamily(item.family)}
        cardsClassName="tool-cards"
        renderCard={(item) => (
          <>
            <span className="iteration-title">{item.family.name}</span>
            <span className="iteration-subtitle">{item.family.summary}</span>
            <span className="card-tabs-count">
              {item.family.tools.length} {item.family.tools.length === 1 ? 'tool' : 'tools'}
            </span>
          </>
        )}
      >
        <div className="family-panel-header">
          <div>
            <div className="example-file-header">{activeFamily.name}</div>
            <p>{activeFamily.purpose}</p>
          </div>
        </div>
        <div className="tool-name-list">
          {activeFamily.tools.map((tool) => (
            <button
              className={`tool-name-button ${activeTool.name === tool.name ? 'active' : ''}`}
              key={tool.name}
              type="button"
              aria-pressed={activeTool.name === tool.name}
              onClick={() => setActiveTool(tool)}
            >
              <code>{tool.name}</code>
            </button>
          ))}
        </div>
        <div className="tool-summary" aria-live="polite" aria-atomic="true">
          <div className="tool-summary-name">{activeTool.name}</div>
          <p>{activeTool.summary}</p>
          <ExampleExchange
            className="tool-example"
            callTitle="example call"
            call={activeTool.call}
            returnsTitle="returns"
            returns={activeTool.returns}
          />
        </div>
      </CardTabs>
    </FadeIn>
  );
}

function AnswerWalkthrough() {
  const prefersReducedMotion = useReducedMotion();
  const [activeStage, setActiveStage] = useState(0);
  const stageRefs = useRef([]);
  const stageRatios = useRef(new Map());

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const ratios = stageRatios.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.dataset.stage);
          ratios.set(index, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        const mostVisible = [...ratios.entries()]
          .filter(([, ratio]) => ratio > 0)
          .sort(([, firstRatio], [, secondRatio]) => secondRatio - firstRatio)[0];

        if (mostVisible) setActiveStage(mostVisible[0]);
      },
      { rootMargin: '-74px 0px -45% 0px', threshold: [0, 0.15, 0.4, 0.7] },
    );

    stageRefs.current.forEach((node) => node && observer.observe(node));
    return () => {
      observer.disconnect();
      ratios.clear();
    };
  }, []);

  const selectStage = (index) => {
    setActiveStage(index);
    stageRefs.current[index]?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'center',
    });
  };

  return (
    <FadeIn>
      <h2>See one answer being built</h2>
      <p>
        UK Chat owns both the opening gateway and the tool loop in a FastAPI server-sent-events handler that
        calls the Anthropic SDK directly. There is no generic agent framework in the request path. Follow one
        request through that boundary, from the language model&apos;s proposed plan to a tool-backed answer.
      </p>
      <p className="walkthrough-disclosure">
        This guided reconstruction uses the real stages, tools, assumptions, and result from the Child Benefit
        example; it is not a live chat session. Scroll to move through the six stages, or use the stage
        selector and arrow buttons to move directly between them.
      </p>
      <div className="answer-walkthrough-scrolly">
        <div className="answer-walkthrough-sticky">
          <CompressedUkChatPreview activeStage={activeStage} onStageChange={selectStage} />
        </div>
        <div className="answer-walkthrough-scroll-track" aria-hidden="true">
          {requestSteps.map((step, index) => (
            <div
              className="answer-walkthrough-scroll-step"
              data-stage={index}
              key={step.number}
              ref={(node) => {
                stageRefs.current[index] = node;
              }}
            />
          ))}
        </div>
      </div>
    </FadeIn>
  );
}

function CalculationWorkingDisclosure() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="compressed-chat-working-disclosure">
      <button
        className="compressed-chat-working-toggle"
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((current) => !current)}
      >
        <IconChevronDown className={isExpanded ? '' : 'is-collapsed'} aria-hidden="true" />
        <span>Working through the problem</span>
      </button>

      {isExpanded && (
        <div className="compressed-chat-working-body">
          <p className="compressed-chat-working-narration">
            I&apos;ll confirm the approved reform against the public catalogue, run it, and calculate its
            annual budgetary impact.
          </p>
          {calculationToolSteps.map((tool) => (
            <details className="compressed-chat-working-tool" key={tool.id}>
              <summary>
                <IconChevronDown aria-hidden="true" />
                <code>{tool.toolName}</code>
                <span aria-label="Complete">✓</span>
              </summary>
              <div className="compressed-chat-working-tool-body">{tool.body}</div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

function CompressedUkChatPreview({ activeStage, onStageChange }) {
  const prefersReducedMotion = useReducedMotion();
  const [animationStarted, setAnimationStarted] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('idle');
  const [typedRequest, setTypedRequest] = useState('');
  const previewRef = useRef(null);
  const openingAnimationRunning = animationStarted && animationPhase !== 'complete';

  useEffect(() => {
    if (animationStarted) return undefined;

    const preview = previewRef.current;
    if (!preview || typeof IntersectionObserver === 'undefined') {
      setAnimationStarted(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setAnimationStarted(true);
        observer.disconnect();
      },
      { threshold: 0.3 },
    );

    observer.observe(preview);
    return () => observer.disconnect();
  }, [animationStarted]);

  useEffect(() => {
    if (!animationStarted) return undefined;

    if (prefersReducedMotion) {
      const reducedMotionTimer = window.setTimeout(() => {
        setTypedRequest(walkthroughUserRequest);
        setAnimationPhase('complete');
      }, 0);
      return () => window.clearTimeout(reducedMotionTimer);
    }

    let startTimer;
    let submitTimer;
    let messageTimer;
    let loadingTimer;
    let completeTimer;
    let characterIndex = 0;

    startTimer = window.setTimeout(() => setAnimationPhase('typing'), 0);
    const typingInterval = window.setInterval(() => {
      characterIndex += 1;
      setTypedRequest(walkthroughUserRequest.slice(0, characterIndex));

      if (characterIndex < walkthroughUserRequest.length) return;

      window.clearInterval(typingInterval);
      submitTimer = window.setTimeout(() => {
        setAnimationPhase('submitting');
        messageTimer = window.setTimeout(() => {
          setAnimationPhase('message');
          loadingTimer = window.setTimeout(() => {
            setAnimationPhase('loading');
            completeTimer = window.setTimeout(() => setAnimationPhase('complete'), 1650);
          }, 650);
        }, 700);
      }, 300);
    }, 22);

    return () => {
      window.clearTimeout(startTimer);
      window.clearInterval(typingInterval);
      window.clearTimeout(submitTimer);
      window.clearTimeout(messageTimer);
      window.clearTimeout(loadingTimer);
      window.clearTimeout(completeTimer);
    };
  }, [animationStarted, prefersReducedMotion]);

  useEffect(() => {
    if (!openingAnimationRunning) return undefined;

    const page = document.documentElement;
    const body = document.body;
    const previousPageOverflow = page.style.overflow;
    const previousPageOverscroll = page.style.overscrollBehavior;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyOverscroll = body.style.overscrollBehavior;

    page.style.overflow = 'hidden';
    page.style.overscrollBehavior = 'none';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';

    return () => {
      page.style.overflow = previousPageOverflow;
      page.style.overscrollBehavior = previousPageOverscroll;
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousBodyOverscroll;
    };
  }, [openingAnimationRunning]);

  return (
    <div className="compressed-chat-walkthrough" aria-busy={openingAnimationRunning} ref={previewRef}>
      <section
        className="compressed-chat-preview"
        aria-label="Compressed reproduction of PolicyEngine UK Chat"
      >
        <div className="compressed-chat-main">
          <div
            className={`compressed-chat-empty-state ${['message', 'loading', 'complete'].includes(animationPhase) ? 'has-message' : ''}`}
          >
            <h3>What&apos;s on your mind today?</h3>

            <div className="compressed-chat-composer-wrap">
              <div className="compressed-chat-composer">
                <div
                  className="compressed-chat-user-request"
                  aria-label={
                    ['message', 'loading', 'complete'].includes(animationPhase)
                      ? 'User request'
                      : 'Draft user request'
                  }
                >
                  {typedRequest}
                  <span className="compressed-chat-caret" aria-hidden="true" />
                </div>
                <div className="compressed-chat-composer-actions">
                  <div className="compressed-chat-composer-tools">
                    <span className="compressed-chat-attach" aria-hidden="true">
                      <IconPaperclip />
                    </span>
                  </div>
                  <span
                    className={`compressed-chat-send ${typedRequest ? 'is-active' : ''} ${animationPhase === 'submitting' ? 'is-submitting' : ''}`}
                    aria-hidden="true"
                  >
                    <IconArrowUp />
                  </span>
                </div>
              </div>
            </div>

            <div className="compressed-chat-transcript">
              {activeStage !== 5 && ['message', 'loading', 'complete'].includes(animationPhase) && (
                <div className="compressed-chat-loading" role="status" aria-label="UK Chat is working">
                  <span />
                  <span />
                  <span />
                </div>
              )}

              {[1, 2, 3].includes(activeStage) && animationPhase === 'complete' && (
                <div className="compressed-chat-working">Working through the problem</div>
              )}

              {[4, 5].includes(activeStage) && animationPhase === 'complete' && (
                <CalculationWorkingDisclosure key={activeStage} />
              )}

              {activeStage === 5 && animationPhase === 'complete' && (
                <div className="compressed-chat-assistant-answer" aria-label="UK Chat answer">
                  <p>{walkthroughAnswerSummary}</p>
                  <p>{walkthroughAnswerMethod}</p>
                </div>
              )}
            </div>
          </div>

          {activeStage === 0 && animationPhase === 'complete' && (
            <div className="compressed-chat-ground-stage">
              <section className="compressed-chat-ground-description" aria-labelledby="ground-stage-title">
                <div className="compressed-chat-ground-meta">
                  <span>Step 1 · AI model</span>
                  <span>Ground</span>
                </div>
                <h4 id="ground-stage-title">A structured opening plan</h4>
                <div className="compressed-chat-ground-description-body">{requestSteps[0].body}</div>
              </section>

              <section
                className="compressed-chat-ground-technical"
                aria-label="Ground stage technical exchange"
              >
                <div className="example-section">
                  <div className="example-section-title">
                    The user&apos;s message, as the gateway receives it
                  </div>
                  <pre className="compressed-chat-ground-code">
                    <code>{`last_user_message="${walkthroughUserRequest}"`}</code>
                  </pre>
                </div>
                <div className="example-section">
                  <div className="example-section-title">Proposed plan</div>
                  <pre className="compressed-chat-ground-code compressed-chat-ground-code-plan">
                    <code>{JSON.stringify(groundProposedPlan, null, 2)}</code>
                  </pre>
                </div>
              </section>
            </div>
          )}

          {activeStage === 1 && animationPhase === 'complete' && (
            <div className="compressed-chat-ground-stage">
              <section className="compressed-chat-ground-description" aria-labelledby="resolve-stage-title">
                <div className="compressed-chat-ground-meta">
                  <span>Step 2 · Gateway</span>
                  <span>Resolve</span>
                </div>
                <h4 id="resolve-stage-title">Current catalogue evidence</h4>
                <div className="compressed-chat-ground-description-body">{requestSteps[1].body}</div>
              </section>

              <section
                className="compressed-chat-ground-technical"
                aria-label="Resolve stage technical exchange"
              >
                <div className="example-section">
                  <div className="example-section-title">Catalogue query</div>
                  <pre className="compressed-chat-ground-code">
                    <code>{resolveCatalogueCall}</code>
                  </pre>
                </div>
                <div className="example-section">
                  <div className="example-section-title">Match</div>
                  <pre className="compressed-chat-ground-code">
                    <code>{JSON.stringify(resolveCatalogueMatch, null, 2)}</code>
                  </pre>
                </div>
                <div className="example-section">
                  <div className="example-section-title">Why the match can be used</div>
                  <div className="compressed-chat-evidence-list">
                    <div>
                      <span aria-hidden="true">✓</span>
                      <code>gov.hmrc.child_benefit.amount.eldest</code>
                    </div>
                    <div>
                      <span aria-hidden="true">·</span>
                      <span>Returned from the installed UK package, not from model memory</span>
                    </div>
                    <div>
                      <span aria-hidden="true">·</span>
                      <span>“Eldest-child rate” matches the parameter&apos;s catalogue label</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeStage === 2 && animationPhase === 'complete' && (
            <div className="compressed-chat-ground-stage">
              <section
                className="compressed-chat-ground-description compressed-chat-gate-description"
                aria-labelledby="gate-stage-title"
              >
                <div className="compressed-chat-ground-meta">
                  <span>Step 3 · Gateway</span>
                  <span>Gate</span>
                </div>
                <h4 id="gate-stage-title">Five deterministic outcomes</h4>
                <div className="compressed-chat-ground-description-body">
                  <p>
                    The gateway applies fixed policy to the grounded, catalogue-backed plan and assigns one of
                    five outcomes. Only a <strong>ready</strong> request may enter the calculation loop.
                  </p>
                  <p>
                    The gate is deliberately biased towards computing. If the classifier errors or returns
                    something the server cannot read, the request is treated as ready rather than refused, on
                    the view that a wrong refusal costs more than a wrong attempt. The guarantees that follow
                    come from the tools, not from the gate.
                  </p>
                  <ul className="gateway-outcomes">
                    <li>
                      <strong>Ready:</strong> the request is complete and supported, so calculation can begin.
                    </li>
                    <li>
                      <strong>Needs plan:</strong> a required choice is missing, so the chat asks a clarifying
                      question.
                    </li>
                    <li>
                      <strong>Partial:</strong> the request mixes supported and unsupported outputs, so the
                      chat offers the supported part.
                    </li>
                    <li>
                      <strong>Out of scope:</strong> the requested policy output cannot be modelled, so
                      calculation tools stay closed.
                    </li>
                    <li>
                      <strong>Irrelevant:</strong> the request is unrelated to UK tax and benefit policy and
                      takes a lightweight response path.
                    </li>
                  </ul>
                </div>
              </section>

              <section
                className="compressed-chat-ground-technical"
                aria-label="Gate stage technical exchange"
              >
                <div className="example-section">
                  <div className="example-section-title">Gated plan</div>
                  <pre className="compressed-chat-ground-code">
                    <code>{gateCall}</code>
                  </pre>
                </div>
                <div className="example-section">
                  <div className="example-section-title">Verdict</div>
                  <pre className="compressed-chat-ground-code">
                    <code>{JSON.stringify(gateVerdict, null, 2)}</code>
                  </pre>
                </div>
              </section>
            </div>
          )}

          {activeStage === 3 && animationPhase === 'complete' && (
            <div className="compressed-chat-ground-stage">
              <section className="compressed-chat-ground-description" aria-labelledby="verify-stage-title">
                <div className="compressed-chat-ground-meta">
                  <span>Step 4 · Gateway</span>
                  <span>Verify</span>
                </div>
                <h4 id="verify-stage-title">Exact reform construction</h4>
                <div className="compressed-chat-ground-description-body">
                  <p>
                    A society-wide reform receives a second bounded check. The resolver searches the rules
                    engine&apos;s current reform targets, binds the user&apos;s wording to an exact parameter
                    path and date, and constructs reform JSON. The validator must accept that construction
                    before a simulation can run.
                  </p>
                  <p>
                    What the gateway approves is then the only reform that can run. The simulation tool
                    compares the reform it is handed against the approved construction and refuses anything
                    that does not match, so a different reform cannot be substituted after the check has
                    passed.
                  </p>
                </div>
              </section>

              <section
                className="compressed-chat-ground-technical"
                aria-label="Verify stage technical exchange"
              >
                <div className="example-section">
                  <div className="example-section-title">Resolver construction</div>
                  <pre className="compressed-chat-ground-code">
                    <code>{verifyReformCall}</code>
                  </pre>
                </div>
                <div className="example-section">
                  <div className="example-section-title">Approved for this turn</div>
                  <pre className="compressed-chat-ground-code">
                    <code>{JSON.stringify(approvedReform, null, 2)}</code>
                  </pre>
                </div>
                <div className="example-section">
                  <div className="example-section-title">Validation findings</div>
                  <div className="compressed-chat-evidence-list">
                    <div>
                      <span aria-hidden="true">✓</span>
                      <span>The path exists in the parameter schema</span>
                    </div>
                    <div>
                      <span aria-hidden="true">✓</span>
                      <span>
                        <code>30.0</code> is valid for a currency-GBP parameter
                      </span>
                    </div>
                    <div>
                      <span aria-hidden="true">✓</span>
                      <span>The 2026 date range falls inside the package&apos;s coverage</span>
                    </div>
                    <div>
                      <span aria-hidden="true">×</span>
                      <span>An unrecognised path would be rejected here</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeStage === 4 && animationPhase === 'complete' && (
            <div className="compressed-chat-ground-stage">
              <section className="compressed-chat-ground-description" aria-labelledby="calculate-stage-title">
                <div className="compressed-chat-ground-meta">
                  <span>Step 5 · Supporting tools</span>
                  <span>Calculate</span>
                </div>
                <h4 id="calculate-stage-title">A bounded 21-tool runtime</h4>
                <div className="compressed-chat-ground-description-body">{requestSteps[4].body}</div>
              </section>

              <section
                className="compressed-chat-ground-technical"
                aria-label="Calculate stage public tool sequence"
              >
                <div className="example-section">
                  <div className="example-section-title">Five public calls, one turn</div>
                  <pre className="compressed-chat-ground-code">
                    <code>{`list_reform_targets
  ↓ parameter path
get_parameter
  ↓ current value and unit
validate_reform
  ↓ validated reform
run_society_simulation
  ↓ result_id
compute_budgetary_impact`}</code>
                  </pre>
                </div>
                <div className="example-section">
                  <div className="example-section-title">Typed result handoff</div>
                  <pre className="compressed-chat-ground-code">
                    <code>{`run_society_simulation returns result_id
  → passed as simulation_id
  → compute_budgetary_impact returns computed totals`}</code>
                  </pre>
                </div>
                <div className="example-section">
                  <div className="example-section-title">Provenance rule</div>
                  <p className="compressed-chat-technical-note">
                    Every argument comes from the user or a preceding call. Expand “Working through the
                    problem” above to inspect each call and result.
                  </p>
                </div>
              </section>
            </div>
          )}

          {activeStage === 5 && animationPhase === 'complete' && (
            <div className="compressed-chat-ground-stage">
              <section className="compressed-chat-ground-description" aria-labelledby="stream-stage-title">
                <div className="compressed-chat-ground-meta">
                  <span>Step 6 · Gateway</span>
                  <span>Stream</span>
                </div>
                <h4 id="stream-stage-title">An inspectable response</h4>
                <div className="compressed-chat-ground-description-body">{requestSteps[5].body}</div>
              </section>

              <section
                className="compressed-chat-ground-technical"
                aria-label="Stream stage technical event sequence"
              >
                <div className="example-section">
                  <div className="example-section-title">Public server-sent events</div>
                  <pre className="compressed-chat-ground-code">
                    <code>{streamEventSequence}</code>
                  </pre>
                </div>
              </section>
            </div>
          )}
        </div>
      </section>

      <aside className="walkthrough-stage-map compressed-chat-stage-map" aria-label="Walkthrough stages">
        <div className="walkthrough-stage-map-panel">
          <div className="walkthrough-stage-map-heading">One request, six stages</div>
          <ol>
            {requestSteps.map((step, index) => (
              <li key={step.number}>
                <button
                  aria-current={activeStage === index ? 'step' : undefined}
                  className={`walkthrough-stage-map-button ${activeStage === index ? 'active' : ''}`}
                  disabled={openingAnimationRunning}
                  onClick={() => onStageChange(index)}
                  type="button"
                >
                  <span className="walkthrough-stage-map-number">{step.number}</span>
                  <span className="walkthrough-stage-map-copy">
                    <strong>{step.title}</strong>
                    <small>{step.segment}</small>
                  </span>
                </button>
                {index < requestSteps.length - 1 && (
                  <span className="walkthrough-stage-map-arrow" aria-hidden="true">
                    ↓
                  </span>
                )}
              </li>
            ))}
          </ol>
          <div className="compressed-chat-stage-controls">
            <button
              aria-label="Previous stage"
              disabled={openingAnimationRunning || activeStage === 0}
              onClick={() => onStageChange(Math.max(0, activeStage - 1))}
              type="button"
            >
              <IconArrowLeft aria-hidden="true" />
            </button>
            <div className="walkthrough-stage-map-progress" aria-live="polite">
              Stage {activeStage + 1} of {requestSteps.length}
            </div>
            <button
              aria-label="Next stage"
              disabled={openingAnimationRunning || activeStage === requestSteps.length - 1}
              onClick={() => onStageChange(Math.min(requestSteps.length - 1, activeStage + 1))}
              type="button"
            >
              <IconArrowRight aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

const questionItems = questionKinds.map((kind) => ({ key: kind.id, kind }));

function WhatYouCanAsk() {
  const [activeKind, setActiveKind] = useState(questionKinds[0]);

  return (
    <FadeIn>
      <h2>What you can ask</h2>
      <p>
        The Child Benefit reform above is one of four kinds of questions supported today, and users can stack
        these questions within one conversation without starting a new chat.
      </p>
      <CardTabs
        idPrefix="question-kind"
        label="Kinds of question"
        meta={`${questionKinds.length} kinds · one thread`}
        items={questionItems}
        activeIndex={questionKinds.indexOf(activeKind)}
        onSelect={(item) => setActiveKind(item.kind)}
        cardsClassName="tool-cards question-cards"
        renderCard={(item, index) => (
          <>
            <span className="iteration-num">{index + 1}</span>
            <span className="iteration-title">{item.kind.name}</span>
            <span className="iteration-subtitle">{item.kind.summary}</span>
          </>
        )}
      >
        <div className="question-example">
          <p className="question-example-prompt">“{activeKind.question}”</p>
          <p>{activeKind.description}</p>
          {activeKind.tools.length > 0 && (
            <div className="question-tools">
              <div className="question-tools-label">Possible tool usage</div>
              <div className="question-tools-chips">
                {activeKind.tools.map((tool) => (
                  <span className="question-tool" key={tool}>
                    <code>{tool}</code>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardTabs>
    </FadeIn>
  );
}

function Limitations() {
  return (
    <FadeIn>
      <h2>Limitations</h2>
      <p>
        Some of what follows is a deliberate boundary that will not change. The rest is the current state of a
        beta: reform coverage is incomplete, answers vary in how fully they state their assumptions, and
        gateway behaviour will move as we act on what users report. Widening the range of reforms the typed
        tools cover, and the evidence the gateway can resolve before calculation, is where the work goes next.
      </p>
      <p>
        The chat is a <strong>modelling tool, not advice</strong>. It reports what the engine calculates under
        stated assumptions, and it is not a substitute for professional guidance on an individual&apos;s
        circumstances.
      </p>
      <p>
        Society results are direct static microsimulation estimates. They do not estimate behavioural
        responses, employment effects, inflation, GDP, market reactions, or general-equilibrium effects. When
        a request mixes a supported policy result with one of those effects, the gateway says which part it
        cannot calculate and asks whether to run the part it can, rather than running anything that turn.
      </p>
      <p>
        Results depend on the dataset, year, and modelling assumptions, and the chat states these dependencies
        rather than presenting figures as universal. They should still be checked against independent
        estimates from organisations such as the Institute for Fiscal Studies, Resolution Foundation, or
        Office for Budget Responsibility.
      </p>
    </FadeIn>
  );
}

function NextStepsAndTryIt() {
  return (
    <FadeIn>
      <h2>Try it yourself</h2>
      <p>
        UK Chat&apos;s answers can be cited and reproduced because the figures come from the same open engine
        that powers the rest of PolicyEngine, and it sits alongside PolicyEngine&apos;s wider generative AI
        integrations and plugin ecosystem for researchers building their own analyses. Try it with a reform,
        then inspect the stated year, dataset, comparator, and method alongside the answer.
      </p>
      <p>
        Because this is a beta, the cases where it fails are more useful to us than the cases where it works:
        a request refused that the tools should support, an answer that omits an assumption it should state,
        or a figure that does not match what the engine returns for the same reform. PolicyEngine&apos;s
        policy team is working through the same exercise, and what they and other early users report will
        decide what we change first.
      </p>
      <ChatCta />
    </FadeIn>
  );
}

function ChatCta() {
  return (
    <div className="article-cta-wrap">
      <a className="article-cta" href="https://policyengine.org/uk/chat" target="_blank" rel="noreferrer">
        Try PolicyEngine UK Chat
        <span className="article-cta-beta">Beta</span>
      </a>
    </div>
  );
}

function AuthorSection() {
  return (
    <FadeIn className="author-section">
      {authors.map((author) => (
        <div className="author-row" key={author.id}>
          <img className="author-headshot" src={author.headshot} alt={author.name} width="70" height="70" />
          <div className="author-details">
            <a className="author-name" href={`https://policyengine.org/uk/research?authors=${author.id}`}>
              {author.name}
            </a>
            <div className="author-title">{author.title}</div>
          </div>
        </div>
      ))}
    </FadeIn>
  );
}

export default function App() {
  return (
    <>
      <SiteHeader />
      <main className="scrolly-container">
        <article className="article-wrapper">
          <Hero />
          <Introduction />
          <TodayWorkflow />
          <Problem />
          <Boundary />
          <ToolExplorer />
          <AnswerWalkthrough />
          <WhatYouCanAsk />
          <Limitations />
          <NextStepsAndTryIt />
          <AuthorSection />
          <p className="footer">
            PolicyEngine builds free, open-source tools to help people understand public policy.
          </p>
        </article>
      </main>
    </>
  );
}
