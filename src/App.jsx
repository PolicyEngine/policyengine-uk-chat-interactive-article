import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import SiteHeader from './SiteHeader';

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
        summary: 'Searches the UK variable registry and identifies each match’s entity and default-output status.',
      },
      {
        name: 'get_variable',
        summary: 'Verifies one exact UK variable and returns its metadata, entity, and default-output status.',
      },
      {
        name: 'search_parameters',
        summary: 'Searches policy parameters by path, label, description, or known alias.',
      },
      {
        name: 'get_parameter',
        summary: 'Looks up one exact policy parameter and returns its metadata and value for a selected year.',
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
        summary: 'Lists the variables a society simulation materializes by default, grouped by entity.',
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
        summary: 'Runs baseline and reform UK simulations and returns metadata plus a turn-local result handle.',
      },
    ],
  },
  {
    name: 'Analysis',
    summary: 'Turn a society simulation into specific, weighted policy results.',
    purpose: 'Dedicated derivatives calculate budget, programme, decile, poverty, inequality, and gain-or-loss results.',
    tools: [
      {
        name: 'compute_budgetary_impact',
        summary: 'Calculates changes in tax revenue, benefit spending, and the net budgetary impact of a reform.',
      },
      {
        name: 'compute_program_breakdown',
        summary: 'Calculates programme-level totals, caseloads, winners, and losers from a society simulation.',
      },
      {
        name: 'compute_decile_impacts',
        summary: 'Calculates changes in mean household income across a selected income- or wealth-decile concept.',
      },
      {
        name: 'compute_winners_losers',
        summary: 'Calculates people-weighted gain, loss, and no-change shares within income or wealth deciles.',
      },
      {
        name: 'compute_poverty_metrics',
        summary: 'Calculates UK poverty rates and headcounts overall and by age under baseline and reform.',
      },
      {
        name: 'compute_inequality_metrics',
        summary: 'Calculates the Gini coefficient and changes in the top 10%, top 1%, and bottom 50% income shares.',
      },
      {
        name: 'aggregate_result',
        summary: 'Calculates a weighted sum, mean, or count for a verified variable without returning survey rows.',
      },
    ],
  },
  {
    name: 'Presentation',
    summary: 'Build a chart from a calculation result using a constrained chart schema.',
    purpose: 'Charts are constructed from stored results, so the displayed artefact stays tied to the calculation.',
    tools: [
      {
        name: 'generate_chart',
        summary: 'Generates frontend-renderable chart markdown from a stored result or constrained chart data.',
      },
    ],
  },
];

const authors = [
  {
    id: 'vahid-ahmadi',
    name: 'Vahid Ahmadi',
    title: 'Research Associate at PolicyEngine',
    headshot: '/assets/authors/vahid-ahmadi.webp',
  },
  {
    id: 'anthony-volk',
    name: 'Anthony Volk',
    title: 'Full-Stack Engineer at PolicyEngine',
    headshot: '/assets/authors/anthony-volk.webp',
  },
];

