/* =========================================================
   VELOX — Shared data (docs, blog, changelog, comparison)
   ========================================================= */
window.VELOX = window.VELOX || {};

VELOX.DOCS = {
  sections: [
    { id: 'getting-started', title: 'Getting Started', items: [
      { id: 'quick-start', title: 'Quick start' },
      { id: 'install', title: 'Install the CLI' },
      { id: 'first-project', title: 'Your first project' },
    ]},
    { id: 'core', title: 'Core Concepts', items: [
      { id: 'core-concepts', title: 'How Velox thinks' },
      { id: 'issues', title: 'Issues' },
      { id: 'releases', title: 'Releases' },
      { id: 'graph', title: 'The Graph' },
      { id: 'permissions', title: 'Permissions' },
    ]},
    { id: 'integrations', title: 'Integrations', items: [
      { id: 'github', title: 'GitHub' },
      { id: 'slack', title: 'Slack' },
      { id: 'figma', title: 'Figma' },
      { id: 'jira', title: 'Jira import' },
      { id: 'linear', title: 'Linear import' },
      { id: 'webhooks', title: 'Webhooks' },
    ]},
    { id: 'api', title: 'API Reference', items: [
      { id: 'api-reference', title: 'Overview' },
      { id: 'auth-api', title: 'Authentication' },
      { id: 'issues-api', title: 'Issues API' },
      { id: 'releases-api', title: 'Releases API' },
    ]},
    { id: 'guides', title: 'Guides', items: [
      { id: 'self-host', title: 'Self-hosting Velox' },
      { id: 'migrate', title: 'Migrate from Jira' },
      { id: 'sprints', title: 'Running sprints' },
      { id: 'security', title: 'Security best practices' },
    ]},
  ],
  articles: {
    'quick-start': {
      title: 'Quick start',
      meta: 'Updated May 12, 2026 · 5 minute read',
      body: `
        <p>Welcome to Velox. This guide will get you from zero to a working project in five minutes. We'll install the CLI, authenticate, and create your first issue from the terminal.</p>
        <h2>1. Install the CLI</h2>
        <p>The Velox CLI is a single binary. It's the fastest way to script your workflow and talk to the API. Install with your favorite package manager:</p>
        <div class="code-block">
<button class="copy-btn">Copy</button><span class="tk-com"># macOS &amp; Linux</span>
<span class="tk-kw">curl</span> -fsSL https://velox.dev/install.sh | sh

<span class="tk-com"># Or with Homebrew</span>
brew install velox-labs/tap/velox</div>
        <h2>2. Authenticate</h2>
        <p>Run <code>velox login</code>. The CLI opens a browser, you approve, and a token lands in <code>~/.velox/auth.json</code>. The token scopes to one workspace by default.</p>
        <div class="code-block">
<button class="copy-btn">Copy</button><span class="tk-kw">velox</span> login
<span class="tk-com"># → Opening browser to authenticate...</span>
<span class="tk-com"># → Logged in as sam@acme.com (workspace: acme)</span></div>
        <div class="callout callout-tip"><span class="ti">// Tip</span>Running in CI? Use <code>VELOX_TOKEN</code> instead. Generate a service token in Settings → Tokens.</div>
        <h2>3. Create your first issue</h2>
        <p>Once authenticated, you can pipe anything that looks like an issue into Velox:</p>
        <div class="code-block">
<button class="copy-btn">Copy</button><span class="tk-kw">velox</span> issue create \\
  --title <span class="tk-str">"Cache miss on /api/projects"</span> \\
  --tag perf \\
  --priority high \\
  --assignee me</div>
        <p>That's it. Your issue is on the board, the CLI prints the URL, and the team gets a Slack notification. From here, <a href="#" data-doc-link="core-concepts">read the Core Concepts</a> or wire up <a href="#" data-doc-link="github">your GitHub repo</a>.</p>
        <div class="callout callout-warn"><span class="ti">// Heads up</span>Workspace names are global. Pick something you'd put on a business card.</div>
      `
    },
    'core-concepts': {
      title: 'How Velox thinks',
      meta: 'Updated April 28, 2026 · 8 minute read',
      body: `
        <p>Velox is built around one idea: <strong>everything is a node in the same graph</strong>. Issues, PRs, docs, releases, customers, even people — they're all just typed nodes with edges between them.</p>
        <p>This means you can ask Velox questions other tools can't answer: "which customers asked for this thing we just shipped?" or "what released last week that touched <code>billing/</code>?" or "who's blocked on something I own?"</p>
        <h2>Nodes</h2>
        <ul>
          <li><strong>Issue</strong> — the unit of work. Has a state, a tag, an assignee, and a graph of dependencies.</li>
          <li><strong>Release</strong> — a versioned set of issues. Creates a changelog entry automatically.</li>
          <li><strong>Doc</strong> — a markdown page. Backlinks to anything that references it.</li>
          <li><strong>Customer</strong> — links feedback to the people who asked for it.</li>
          <li><strong>Person</strong> — a team member. Has expertise, load, and a calendar.</li>
        </ul>
        <h2>Edges</h2>
        <p>Edges describe relationships: <em>blocks</em>, <em>relates to</em>, <em>references</em>, <em>requested by</em>. They're directional. The graph is searchable, query-able, and observable in the sidebar of every node.</p>
        <div class="callout callout-info"><span class="ti">// Background</span>If you've used a graph database like Neo4j, you'll feel at home. We don't expose Cypher (yet) but every node has a stable ID you can join on via the API.</div>
        <h2>Views</h2>
        <p>The Kanban board, the Roadmap, the changelog — none of these are separate data structures. They're just <em>views</em> over the same graph. Sort by priority, filter by team, group by release: every view is a saved query.</p>
        <blockquote>The board you see is a query result, not a thing.</blockquote>
        <p>This is why moving a milestone updates everything downstream instantly — there's nothing to sync, because there's only one source of truth.</p>
      `
    },
    'api-reference': {
      title: 'API reference',
      meta: 'Updated May 5, 2026 · v2 stable',
      body: `
        <p>The Velox REST API is the same API the product uses. If you can do it in the UI, you can do it from the API. Base URL: <code>https://api.velox.dev/v2</code>.</p>
        <p>Authentication is via Bearer token. Pass it in the <code>Authorization</code> header. Tokens scope to a single workspace.</p>
        <div class="code-block">
<button class="copy-btn">Copy</button><span class="tk-kw">curl</span> -H <span class="tk-str">"Authorization: Bearer $VELOX_TOKEN"</span> \\
  https://api.velox.dev/v2/issues</div>
        <h2>Issues</h2>
        <table class="api-table">
          <thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead>
          <tbody>
            <tr><td><span class="method-badge method-GET">GET</span></td><td><code>/issues</code></td><td>List issues in the workspace</td></tr>
            <tr><td><span class="method-badge method-GET">GET</span></td><td><code>/issues/:id</code></td><td>Get a single issue by ID</td></tr>
            <tr><td><span class="method-badge method-POST">POST</span></td><td><code>/issues</code></td><td>Create a new issue</td></tr>
            <tr><td><span class="method-badge method-PATCH">PATCH</span></td><td><code>/issues/:id</code></td><td>Update an issue (state, tag, assignee)</td></tr>
            <tr><td><span class="method-badge method-DELETE">DELETE</span></td><td><code>/issues/:id</code></td><td>Archive an issue (soft delete)</td></tr>
            <tr><td><span class="method-badge method-POST">POST</span></td><td><code>/issues/:id/comments</code></td><td>Add a comment</td></tr>
          </tbody>
        </table>
        <h2>Releases</h2>
        <table class="api-table">
          <thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead>
          <tbody>
            <tr><td><span class="method-badge method-GET">GET</span></td><td><code>/releases</code></td><td>List recent releases</td></tr>
            <tr><td><span class="method-badge method-POST">POST</span></td><td><code>/releases</code></td><td>Cut a new release (generates a changelog)</td></tr>
            <tr><td><span class="method-badge method-GET">GET</span></td><td><code>/releases/:id/changelog</code></td><td>Get the rendered changelog for a release</td></tr>
          </tbody>
        </table>
        <div class="callout callout-tip"><span class="ti">// Rate limits</span>1,000 requests/min for Pro, 10,000 requests/min for Enterprise. We return <code>X-RateLimit-Remaining</code> on every response.</div>
      `
    }
  }
};

