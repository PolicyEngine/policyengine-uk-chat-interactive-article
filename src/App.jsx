import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import SiteHeader from './SiteHeader';
import anthonyVolkHeadshot from './assets/authors/anthony-volk.webp';
import vahidAhmadiHeadshot from './assets/authors/vahid-ahmadi.webp';

const toolFamilies = [
  {
    name: 'Discovery',
    summary: 'Find exact variables, parameters, entities, reform targets, and supported outputs.',
    purpose: 'Discovery keeps the model from guessing the names of things in PolicyEngine.',
    tools: [
      {
        name: 'list_entities',
        summary: 'Lists the PolicyEngine UK model entities and the number of variables defined for each one.',
      },
      {
        name: 'search_variables',
        summary:
          'Searches the UK variable registry and identifies each match’s entity and default-output status.',
      },
      {
        name: 'get_variable',
        summary:
          'Verifies one exact UK variable and returns its metadata, entity, and default-output status.',
      },
      {
        name: 'search_parameters',
        summary: 'Searches policy parameters by path, label, description, or known alias.',
      },
      {
        name: 'get_parameter',
        summary:
          'Looks up one exact policy parameter and returns its metadata and value for a selected year.',
      },
      {
        name: 'list_reform_targets',
        summary: 'Searches the current catalogue for parameter paths that can be used in a reform.',
      },
      {
        name: 'list_household_input_variables',
        summary: 'Lists known variables that can be supplied as overrides for an illustrative household.',
      },
      {
        name: 'list_society_output_variables',
        summary: 'Lists the variables a society simulation materialises by default, grouped by entity.',
      },
      {
        name: 'list_supported_outputs',
        summary: 'Lists the household, society, derivative, and chart outputs supported by the chat runtime.',
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
      },
      {
        name: 'validate_household',
        summary: 'Validates an illustrative synthetic UK household against PolicyEngine variable metadata.',
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
      },
      {
        name: 'run_society_simulation',
        summary:
          'Runs baseline and reform UK simulations and returns metadata plus a turn-local result handle.',
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
      },
      {
        name: 'compute_program_breakdown',
        summary:
          'Calculates programme-level totals, caseloads, winners, and losers from a society simulation.',
      },
      {
        name: 'compute_decile_impacts',
        summary:
          'Calculates changes in mean household income across a selected income- or wealth-decile concept.',
      },
      {
        name: 'compute_winners_losers',
        summary:
          'Calculates people-weighted gain, loss, and no-change shares within income or wealth deciles.',
      },
      {
        name: 'compute_poverty_metrics',
        summary: 'Calculates UK poverty rates and headcounts overall and by age under baseline and reform.',
      },
      {
        name: 'compute_inequality_metrics',
        summary:
          'Calculates the Gini coefficient and changes in the top 10%, top 1%, and bottom 50% income shares.',
      },
      {
        name: 'aggregate_result',
        summary:
          'Calculates a weighted sum, mean, or count for a verified variable without returning survey rows.',
      },
    ],
  },
  {
    name: 'Presentation',
    summary: 'Build a chart from a calculation result using a constrained chart schema.',
    purpose:
      'Charts are constructed from stored results, so the displayed artefact stays tied to the calculation.',
    tools: [
      {
        name: 'generate_chart',
        summary:
          'Generates frontend-renderable chart markdown from a stored result or constrained chart data.',
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
      'The household is constructed as a synthetic input, validated, and run through the model to produce taxes, benefits, and net income under stated assumptions. One household containing one benefit unit per call; more complex arrangements need separate calls.',
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
      'When a comparison reads better as a picture than as prose, the computed output is mapped onto a fixed chart preset. The chart is drawn from the same typed result as the text, so the two cannot disagree.',
    tools: ['generate_chart'],
  },
  {
    id: 'follow-ups',
    name: 'Follow-ups',
    summary: 'One continuous thread',
    question: 'And what if I made it £3,000 instead?',
    description:
      'Follow-ups stay in the same thread. The conversation carries the context; the simulation handles do not. Each turn re-runs what it needs, so a later answer never quietly rests on an earlier turn’s in-memory state.',
    tools: ['gateway route', 'full lifecycle'],
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

const requestSteps = [
  {
    number: 1,
    title: 'Ground',
    subtitle: 'A structured opening plan',
    segment: 'AI model',
    body: (
      <>
        <p>
          A fast model reads the user&apos;s words and proposes a structured description of the request. It
          separates inputs the user actually supplied from the output they asked for and suggests which tools
          may be needed. This is an interpretation, not yet permission to calculate.
        </p>
      </>
    ),
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
          It then refines the plan with the relevant tool inputs and declared defaults—for example, using the
          current year when the user does not name one. Any choice the system cannot resolve safely stays
          explicit instead of being silently invented.
        </p>
      </>
    ),
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
      </>
    ),
  },
  {
    number: 5,
    title: 'Calculate',
    subtitle: 'A bounded 21-tool runtime',
    segment: 'Supporting tools',
    body: (
      <>
        <p>
          A model selected for the request&apos;s type and size executes the verified plan through one or more
          of 21 public tools. Simulation tools apply the tax and benefit rules; analysis tools derive budget,
          programme, distributional, poverty, inequality, or gain-and-loss results from a stored simulation.
        </p>
        <p>
          The model chooses and sequences tools, but it does not supply the figures. Each number comes back as
          tool data produced by the PolicyEngine UK model.
        </p>
      </>
    ),
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
          explicit terminal events. Tool errors return as data so the model can recover without inventing a
          result.
        </p>
      </>
    ),
  },
];

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
      <h1>PolicyEngine UK Chat: a new conversational interface for understanding tax and benefits</h1>
      <p className="subtitle">
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
        benefit policy and reform because models can read loosely worded questions and answer them in plain
        language. This presents a problem: for many users, tax and benefit questions directly affect their
        lives and livelihoods, so they require correct, verifiable answers. Language models generate responses
        from learned statistical patterns, and an answer may be partly or wholly wrong.
      </p>
      <p>
        PolicyEngine therefore built UK Chat, an AI chat interface that combines conversational AI with
        PolicyEngine&apos;s deterministic rules and simulation engine. A language model interprets an
        open-ended request and proposes a structured plan. The gateway checks the proposed inputs and output
        against the current PolicyEngine catalogue; only then do deterministic tools compute quantitative
        policy results from actual tax and benefit rules.
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
        Prompting does not make a model apply tax and benefit rules. Telling it to state only “real” figures
        changes the wording, not the source of the calculation. The answer reads the same whether it is right
        or wrong, so prose alone cannot verify it. The UK Parliament&apos;s{' '}
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
        illustrates. Anyone comparing two reforms needs figures from a fixed model, not an AI&apos;s
        recollection of figures it has seen. The same applies to a household working out how a reform affects
        its income: the figure has to come from clear rules, with assumptions written down, so that it can be
        checked.
      </p>
      <p>
        We have measured this directly. In{' '}
        <a href="https://policyengine.org/us/research/introducing-policybench">PolicyBench</a>, an evaluation
        built on the US tax and benefit system, we scored how accurately AI models compute taxes and benefits
        from household prompts with no tools and no lookups, against deterministic PolicyEngine outputs. In
        the launch results the top model matched PolicyEngine exactly on <strong>80.3%</strong> of its scored
        outputs. Computed amounts were the hardest cases: income tax before credits scored far below
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
      aria-label="The boundary between the predictive AI layer and the deterministic PolicyEngine engine: the model interprets the question and calls typed tools; the engine validates, simulates, and computes; the model then explains the returned numbers."
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
        width="380"
        height="220"
        rx="14"
        fill="rgba(13,115,119,0.05)"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeDasharray="8 5"
      />
      <text x="210" y="66" className="lane-label" fill="#0d7377">
        PREDICTIVE — LANGUAGE MODEL
      </text>

      <rect
        x="500"
        y="40"
        width="380"
        height="220"
        rx="14"
        fill="rgba(44,100,150,0.05)"
        stroke="#2c6496"
        strokeWidth="1.5"
        strokeDasharray="8 5"
      />
      <text x="690" y="66" className="lane-label" fill="#2c6496">
        DETERMINISTIC — POLICYENGINE UK
      </text>

      <rect x="50" y="88" width="150" height="56" rx="10" fill="#fff" stroke="#0d7377" strokeWidth="2" />
      <text x="125" y="112" className="network-label">
        Interpret the
      </text>
      <text x="125" y="130" className="network-label">
        question
      </text>

      <rect x="220" y="88" width="150" height="56" rx="10" fill="#fff" stroke="#0d7377" strokeWidth="2" />
      <text x="295" y="112" className="network-label">
        Choose a tool
      </text>
      <text x="295" y="130" className="network-label">
        and arguments
      </text>

      <rect x="135" y="176" width="150" height="56" rx="10" fill="#fff" stroke="#0d7377" strokeWidth="2" />
      <text x="210" y="200" className="network-label">
        Explain the
      </text>
      <text x="210" y="218" className="network-label">
        returned numbers
      </text>

      <rect x="530" y="88" width="150" height="56" rx="10" fill="#fff" stroke="#2c6496" strokeWidth="2" />
      <text x="605" y="112" className="network-label">
        Validate
      </text>
      <text x="605" y="130" className="network-label">
        and look up
      </text>

      <rect x="700" y="88" width="150" height="56" rx="10" fill="#fff" stroke="#2c6496" strokeWidth="2" />
      <text x="775" y="112" className="network-label">
        Simulate
      </text>
      <text x="775" y="130" className="network-label">
        baseline + reform
      </text>

      <rect x="615" y="176" width="150" height="56" rx="10" fill="#fff" stroke="#2c6496" strokeWidth="2" />
      <text x="690" y="200" className="network-label">
        Weighted outputs
      </text>
      <text x="690" y="218" className="network-label">
        and chart rows
      </text>

      <line
        x1="450"
        y1="30"
        x2="450"
        y2="270"
        stroke="#1a202c"
        strokeWidth="2"
        strokeDasharray="4 6"
        opacity="0.45"
      />
      <text x="450" y="22" className="lane-label boundary-label" fill="#1a202c">
        TYPED TOOL BOUNDARY
      </text>

      <line
        x1="200"
        y1="116"
        x2="216"
        y2="116"
        className="boundary-connector"
        strokeWidth="1.8"
        strokeLinecap="round"
        markerEnd="url(#boundary-arrow)"
      />
      <line
        x1="370"
        y1="116"
        x2="526"
        y2="116"
        className="boundary-connector"
        strokeWidth="1.8"
        strokeLinecap="round"
        markerEnd="url(#boundary-arrow)"
      />
      <text x="448" y="106" className="network-label flow-caption">
        tool call
      </text>
      <line
        x1="680"
        y1="116"
        x2="696"
        y2="116"
        className="boundary-connector"
        strokeWidth="1.8"
        strokeLinecap="round"
        markerEnd="url(#boundary-arrow)"
      />
      {/* Simulate sits above and to the right of Weighted outputs, so this drops
          out of its base and sweeps into the top edge rather than turning a hard
          corner and nosing into the right edge with a 6px stub. */}
      <path
        d="M775 144 C775 158 690 158 690 172"
        className="boundary-connector"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        markerEnd="url(#boundary-arrow)"
      />
      <line
        x1="611"
        y1="204"
        x2="289"
        y2="204"
        className="boundary-connector"
        strokeWidth="1.8"
        strokeLinecap="round"
        markerEnd="url(#boundary-arrow)"
      />
      <text x="450" y="194" className="network-label flow-caption">
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
        The central design decision is where the predictive layer stops and the deterministic layer starts.
      </p>
      <p>
        The <strong>predictive</strong> parts are the ones language models are genuinely good at: interpreting
        wording, deciding which kind of analysis is being requested, drafting the explanation, and suggesting
        a sensible follow-up. Those tasks are open-ended and language-heavy.
      </p>
      <p>
        The <strong>deterministic</strong> parts are the ones users need to be able to check: validating the
        request, looking up parameters, constructing household inputs, running simulations, computing weighted
        outputs, and producing chart data. None of these depends on model memory. The runtime enforces the
        boundary rather than asking the model to respect it in a prompt.
      </p>
      <div className="agent-flow-container boundary-flow-container">
        <BoundaryDiagram />
      </div>
      <p>
        When a question is ready for computation, the model receives the calculation tools plus a reference
        generated from the installed engine: its capabilities and its parameter schema. What the model
        believes it can compute is therefore tied to the deployed version of PolicyEngine, not to a
        hand-written prompt that drifts out of date.
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
      <h2>The model proposes a plan</h2>
      <p>
        UK Chat breaks the user pathway into three segments: the AI model, the gateway, and supporting tools.
      </p>
      <p>
        First, the AI language model still does the predictive work it excels at. It takes the user&apos;s
        open-ended natural-language prompt and develops a simulation or analysis plan. This plan has a
        required format and is required to use one or more deterministic tools (more on those later) that are
        directly connected to the PolicyEngine UK tax and benefit simulation engine.
      </p>
      <p>
        Next, UK Chat&apos;s gateway verifies and sometimes constrains that plan to ensure PolicyEngine
        provides the tools required to answer the question. The gateway may also ask the user for
        clarification before finalising a plan.
      </p>

      <h2>Tools make the calculation deterministic</h2>
      <p>
        At this point, UK Chat has a gateway-verified plan. This plan relies on one or more deterministic
        tools that UK Chat exposes to ensure that every figure displayed to a user is rooted in verifiable
        calculations rather than language-model predictions.
      </p>
      <p>
        UK Chat&apos;s AI model-facing tools are narrow by design. The tools fall into one of five types, each
        used to keep the model within supported operations while creating, verifying, or executing a plan.
        Explore these categories in the interactive below.
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
        </div>
      </CardTabs>
    </FadeIn>
  );
}