const requestSteps = [
  {
    number: 1,
    title: 'Ground',
    subtitle: 'A structured opening plan',
    body: (
      <>
        <p>
          After receiving a user inquiry, UK Chat analyzes the input and uses a fast routing step to try to
          describe the user&apos;s request as a structured plan: the user&apos;s supplied input(s), their requested
          output(s), and any tools the model intends to use.
        </p>
      </>
    ),
  },
  {
    number: 2,
    title: 'Resolve',
    subtitle: 'Current catalogue evidence',
    body: (
      <>
        <p>
          Server-side discovery uses exposed tools to check named policies and variables against the current
          PolicyEngine catalogue. Exact and strong matches can support the plan; fuzzy matches remain suggestions
          rather than facts.
        </p>
        <p>
          The server also refines the plan using relevant tool inputs and UK Chat-specified defaults (e.g., if no
          year is provided by the user, infer that they want the current one). After this step, unresolved user
          choices remain explicit.
        </p>
      </>
    ),
  },
  {
    number: 3,
    title: 'Gate',
    subtitle: 'Five deterministic outcomes',
    body: (
      <>
        <p>
          Using the structured plan that we started in stage 1 and refined in stage 2, UK Chat decides what to do
          next. A complete request with inputs clearly stated by the user proceeds to computation. If any required
          inputs are missing, UK Chat asks the user for clarification. Mixed, unsupported, and unrelated requests
          take separate lightweight paths without calculation tools.
        </p>
      </>
    ),
  },
  {
    number: 4,
    title: 'Verify',
    subtitle: 'Exact reform construction',
    body: (
      <>
        <p>
          If UK Chat determines that the user wants to understand the society-wide impacts of a given tax or
          reform policy, then it performs a second, bounded check. The resolver searches the rules engine&apos;s
          reform targets to construct a user&apos;s requested reform, then passes it through a validator to ensure it
          can be run.
        </p>
      </>
    ),
  },
  {
    number: 5,
    title: 'Calculate',
    subtitle: 'A bounded 21-tool runtime',
    body: (
      <>
        <p>
          At this point, UK Chat has created a verified execution plan. An AI model selected for the type and size
          of the request uses one or more of the 21 public tools to execute the plan.
        </p>
      </>
    ),
  },
  {
    number: 6,
    title: 'Stream',
    subtitle: 'An inspectable response',
    body: (
      <>
        <p>
          Text chunks, tool starts, tool inputs, completion summaries, and the final answer are streamed as
          server-sent events to the chat interface. The client can show what the system tried while the answer is
          being produced.
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
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
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
        Introducing PolicyEngine&apos;s newest AI-powered tool to help users understand UK tax and benefit policy
      </p>
    </FadeIn>
  );
}

function Introduction() {
  return (
    <FadeIn>
      <p>
        People are increasingly turning to AI language models to answer complex questions about tax and benefit
        policy and reform, since models can read loosely worded questions and answer them in plain language. This
        presents a problem: for many users, tax and benefit questions directly impact their lives and livelihoods,
        and they require correct, verified answers. However, language models produce outputs from their learned
        training data, producing results that may be partially or completely incorrect.
      </p>
      <p>
        So, PolicyEngine built its newest tool, UK Chat, an AI chat interface that offers users the best of
        conversational AI, undergirded by PolicyEngine&apos;s own deterministic rules and simulation engine. UK Chat
        takes a user&apos;s conversational input, uses a series of probabilistic checks to determine what the user is
        asking for, then computes quantitative policy results from actual tax and benefit rules.
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
        <a href="https://en.wikipedia.org/wiki/Large_language_model#:~:text=Autoregressive%20models,how%20a%20sequence%20continues">
          predicting continuations
        </a>
        , not by applying tax and benefit rules. Ask one what Universal Credit (UC) a lone parent receives and it
        may return a number without factoring in the UC&apos;s income-based taper rate, its work allowance, or its
        differing benefit rates based on life situation.
      </p>
      <p>
        Prompting does not change this. For example, instructing a model to state only “real” figures does not
        correct its understanding of tax and benefit rules, it changes the wording around the same predicted
        textual outputs. Further, the AI model&apos;s output reads identically whether its output is right or wrong,
        so it is impossible to verify whether an answer is correct by reading it. In fact, a figure that is wrong,
        but reads as a correct answer, can be{' '}
        <a href="https://post.parliament.uk/research-briefings/post-pn-0708/#:~:text=Some%20stakeholders%20have%20indicated,challenge%20AI%20decision-making">
          harder to catch than no figure at all
        </a>
        .
      </p>
      <p>
        <a href="https://www.nao.org.uk/reports/use-of-artificial-intelligence-in-government/#:~:text=Our%20survey%20of%20government%20bodies%20found,piloting%20and%20planning%20AI%20use%20cases">
          This matters when results power decisions
        </a>
        . Anyone comparing two reforms needs figures that come from a fixed model, not from an AI&apos;s recollection
        of figures it has seen. The same applies to a household trying to work out how a tax reform affects its own
        income: the figure has to come from clear, delineated rules, with assumptions written down, so that it can
        be verified.
      </p>
    </FadeIn>
  );
}

function ToolExplorer() {
  const [activeFamily, setActiveFamily] = useState(toolFamilies[0]);
  const [activeTool, setActiveTool] = useState(toolFamilies[0].tools[0]);

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
        First, the AI language model still does the predictive work it excels at. It takes the user&apos;s open-ended
        natural-language prompt and develops a simulation/analysis plan. This plan has a required format and is
        required to use one or more deterministic tools (more on those later) that are directly connected to the
        PolicyEngine UK tax and benefit simulation engine.
      </p>
      <p>
        Next, UK Chat&apos;s gateway verifies, and sometimes constrains, that plan to ensure that PolicyEngine provides
        the tooling required to answer the user&apos;s question(s). The gateway may also ask a user for clarification,
        before finalizing a plan.
      </p>

      <h2>Tools make that plan deterministic</h2>
      <p>
        At this point, UK Chat has a gateway-verified plan. This plan relies on one or more deterministic tools that
        UK Chat exposes to ensure that every figure displayed to a user is rooted in verifiable facts as opposed
        to AI large-language predictions.
      </p>
      <p>
        UK Chat&apos;s AI model-facing tools are narrow by design. The tools fall into one of five types, each used to
        constrain the AI model and ensure correct outputs while creating, verifying, or executing a plan. Explore
        these categories in the interactive below.
      </p>

      <div className="iteration-container">
        <p className="iteration-hint">Select a family to inspect its tools</p>
        <div className="iteration-cards tool-cards">
          {toolFamilies.map((family) => (
            <button
              className={`iteration-card ${activeFamily.name === family.name ? 'active' : ''}`}
              key={family.name}
              type="button"
              onClick={() => selectFamily(family)}
            >
              <span className="iteration-title">{family.name}</span>
              <span className="iteration-subtitle">{family.summary}</span>
            </button>
          ))}
        </div>
        <div className="iteration-panel" aria-live="polite">
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
                onClick={() => setActiveTool(tool)}
              >
                <code>{tool.name}</code>
              </button>
            ))}
          </div>
          <div className="tool-summary" aria-live="polite">
            <div className="tool-summary-name">{activeTool.name}</div>
            <p>{activeTool.summary}</p>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