VELOX.BLOG = [
  { id: 'ai-workflows', cat: 'engineering', cover: 'bg1', glyph: 'AI/01', large: true, title: 'How we built AI-powered workflows that don\u2019t get in the way', excerpt: 'Most AI features in PM tools fall into the same trap. Here\u2019s the bet we made instead.', author: 'Sam Chen', role: 'Staff Engineer', date: 'May 12, 2026', read: '7 min' },
  { id: 'graph-rewrite', cat: 'engineering', cover: 'bg2', glyph: 'ENG', large: true, title: 'Rewriting the graph layer in a weekend (and what broke)', excerpt: 'We took a swing at our biggest perf bottleneck. Here\u2019s the post-mortem.', author: 'Priya Raman', role: 'VP Engineering', date: 'May 3, 2026', read: '11 min' },
  { id: 'design-system', cat: 'design', cover: 'bg5', glyph: 'DSN', title: 'Why we stopped using component libraries', excerpt: 'The hidden cost of someone else\u2019s primitives.', author: 'Alex Park', role: 'Design', date: 'Apr 24, 2026', read: '6 min' },
  { id: 'series-a', cat: 'company', cover: 'bg4', glyph: '$A', title: 'We raised a Series A', excerpt: 'Why now, who from, and what we\u2019re doing with it.', author: 'Maya Patel', role: 'CEO', date: 'Apr 12, 2026', read: '4 min' },
  { id: 'roadmap-public', cat: 'product', cover: 'bg3', glyph: 'PRD', title: 'Our roadmap is now public', excerpt: 'You can see what we\u2019re building, when, and why \u2014 in real time.', author: 'Maya Patel', role: 'CEO', date: 'Mar 28, 2026', read: '3 min' },
  { id: 'principles', cat: 'company', cover: 'bg6', glyph: 'CO', title: 'The principles we hire against', excerpt: 'No values posters. Just six lines we re-read every quarter.', author: 'Priya Raman', role: 'VP Engineering', date: 'Mar 14, 2026', read: '5 min' },
];