function RequestFlowDiagram({ activeStep }) {
  return (
    <svg
      className="flow-diagram-svg request-flow-svg"
      viewBox="0 0 480 590"
      role="img"
      aria-label="PolicyEngine UK Chat six-stage lifecycle: Ground, Resolve, Gate, Verify, Calculate, and Stream"
    >
      <defs>
        <marker id="request-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#0d7377" />
        </marker>
      </defs>
      {requestSteps.map((step, index) => {
        const y = 18 + index * 92;
        const active = activeStep === index;
        return (
          <g key={step.title}>
            {index > 0 && (
              <line
                x1="198"
                y1={y - 35}
                x2="198"
                y2={y - 8}
                stroke="#0d7377"
                strokeWidth="2"
                markerEnd="url(#request-arrow)"
              />
            )}
            <rect
              x="58"
              y={y}
              width="280"
              height="58"
              rx="10"
              fill={active ? '#0d7377' : '#ffffff'}
              stroke="#0d7377"
              strokeWidth={active ? 3 : 2}
            />
            <circle cx="90" cy={y + 29} r="16" fill={active ? '#ffffff' : '#0d7377'} />
            <text
              x="90"
              y={y + 34}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="14"
              fontWeight="700"
              fill={active ? '#0d7377' : '#ffffff'}
            >
              {index + 1}
            </text>
            <text
              x="124"
              y={y + 25}
              fontFamily="JetBrains Mono, monospace"
              fontSize="16"
              fontWeight="600"
              fill={active ? '#ffffff' : '#1e3a3a'}
            >
              {step.title}
            </text>
            <text
              x="124"
              y={y + 45}
              fontFamily="Source Serif 4, Georgia, serif"
              fontSize="12.5"
              fill={active ? '#e7f5f4' : '#4a6363'}
            >
              {step.segment}
            </text>
          </g>
        );
      })}

      <path
        d="M338 231 C346 231 348 231 354 231"
        fill="none"
        stroke="#0d7377"
        strokeWidth="2"
        markerEnd="url(#request-arrow)"
      />
      <rect x="360" y="205" width="116" height="52" rx="9" fill="#e7f5f4" stroke="#0d7377" />
      <text
        x="418"
        y="226"
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize="11"
        fill="#0d7377"
      >
        non-ready paths
      </text>
      <text
        x="418"
        y="244"
        textAnchor="middle"
        fontFamily="Source Serif 4, Georgia, serif"
        fontSize="11"
        fill="#4a6363"
      >
        clarify · explain
      </text>
      <path
        d="M338 415 C450 415 450 375 338 391"
        fill="none"
        stroke="#0d7377"
        strokeWidth="2"
        strokeDasharray="7 5"
        markerEnd="url(#request-arrow)"
      />
      <text
        x="404"
        y="437"
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize="11"
        fill="#4a6363"
      >
        tool-result loop
      </text>
    </svg>
  );
}

