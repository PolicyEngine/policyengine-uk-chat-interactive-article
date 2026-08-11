import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const tools = [
  {
    name: 'calculate_household',
    group: 'Calculate',
    summary: 'Calculate taxes, benefits, and net income for one synthetic household.',
    output: 'Household-level results with the assumptions and year made explicit.',
  },
  {
    name: 'run_economy_simulation',
    group: 'Calculate',
    summary: 'Run a parametric reform across the modelled UK population.',
    output: 'Budget, decile, gain-and-loss, and poverty results.',
  },
  {
    name: 'analyse_microdata',
    group: 'Calculate',
    summary: 'Answer aggregate population questions from the modelled microdata.',
    output: 'Computed aggregates rather than figures recalled by the language model.',
  },
  {
    name: 'generate_chart',
    group: 'Support',
    summary: 'Turn a tool result into a chart using deterministic chart construction.',
    output: 'A displayed artefact based on the calculation result.',
  },
  {
    name: 'run_python',
    group: 'Support',
    summary: 'Handle questions outside the typed tools in a sandboxed Python environment.',
    output: 'Reviewed calculations that still use the same open engine.',
  },
  {
    name: 'validate_reform',
    group: 'Support',
    summary: 'Check a reform definition before it is used in a calculation.',
    output: 'Validation errors or a reform that is safe to pass to the engine.',
  },
];

const requestSteps = [
  {
    number: 1,
    title: 'Validate',
    subtitle: 'Request and balance',
    body: (
      <>
        <p>
          The runtime first validates the request and checks the account&apos;s balance. These checks happen in
          code before a model is asked to interpret anything.
        </p>
        <div className="insight-box">
          <div className="insight-label">Code-owned boundary</div>
          <p>Request validation and billing are deterministic parts of the application.</p>
        </div>
      </>
    ),
  },
  {
    number: 2,
    title: 'Ground',
    subtitle: 'System blocks and engine reference',
    body: (
      <>
        <p>
          The server assembles the system prompt and an engine reference generated from the installed
          PolicyEngine UK package. Both blocks are marked for prompt caching.
        </p>
        <p>
          The reference contains reported capabilities, public API signatures and docstrings, and the full
          parameter schema. It reflects the engine installed at deploy time rather than a hand-maintained
          description that can drift.
        </p>
      </>
    ),
  },
  {
    number: 3,
    title: 'Select',
    subtitle: 'Model by request size',
    body: (
      <>
        <p>
          The server opens a streaming Anthropic request. It defaults to Claude Haiku and escalates to Claude
          Sonnet when the estimated input-token count of the messages, system prompt, and engine reference
          passes a fixed threshold.
        </p>
        <p>The model interprets the question and chooses a tool; it does not produce the calculation itself.</p>
      </>
    ),
  },
  {
    number: 4,
    title: 'Calculate',
    subtitle: 'Bounded tool-use loop',
    body: (
      <>
        <p>
          As content streams back, the chat watches for tool-use blocks. It resolves each name against a
          dispatch table, runs independent tools concurrently, and appends each result to the conversation
          before asking the model to continue.
        </p>
        <div className="wins-shortcomings">
          <div className="wins">
            <div className="wins-title">Controls</div>
            <ul>
              <li>Maximum 30 tool rounds</li>
              <li>Stop after three identical calls</li>
              <li>Return tool errors to the model</li>
            </ul>
          </div>
          <div className="shortcomings neutral-panel">
            <div className="shortcomings-title">Fallback</div>
            <ul>
              <li>Report attempted tools</li>
              <li>Name the final error</li>
              <li>Always send a clean terminal event</li>
            </ul>
          </div>
        </div>
      </>
    ),
  },
  {
    number: 5,
    title: 'Stream',
    subtitle: 'Events to the client',
    body: (
      <>
        <p>
          The server streams chunks, tool events, and the final result to the client throughout the loop. The
          user can see what the system tried rather than waiting for an opaque, single response.
        </p>
        <p>
          Plan mode follows the same boundary. The runtime leaves tools out of the request entirely, so a model
          cannot call a tool it was never offered.
        </p>
      </>
    ),
  },
];