function RequestFlowDiagram({ activeStep }) {
  const labels = ['Plan', 'Catalogue', 'Gate', 'Reform', 'Tools', 'Client'];

  return (
    <svg
      className="flow-diagram-svg request-flow-svg"
      viewBox="0 0 480 590"
      role="img"
      aria-label="PolicyEngine UK Chat request lifecycle from opening plan through verification, tools, and client"
    >
      <defs>
        <marker id="request-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#0d7377" />
        </marker>
      </defs>
      {labels.map((label, index) => {
        const y = 18 + index * 92;
        const active = activeStep === index;
        return (
          <g key={label}>
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
              fontSize="13"
              fontWeight="700"
              fill={active ? '#0d7377' : '#ffffff'}
            >
              {index + 1}
            </text>
            <text
              x="124"
              y={y + 35}
              fontFamily="JetBrains Mono, monospace"
              fontSize="15"
              fontWeight="600"
              fill={active ? '#ffffff' : '#1e3a3a'}
            >
              {label}
            </text>
          </g>
        );
      })}

      <path
        d="M338 231 C350 231 352 231 362 231"
        fill="none"
        stroke="#0d7377"
        strokeWidth="2"
        markerEnd="url(#request-arrow)"
      />
      <rect x="368" y="205" width="104" height="52" rx="9" fill="#e7f5f4" stroke="#0d7377" />
      <text x="420" y="226" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#0d7377">
        no-tool paths
      </text>
      <text x="420" y="244" textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontSize="10" fill="#4a6363">
        clarify · partial
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
        x="429"
        y="396"
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize="10"
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          setActiveStep(Number(visible.target.dataset.step));
        }
      },
      { rootMargin: '-20% 0px -45% 0px', threshold: [0.15, 0.4, 0.7] },
    );

    stepRefs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <FadeIn>
      <h2>Under the hood</h2>
      <p>
        Let&apos;s delve further into the UK Chat user pathway. UK Chat&apos;s core runtime is a FastAPI
        server-sent-events handler that calls the Anthropic SDK directly. There is no generic agent framework in
        the request path. The chat owns both the opening gateway and the tool loop, so the rules that matter can
        be enforced at the point where each decision is made.
      </p>
      <div className="scrollytelling-container">
        <div className="scrolly-narrative">
          {requestSteps.map((step, index) => (
            <section
              className={`narrative-step ${activeStep === index ? 'active' : ''}`}
              data-step={index}
              key={step.number}
              ref={(node) => {
                stepRefs.current[index] = node;
              }}
            >
              <div className="step-header">
                <span className="step-number">{step.number}</span>
                <span className="step-title">{step.title}</span>
                <span className="step-subtitle">{step.subtitle}</span>
              </div>
              <div className="step-content">{step.body}</div>
            </section>
          ))}
        </div>
        <aside className="scrolly-sticky">
          <div className="example-panel diagram-only">
            <div className="example-header">
              <span className="example-title">One request</span>
              <span className="example-badge">Step {activeStep + 1} of {requestSteps.length}</span>
            </div>
            <div className="example-body">
              <div className="diagram-title">Verified, tool-backed answer</div>
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
      agents: ['exact wording', 'budgetary impact'],
      description: 'Identify the requested policy change, year, and output without turning assumptions into facts.',
    },
    {
      number: 2,
      title: 'Verify',
      agents: ['catalogue search', 'reform validation'],
      description: 'Bind “eldest-child rate” to a current reform target and validate the exact reform construction.',
    },
    {
      number: 3,
      title: 'Calculate',
      agents: ['run_society_simulation', 'compute_budgetary_impact'],
      description: 'Run the approved reform once, then pass its result handle to the requested derivative.',
    },
    {
      number: 4,
      title: 'Report',
      agents: ['Enhanced FRS 2024–25', 'current law'],
      description: 'Explain the computed change with the year, comparator, population, dataset, and method attached.',
    },
  ];

  return (
    <FadeIn>
      <h2>One reform, end to end</h2>
      <p>
        Consider: “Set the Child Benefit eldest-child rate to £30 a week and show the annual budgetary impact.”
        The request contains a policy, a final value, and an output. It does not contain a PolicyEngine parameter
        path, a reform object, or the sequence of tools needed to answer it.
      </p>
      <div className="workflow-timeline">
        <div className="workflow-header">
          <div className="workflow-command-label">User request</div>
          <div className="workflow-command">Set the eldest-child rate to £30 a week</div>
        </div>
        <div className="timeline-phases">
          {phases.map((phase) => (
            <article className="timeline-phase" key={phase.number}>
              <div className="timeline-phase-header">
                <div className="timeline-phase-num">{phase.number}</div>
                <div className="timeline-phase-title">{phase.title}</div>
              </div>
              <div className="timeline-phase-card">
                <div className="timeline-agents">
                  {phase.agents.map((agent) => (
                    <span className="timeline-agent" key={agent}>{agent}</span>
                  ))}
                </div>
                <p className="timeline-phase-desc">{phase.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
      <p>
        If the catalogue returned more than one materially plausible interpretation, or the reform resolver could
        not determine what year or reform the user was requesting, the calculation would pause after
        verification and ask the user to confirm the intended construction.
      </p>
    </FadeIn>
  );
}

function Limitations() {
  return (
    <FadeIn>
      <h2>Limitations</h2>
      <p>
        The chat is a <strong>modelling tool, not advice</strong>. It reports what the model calculates under stated
        assumptions, and it is not a substitute for professional guidance on an individual&apos;s circumstances.
      </p>
      <p>
        Society results are direct static microsimulation estimates. They do not estimate behavioural responses,
        employment effects, inflation, GDP, market reactions, or general-equilibrium effects. When a request
        mixes a supported policy result with one of those effects, the gateway notifies the user that it cannot
        calculate these effects, then proceeds with what it can.
      </p>
      <p>
        Results depend on the dataset, year, and modelling assumptions, and the chat states these dependencies
        rather than presenting figures as universal. Its answers can be cited and reproduced because the figures
        come from the same open engine that powers the rest of PolicyEngine, and they can be checked against
        independent estimates such as those from the IFS, Resolution Foundation, or OBR.
      </p>
    </FadeIn>
  );
}

function TryIt() {
  return (
    <FadeIn>
      <h2>Try it yourself</h2>
      <p>
        We want to widen the range of reforms the typed tools cover, so fewer questions fall back to reviewed
        Python, and to make that fallback quicker to run and inspect. PolicyEngine UK Chat works alongside our
        wider use of Claude and our plugin ecosystem, which bring the same engine to researchers building their
        own analyses.
      </p>
      <p>
        Try it with a reform you care about, and check the figures against the open-source engine that produced
        them.
      </p>
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
          <ToolExplorer />
          <ArchitectureScrolly />
          <WorkedExample />
          <Limitations />
          <TryIt />
          <AuthorSection />
          <p className="footer">
            PolicyEngine builds free, open-source tools to help people understand public policy.
          </p>
        </article>
      </main>
    </>
  );
}