function ArchitectureScrolly() {
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef([]);
  const stepRatios = useRef(new Map());

  useEffect(() => {
    const ratios = stepRatios.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.dataset.step);
          ratios.set(index, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        const mostVisible = [...ratios.entries()]
          .filter(([, ratio]) => ratio > 0)
          .sort(([, firstRatio], [, secondRatio]) => secondRatio - firstRatio)[0];

        if (mostVisible) {
          setActiveStep(mostVisible[0]);
        }
      },
      { rootMargin: '-74px 0px -45% 0px', threshold: [0, 0.15, 0.4, 0.7] },
    );

    stepRefs.current.forEach((node) => node && observer.observe(node));
    return () => {
      observer.disconnect();
      ratios.clear();
    };
  }, []);

  return (
    <FadeIn>
      <h2>Under the hood</h2>
      <p>
        Here&apos;s what happens inside a single request. UK Chat&apos;s core runtime is a FastAPI
        server-sent-events handler that calls the Anthropic SDK directly. There is no generic agent framework
        in the request path. The chat owns both the opening gateway and the tool loop, so the rules that
        matter can be enforced at the point where each decision is made. Each stage below is tagged with the
        segment that owns it.
      </p>
      <div className="scrollytelling-container">
        <div className="scrolly-narrative">
          {requestSteps.map((step, index) => (
            <section
              className={`narrative-step ${activeStep === index ? 'active' : ''}`}
              data-step={index}
              key={step.number}
              aria-current={activeStep === index ? 'step' : undefined}
              ref={(node) => {
                stepRefs.current[index] = node;
              }}
            >
              <div className="step-header">
                <span className="step-number">{step.number}</span>
                <span className="step-heading">
                  <span className="step-title">{step.title}</span>
                  <span className="step-subtitle">{step.subtitle}</span>
                </span>
                <span className="step-segment">{step.segment}</span>
              </div>
              <div className="step-content">{step.body}</div>
            </section>
          ))}
        </div>
        <aside className="scrolly-sticky">
          <div className="example-panel diagram-only">
            <div className="example-header">
              <span className="example-title">One request</span>
              <span className="example-badge">
                Step {activeStep + 1} of {requestSteps.length}
              </span>
            </div>
            <div className="example-body">
              <div className="diagram-container">
                <RequestFlowDiagram activeStep={activeStep} />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </FadeIn>
  );
}