const principles = [
  {
    title: 'Compute, do not recall',
    description: 'Every figure comes from a tool that runs code against the PolicyEngine UK model.',
  },
  {
    title: 'Code owns displayed results',
    description: 'Validation, dispatch, calculations, chart construction, billing, and database writes stay in code.',
  },
  {
    title: 'Bound the model',
    description: 'Iteration caps, repeated-call detection, and deterministic error handling keep the loop finite.',
  },
  {
    title: 'Generate the reference',
    description: 'The model learns the installed engine surface from a deploy-time snapshot, not stale prose.',
  },
  {
    title: 'State the limits',
    description: 'The chat names assumptions and gaps instead of presenting every answer as universal or complete.',
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
      <h1>AI chatbot for policymaking</h1>
      <p className="subtitle">
        How PolicyEngine UK Chat answers tax and benefit questions by running the microsimulation engine for
        every figure
      </p>
    </FadeIn>
  );
}

function Introduction() {
  return (
    <FadeIn>
      <p>
        Most AI chatbots answer a tax-or-benefit question by guessing the number from memory.{' '}
        <a href="https://policyengine.org/uk">PolicyEngine UK Chat</a> instead{' '}
        <strong>computes every number from the actual rules</strong>, by running our microsimulation engine. When
        a question needs a figure, the chat calls a tool that runs the calculation rather than letting the model
        supply it.
      </p>
      <p>
        Language models are increasingly used to ask how a tax or benefit change would work, because a model can
        read a loosely worded question and answer it in plain language. The difficulty is that a language model{' '}
        <a href="https://www.gov.uk/government/publications/ai-playbook-for-the-uk-government/artificial-intelligence-playbook-for-the-uk-government-html#:~:text=large%20language%20models%20%28LLMs%29,may%20actually%20be%20factually%20incorrect">
          produces its numbers from memory
        </a>
        , and in policy work the figure is usually what matters. PolicyEngine UK Chat is an AI chat interface to
        PolicyEngine UK that answers UK tax-and-benefit questions in a conversation and runs the engine for every
        calculation.
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
        , <strong>not by applying tax and benefit rules</strong>. Ask one what Universal Credit a lone parent
        receives and it returns a number without running the taper, the work allowance, or the benefit rates.
      </p>
      <p>
        Prompting does not change this. Instructing a model to state only real figures does not give it the rules;
        it changes the wording around the same guess. A model can recite the correct taper rate and still get the
        arithmetic wrong, and the output reads identically whether the figure is right or wrong, so{' '}
        <strong>you cannot tell from the answer which it is</strong>. A figure that is wrong but reads as an answer
        can be{' '}
        <a href="https://post.parliament.uk/research-briefings/post-pn-0708/#:~:text=Some%20stakeholders%20have%20indicated,challenge%20AI%20decision-making">
          harder to catch than no figure at all
        </a>
        .
      </p>
      <p>
        <a href="https://www.nao.org.uk/reports/use-of-artificial-intelligence-in-government/#:~:text=Our%20survey%20of%20government%20bodies%20found,piloting%20and%20planning%20AI%20use%20cases">
          This matters when results feed decisions
        </a>
        . Anyone comparing two reforms needs figures that come from a stated model, not from a model&apos;s
        recollection of figures it has seen. The same applies to a household trying to work out how a threshold
        change affects its own income: the figure has to come from the rules, with the assumptions written down,
        so it can be reproduced.
      </p>
    </FadeIn>
  );
}