VELOX.CHANGELOG = [
  { v: 'v2.6.0', date: 'May 21, 2026', title: 'AI standups & smarter assignment', tags: ['new', 'imp'], items: [
    'AI standup digests — daily summary of what each engineer shipped, generated from PR + commit data',
    'Auto-assignment now considers domain expertise and current load',
    'Faster board sync: 40ms median (down from 180ms)',
    'New Slack thread → Velox discussion automation'
  ]},
  { v: 'v2.5.3', date: 'May 7, 2026', title: 'Stability & polish', tags: ['fix', 'imp'], items: [
    'Fixed race condition in board sync that occasionally lost drag operations',
    'Search now respects custom filters when scoped',
    'Reduced bundle size by 18% on the dashboard view',
    'Better keyboard nav on the roadmap view'
  ]},
  { v: 'v2.5.0', date: 'Apr 24, 2026', title: 'Public roadmap & embeds', tags: ['new'], items: [
    'Public roadmap pages — share your plan with customers without exposing internals',
    'Embeddable issue widgets for your status page or blog',
    'Filtered RSS feeds for any saved query'
  ]},
  { v: 'v2.4.2', date: 'Apr 10, 2026', title: 'Linear & Jira importers', tags: ['new', 'imp'], items: [
    'One-click Linear import (issues, comments, attachments)',
    'Jira importer now handles custom fields and workflows',
    'Improved CSV exporter (matches importer schema)'
  ]},
  { v: 'v2.4.0', date: 'Mar 27, 2026', title: 'Real-time multiplayer', tags: ['new'], items: [
    'Live cursors on every view — see who\u2019s looking at what',
    'Real-time typing indicators in comments and docs',
    'Presence in Slack and VS Code extension'
  ]},
  { v: 'v2.3.0', date: 'Mar 6, 2026', title: 'API v2 (stable) + webhooks', tags: ['new', 'imp'], items: [
    'API v2 is now stable — pinned to <code>/v2/</code>',
    'New webhook events for releases and comments',
    'OAuth 2.0 PKCE flow for CLI and 3rd-party apps'
  ]},
];

VELOX.COMPARISON = [
  ['Open-source CLI',       'check', 'x', 'x', 'x'],
  ['Native GitHub two-way sync', 'check', 'limited', 'check', 'limited'],
  ['Realtime multiplayer',  'check', 'check', 'check', 'x'],
  ['AI auto-assignment',    'check', 'x', 'x', 'x'],
  ['Self-hostable',         'check', 'x', 'x', 'check'],
  ['Free read-only viewers','check', 'x', 'x', 'x'],
  ['Public REST + webhooks','check', 'check', 'check', 'check'],
  ['Public roadmap pages',  'check', 'limited', 'check', 'x'],
  ['Built-in changelog',    'check', 'x', 'x', 'x'],
  ['Customer feedback graph','check', 'x', 'x', 'x'],
  ['SOC 2 type II',         'check', 'check', 'check', 'check'],
  ['Per-seat under $50/mo', 'check', 'x', 'check', 'x'],
];