function WorkedExample() {
  const phases = [
    {
      number: 1,
      title: 'Ground',
      segment: 'AI model',
      agents: ['£30 a week', '2026', 'budgetary impact'],
      description:
        'Extract the requested value, policy year, and output from the user’s exact words, while keeping the proposed plan separate from verified facts.',
    },
    {
      number: 2,
      title: 'Resolve',
      segment: 'Gateway',
      agents: ['catalogue search', 'exact parameter'],
      description:
        'Bind “eldest-child rate” to gov.hmrc.child_benefit.amount.eldest in the current catalogue and confirm that budgetary impact is supported.',
    },
    {
      number: 3,
      title: 'Gate',
      segment: 'Gateway',
      agents: ['ready', 'all inputs explicit'],
      description:
        'Classify the plan as ready because its required policy, value, year, and output are present and supported. Only this outcome opens the calculation loop.',
    },
    {
      number: 4,
      title: 'Verify',
      segment: 'Gateway',
      agents: ['effective 1 January 2026', 'validate_reform'],
      description:
        'Construct an exact dated reform that sets the parameter to 30.0, then validate it against the PolicyEngine UK rules engine before simulation.',
    },
    {
      number: 5,
      title: 'Calculate',
      segment: 'Supporting tools',
      agents: ['run_society_simulation', 'compute_budgetary_impact'],
      description:
        'Run current law and the approved reform on the same population, store the result, and pass its handle to the budgetary-impact derivative.',
    },
    {
      number: 6,
      title: 'Stream',
      segment: 'Gateway',
      agents: ['tool events', 'method and result'],
      description:
        'Stream the calculation trace and final answer with the comparator, dataset, method, and sign convention attached so the result can be inspected.',
    },
  ];

  return (
    <FadeIn>
      <h2>One reform, end to end</h2>
      <p>
        Consider: “For 2026, set the Child Benefit eldest-child rate to £30 a week and show the annual
        budgetary impact.” The request contains a policy, a final value, a year, and an output. It does not
        contain a PolicyEngine parameter path, a reform object, or the sequence of tools needed to answer it.
      </p>
      <div className="workflow-timeline">
        <div className="workflow-header">
          <div className="workflow-command-label">User request</div>
          <div className="workflow-command">For 2026, set the eldest-child rate to £30 a week</div>
        </div>
        <div className="timeline-phases">
          {phases.map((phase) => (
            <article className="timeline-phase" key={phase.number}>
              <div className="timeline-phase-header">
                <div className="timeline-phase-num">{phase.number}</div>
                <div className="timeline-phase-title">{phase.title}</div>
                <div className="timeline-phase-segment">{phase.segment}</div>
              </div>
              <div className="timeline-phase-card">
                <div className="timeline-agents">
                  {phase.agents.map((agent) => (
                    <span className="timeline-agent" key={agent}>
                      {agent}
                    </span>
                  ))}
                </div>
                <p className="timeline-phase-desc">{phase.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
      <section className="worked-result" aria-labelledby="worked-result-title">
        <div className="worked-result-heading">
          <div>
            <div className="worked-result-eyebrow">Computed result</div>
            <h3 id="worked-result-title">About £0.9 billion a year in additional government cost</h3>
          </div>
          <span className="worked-result-year">2026</span>
        </div>
        <p>
          A production run compares the reform with 2026 current law using PolicyEngine&apos;s Enhanced Family
          Resources Survey dataset for 2024–25, release 1.56.13. It is a direct static microsimulation
          estimate.
        </p>
        <div className="worked-result-table-wrap">
          <table className="worked-result-table">
            <caption>Annual change relative to current law</caption>
            <thead>
              <tr>
                <th scope="col">Measure</th>
                <th scope="col">Change</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Tax revenue</th>
                <td>+£0.2 billion</td>
              </tr>
              <tr>
                <th scope="row">Benefit spending</th>
                <td>+£1.1 billion</td>
              </tr>
              <tr className="worked-result-total">
                <th scope="row">Net budgetary impact</th>
                <td>−£0.9 billion</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="worked-result-note">
          A negative net budgetary impact means a cost to government. Figures are rounded to the nearest £0.1
          billion.
        </p>
      </section>
      <p>
        If the catalogue returned more than one materially plausible interpretation, or the reform resolver
        could not determine what year or reform the user was requesting, the calculation would pause before
        the tool loop and ask the user to confirm the intended construction.
      </p>
    </FadeIn>
  );
}

const questionItems = questionKinds.map((kind) => ({ key: kind.id, kind }));

function WhatYouCanAsk() {
  const [activeKind, setActiveKind] = useState(questionKinds[0]);

  return (
    <FadeIn>
      <h2>What you can ask</h2>
      <p>
        Four kinds of question are supported today, and they compose: a thread can move from a household
        example to a full reform analysis to a chart without switching tools.
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
        <div className="question-example" aria-live="polite" aria-atomic="true">
          <p className="question-example-prompt">“{activeKind.question}”</p>
          <p>{activeKind.description}</p>
          <div className="tool-name-list">
            {activeKind.tools.map((tool) => (
              <span className="question-tool" key={tool}>
                <code>{tool}</code>
              </span>
            ))}
          </div>
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
        The chat is a <strong>modelling tool, not advice</strong>. It reports what the model calculates under
        stated assumptions, and it is not a substitute for professional guidance on an individual&apos;s
        circumstances.
      </p>
      <p>
        Society results are direct static microsimulation estimates. They do not estimate behavioural
        responses, employment effects, inflation, GDP, market reactions, or general-equilibrium effects. When
        a request mixes a supported policy result with one of those effects, the gateway notifies the user
        that it cannot calculate these effects, then proceeds with what it can.
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
      <h2>What&apos;s next</h2>
      <p>
        We want to widen the range of reforms covered by typed tools, improve the speed and inspectability of
        more specialised analyses, and keep expanding the evidence the gateway can resolve before calculation.
        UK Chat also works alongside PolicyEngine&apos;s wider Claude integration and plugin ecosystem for
        researchers building their own analyses.
      </p>
      <h2>Try it yourself</h2>
      <p>
        UK Chat&apos;s answers can be cited and reproduced because the figures come from the same open engine
        that powers the rest of PolicyEngine. Try it with a reform you care about, then inspect the stated
        year, dataset, comparator, and method alongside the answer.
      </p>
      <a
        className="article-cta"
        href="https://policyengine-uk-chat.vercel.app/uk/chat"
        target="_blank"
        rel="noreferrer"
      >
        Try PolicyEngine UK Chat
      </a>
    </FadeIn>
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
          <Problem />
          <Boundary />
          <ToolExplorer />
          <ArchitectureScrolly />
          <WorkedExample />
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