function ToolExplorer() {
  const [activeTool, setActiveTool] = useState(tools[0]);

  return (
    <FadeIn>
      <h2>The model plans, the tools calculate</h2>
      <p>
        AI tools like Claude or ChatGPT read the question, work out what is being asked, and select a tool. The
        system prompt requires every number to come from a tool result, and{' '}
        <strong>the tools, not the model, perform the calculation</strong>. Most numbers come from typed
        calculation tools that call the{' '}
        <a href="https://github.com/PolicyEngine/policyengine-uk">PolicyEngine UK microsimulation engine</a>;
        some come from sandboxed Python over the same engine when a question falls outside those tools.
      </p>
      <p>
        This split is the central design principle: <strong>anything that affects a number or an artefact is
        handled by code, so it can be audited rather than trusted</strong>, while the open-ended work—reading the
        question, planning, choosing a tool, and writing the answer—is left to the model.
      </p>
      <p>
        The engine applies the rules, and <strong>it is open source, so anyone can check how a number is produced</strong>.
        The same rules sit behind our web app and Python package, which keeps the chat&apos;s answers consistent with
        the rest of PolicyEngine.
      </p>

      <h2>The tools</h2>
      <p>
        The six tools divide into three that run calculations on the engine and three that support them.{' '}
        <strong>Every figure they return comes from a computation, not from the model.</strong>
      </p>

      <div className="iteration-container">
        <p className="iteration-hint">Select a tool to inspect its role</p>
        <div className="iteration-cards tool-cards">
          {tools.map((tool) => (
            <button
              className={`iteration-card ${activeTool.name === tool.name ? 'active' : ''}`}
              key={tool.name}
              type="button"
              onClick={() => setActiveTool(tool)}
            >
              <span className="tool-group">{tool.group}</span>
              <span className="iteration-title">{tool.name}</span>
              <span className="iteration-subtitle">{tool.summary}</span>
            </button>
          ))}
        </div>
        <div className="iteration-panel" aria-live="polite">
          <div className="example-file-header">{activeTool.name}</div>
          <p>{activeTool.summary}</p>
          <div className="example-output">
            <div className="example-output-line success">
              <span className="icon">→</span>
              <span>{activeTool.output}</span>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

function RequestFlowDiagram({ activeStep }) {
  const labels = ['Request', 'Ground', 'Select', 'Calculate', 'Client'];

  return (
    <svg
      className="flow-diagram-svg request-flow-svg"
      viewBox="0 0 420 510"
      role="img"
      aria-label="PolicyEngine UK Chat request lifecycle"
    >
      <defs>
        <marker id="request-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#0d7377" />
        </marker>
      </defs>
      {labels.map((label, index) => {
        const y = 25 + index * 94;
        const active = activeStep === index;
        return (
          <g key={label}>
            {index > 0 && (
              <line
                x1="210"
                y1={y - 33}
                x2="210"
                y2={y - 8}
                stroke="#0d7377"
                strokeWidth="2"
                markerEnd="url(#request-arrow)"
              />
            )}
            <rect
              x="72"
              y={y}
              width="276"
              height="62"
              rx="10"
              fill={active ? '#0d7377' : '#ffffff'}
              stroke="#0d7377"
              strokeWidth={active ? 3 : 2}
            />
            <circle cx="104" cy={y + 31} r="16" fill={active ? '#ffffff' : '#0d7377'} />
            <text
              x="104"
              y={y + 36}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="13"
              fontWeight="700"
              fill={active ? '#0d7377' : '#ffffff'}
            >
              {index + 1}
            </text>
            <text
              x="138"
              y={y + 37}
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
        d="M348 338 C398 338 398 181 348 181"
        fill="none"
        stroke="#0d7377"
        strokeWidth="2"
        strokeDasharray="7 5"
        markerEnd="url(#request-arrow)"
      />
      <text
        x="386"
        y="264"
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize="10"
        fill="#4a6363"
        transform="rotate(90 386 264)"
      >
        tool results return to model
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
        The runtime is a FastAPI server-sent-events handler that calls the Anthropic SDK directly. There is no
        agent framework in the request path: the chat owns its tool loop, because the rules that matter are
        enforced inside that loop rather than around it.
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
              <span className="example-badge">Step {activeStep + 1} of 5</span>
            </div>
            <div className="example-body">
              <div className="diagram-title">Tool-backed answer</div>
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

function Principles() {
  return (
    <FadeIn>
      <h2>The model–code boundary</h2>
      <p>
        The boundary between the model and the code is written down and treated as a contract. The model handles
        the open-ended parts: interpreting the question, planning, selecting tools, writing prose, and suggesting
        follow-ups. The code handles everything that affects a number or a displayed result.
      </p>
      <div className="principles-grid">
        {principles.slice(0, 3).map((principle, index) => (
          <motion.article
            className="principle-card"
            key={principle.title}
            whileHover={{ y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <div className="principle-icon" aria-hidden="true">{index + 1}</div>
            <div className="principle-title">{principle.title}</div>
            <p className="principle-desc">{principle.description}</p>
          </motion.article>
        ))}
      </div>
      <div className="principles-bottom">
        {principles.slice(3).map((principle, index) => (
          <motion.article
            className="principle-card"
            key={principle.title}
            whileHover={{ y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <div className="principle-icon" aria-hidden="true">{index + 4}</div>
            <div className="principle-title">{principle.title}</div>
            <p className="principle-desc">{principle.description}</p>
          </motion.article>
        ))}
      </div>
      <p>
        Some of these choices could be left to the model and deliberately are not. If the model chose which rows
        of a large table to show, that choice would be a sampling decision the reader cannot inspect. A
        deterministic helper makes it instead.
      </p>
    </FadeIn>
  );
}

function ArchitectureToday() {
  const phases = [
    { number: 1, title: 'Request', agents: ['validation', 'billing'], description: 'Check the request before model work begins.' },
    { number: 2, title: 'Context', agents: ['system prompt', 'engine reference'], description: 'Ground the model in the installed engine.' },
    { number: 3, title: 'Tool loop', agents: ['dispatch', 'calculation', 'recovery'], description: 'Run deterministic tools until the answer is complete.' },
    { number: 4, title: 'Response', agents: ['SSE events', 'prose', 'follow-ups'], description: 'Stream an inspectable result to the client.' },
  ];

  return (
    <FadeIn>
      <h2>The architecture today</h2>
      <p>
        The tools are defined in one place, with shared schema fragments—the year, reform-property, dataset,
        filter, and chart schemas—reused across them. A definition such as a reform property therefore lives in a
        single location.
      </p>
      <div className="workflow-timeline">
        <div className="workflow-header">
          <div className="workflow-command-label">Question enters</div>
          <div className="workflow-command">PolicyEngine UK Chat</div>
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
        Plan mode uses the same logic. Telling a model not to call tools is a request it can ignore, so in plan
        mode the list of tools is left out of the request entirely: <strong>a model cannot call a tool it was never
        offered</strong>.
      </p>
    </FadeIn>
  );
}

function Guardrails() {
  return (
    <FadeIn>
      <h2>Built-in constraints</h2>
      <div className="results-section">
        <div className="results-stats">
          <div className="stat-card">
            <div className="stat-number">6</div>
            <div className="stat-label">Typed tools</div>
            <div className="stat-detail">Three calculate and three support</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">30</div>
            <div className="stat-label">Maximum tool rounds</div>
            <div className="stat-detail">A hard cap keeps requests bounded</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">3×</div>
            <div className="stat-label">Repeated-call stop</div>
            <div className="stat-detail">Identical calls signal a stuck model</div>
          </div>
        </div>
        <div className="results-description">
          <p>
            The aim is that <strong>every path either produces a number you can check or says plainly that it
            cannot</strong>.
          </p>
        </div>
      </div>
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
        <code>run_economy_simulation</code> handles parametric reforms: changes to existing rates, thresholds, and
        parameters. Reforms that introduce new mechanisms fall back to <code>run_python</code>, which we review,
        or sit outside the standard tools. Only the major UK tax and benefit programmes are modelled, so questions
        about minor or unmodelled provisions may not be answerable.
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
      <div className="terminal-container">
        <div className="terminal-header">
          <span className="terminal-dot red" />
          <span className="terminal-dot yellow" />
          <span className="terminal-dot green" />
          <span className="terminal-title">PolicyEngine UK Chat</span>
        </div>
        <div className="terminal-body">
          <pre><code><span className="terminal-comment"># Ask a UK tax or benefit question</span>{'\n'}<span className="terminal-command">open https://policyengine.org/uk</span></code></pre>
        </div>
      </div>
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
      <div className="next-cards">
        <a className="next-card" href="https://policyengine.org/uk">
          <span className="next-card-badge">Available now</span>
          <div className="next-card-title">Open PolicyEngine UK Chat</div>
          <p className="next-card-desc">Ask a question and inspect the calculated answer.</p>
        </a>
        <a className="next-card" href="https://github.com/PolicyEngine/policyengine-uk">
          <span className="next-card-badge">Open source</span>
          <div className="next-card-title">Inspect the engine</div>
          <p className="next-card-desc">Review the tax and benefit rules behind the results.</p>
        </a>
      </div>
      <p className="footer">
        PolicyEngine builds free, open-source tools to help people understand public policy.
      </p>
    </FadeIn>
  );
}

export default function App() {
  return (
    <main className="scrolly-container">
      <article className="article-wrapper">
        <Hero />
        <Introduction />
        <Problem />
        <ToolExplorer />
        <ArchitectureScrolly />
        <Principles />
        <ArchitectureToday />
        <Guardrails />
        <Limitations />
        <TryIt />
      </article>
    </main>
  );
}