VELOX.FAQ = [
  { q: 'Is there a free plan?', a: 'Yes. The Starter plan is free forever for up to 5 members, with unlimited issues, docs, and a public API. No credit card required — ever.' },
  { q: 'Can I change plans later?', a: 'Anytime, from Settings → Billing. We prorate to the day, so you only pay for what you used. Downgrading is just as easy — no sales call to cancel.' },
  { q: 'How does billing work?', a: 'Monthly or annual, per user. We only bill for active members; read-only viewers are free. Annual billing knocks 20% off. We support all major cards plus invoice/ACH on Enterprise.' },
  { q: 'Is my data safe?', a: 'SOC 2 Type II, GDPR, HIPAA-ready. All data encrypted at rest (AES-256) and in transit (TLS 1.3). Daily encrypted backups with point-in-time restore on Pro and above.' },
  { q: 'Can I self-host?', a: 'Yes — on Enterprise. We ship a Docker Compose bundle and a Kubernetes Helm chart. Your data stays inside your VPC; we never touch it. Full guide in the docs.' },
  { q: 'What\u2019s the team size limit?', a: 'No limit on Pro or Enterprise. Starter caps at 5 members. We\u2019ve got customers running 1,200+ engineers on a single workspace with sub-100ms response times.' },
  { q: 'Do you offer discounts for startups?', a: 'Yes — 50% off Pro for the first 12 months if your company is under 2 years old and under $5M raised. Apply through Talk to sales.' },
  { q: 'What happens when I cancel?', a: 'You stay on the paid plan until the end of the period, then drop to Starter automatically. Your data sticks around for 90 days in case you change your mind, then it\u2019s permanently deleted.' },
];

VELOX.AI_LINES = [
  'Promote VLX-217 to In Progress — Sam is finishing 3 related fixes this week.',
  'Move "Streaming server actions" up one sprint — there are 4 customer requests linked to it.',
  'Split VLX-221 into two issues — the perf and UX work have different reviewers.',
];

VELOX.TASKS = {
  backlog: [
    { id: 'VLX-301', title: 'Search results dropdown for the global bar', tag: 'feat', pri: 'med', assignee: 'a2', due: 'next sprint', subs: '0/3' },
    { id: 'VLX-302', title: 'Reduce p99 latency on /api/issues to under 80ms', tag: 'perf', pri: 'high', assignee: 'a3', due: 'in 5d', subs: '1/4' },
    { id: 'VLX-303', title: 'Improve docs for the webhook signing flow', tag: 'doc', pri: 'low', assignee: 'a1', due: '—', subs: '0/2' },
  ],
  inprogress: [
    { id: 'VLX-217', title: 'Race condition in board sync (P0)', tag: 'bug', pri: 'high', assignee: 'a4', due: 'today', subs: '2/3' },
    { id: 'VLX-218', title: 'Streaming server actions', tag: 'feat', pri: 'med', assignee: 'a2', due: 'in 3d', subs: '1/5' },
    { id: 'VLX-220', title: 'OAuth PKCE migration guide', tag: 'doc', pri: 'med', assignee: 'a1', due: 'in 2d', subs: '3/4' },
  ],
  review: [
    { id: 'VLX-214', title: 'Audit log retention policy', tag: 'feat', pri: 'low', assignee: 'a5', due: 'in 4d', subs: '5/5' },
    { id: 'VLX-215', title: 'Slack thread → discussion link', tag: 'feat', pri: 'med', assignee: 'a3', due: 'in 1d', subs: '2/2' },
  ],
  done: [
    { id: 'VLX-201', title: 'AI changelog generator', tag: 'feat', pri: 'med', assignee: 'a5', due: 'shipped', subs: '4/4' },
    { id: 'VLX-198', title: 'Re-index in &lt; 40ms', tag: 'perf', pri: 'high', assignee: 'a2', due: 'shipped', subs: '3/3' },
  ]
};

VELOX.TEAM = [
  { name: 'Sam Chen', role: 'Staff Eng', ava: 'a2', online: true },
  { name: 'Priya Raman', role: 'VP Eng', ava: 'a3', online: true },
  { name: 'Alex Park', role: 'Design', ava: 'a4', online: true },
  { name: 'Maya Patel', role: 'CEO', ava: 'a5', online: false },
  { name: 'Diego Santos', role: 'PM', ava: 'a1', online: true },
];

VELOX.AVA_GRADIENTS = {
  a1: 'radial-gradient(circle at 30% 30%, #FFD3A1, #C97A4E)',
  a2: 'radial-gradient(circle at 30% 30%, #C8B6FF, #6C63FF)',
  a3: 'radial-gradient(circle at 30% 30%, #A6F2E6, #00B89A)',
  a4: 'radial-gradient(circle at 30% 30%, #FFD0E0, #D85A8A)',
  a5: 'radial-gradient(circle at 30% 30%, #B6E1FF, #2A6FDB)',
};
