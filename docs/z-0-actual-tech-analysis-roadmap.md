## Phased Roadmap for Extensibility

To align the architecture with the goal of a plugin-enabled, extensible system, we outline a three-phase implementation plan:

### Phase 1: **Core Integration and Custom UI Setup**

**Objective:** Decouple the core engine from the existing UI and get a minimal application running with Actual’s back-end (Loot Core) but a new front-end or interface. This phase treats Actual’s engine as the foundation and proves we can drive it independently.

- **Integrate Actual Engine:** Utilize *loot-core* and the Official API in a standalone manner. For example, create a small Node.js or Electron app that calls `init()` on the Actual API and opens a budget. This will ensure we can start the database and core services without the desktop-client. Any hard dependencies of core on the old UI should be identified and removed (the docs suggest loot-core is already independent).
- **Replace UI:** Develop a basic UI (could be a simple web app or command-line interface initially) that uses the API to perform essential actions: list accounts, show transactions, edit budgets. At this step, we don’t replicate full functionality, just enough to confirm the engine works with our UI. For instance, a rudimentary web UI that shows the budget categories and lets you input a new transaction through a form.
- **Maintain Feature Parity (Minimal):** Ensure critical flows work: adding accounts, transactions, budgeting, and sync. We rely on Actual for the logic, so most of this is invoking API calls. If any required API is missing, implement it in core or adapt (e.g., if we need a combined “all accounts transactions” view and there isn’t a direct API, we can call getTransactions for each account and merge results for now).
- **Preserve Data Integrity:** In this phase, the focus is not on new features but not breaking existing ones. We should validate that using the engine without the old UI doesn’t cause issues. For example, verify that migrations run, that undo/redo works via API (maybe expose a button for undo in the test UI to confirm it).
- **No Plugins Yet:** During Phase 1, we are **not adding plugins**, but laying ground for them. However, we can already start designing how a plugin might attach. For instance, consider using the same API for our new UI that we plan to give to plugins. We might end up essentially writing a “plugin” which *is* our new UI in terms of how it interacts with core – this mindset can help ensure the API is general.
- **Outcome:** By end of Phase 1, we have Actual’s engine running with a custom interface (perhaps not fully featured, but sufficient), demonstrating that the core and UI are separated. We also produce documentation of the core API usage and perhaps improve the API if we found any gaps when building the UI.

### Phase 2: **Plugin SDK and Internal Module Refactoring**

**Objective:** Introduce a formal Plugin System and convert some parts of Actual into modules/plugins to test the concept. Provide tools for third-party developers to extend Actual in a controlled way.

- **Design Plugin API:** Define the surface area of what plugins can do. This involves creating a **Plugin SDK** documentation and implementing the scaffolding in code. Likely components:
  - A Plugin registration system (the app can load plugin bundles, register their hooks/UI contributions).
  - An event bus or observer in the core: e.g., core emits events like `onTransactionCreate` that plugins can subscribe to. Implement this if not already present.
  - Wrappers for core API: Provide plugin code with an `actual` object limited to allowed methods (e.g., `actual.createTransaction`, `actual.getCategories`, etc.). This may just forward to the real API, but can include permission checks.
- **Isolate Plugin Execution:** Implement a sandbox environment for plugin logic. For example, instantiate each plugin in a Web Worker or an iframe (in Electron, perhaps a hidden BrowserWindow or VM context). Ensure the plugin runs with *context isolation*, meaning it cannot directly call internal Electron or Node APIs unless we expose them. This step may be complex, but it’s critical for safety. We might use something like a **RPC bridge**: the plugin calls `postMessage` for an action, the main app verifies and executes it via core, then returns the result.
- **Extending UI for Plugins:** Create extension points in the new UI: 
  - Perhaps a section in the navigation for “Plugins” or dynamic insertion into existing sections (like new Report pages, new sidebar entries, or even extending transaction rows with extra info).
  - Use a dynamic component loader to mount plugin-provided UI elements. For example, if a plugin provides a React component as a bundle, the host app can render it inside a div in the designated area.
  - Standardize styling and ensure plugins can adopt the app’s CSS theme (maybe expose a CSS variables API or a UI components library for consistency).
- **Convert Internal Features to Plugins (Optional):** A great way to test the system is to take an existing feature and implement it as if it were a plugin:
  - For instance, Actual’s *bank sync* (if it had one), or the *sample data generator*, or even *reports*. We could try to re-package “Reports” as a plugin: the core already provides `runQuery` and data, the plugin could provide all the report UI and computations. If we succeed, that means our plugin API is capable enough. If we discover missing pieces (like needing some private function), we can adjust the API.
  - Another candidate is the *Importers*. The YNAB import or CSV import could be moved out of core and into a plugin that uses public APIs to insert data. This checks that the API can handle bulk operations efficiently.
- **Security Measures:** Implement permission prompts or config for plugins. Perhaps in this phase we start simple (all plugins run with full access but in sandbox) and plan to tighten in Phase 3. We should at least create the structures: e.g., update the plugin manifest format to include a list of permissions (like `{"permissions": ["net", "write"]}` etc.) in anticipation of enforcing them.
- **Developer Experience:** Provide tools for plugin developers: maybe a CLI to scaffold a new plugin project (generate manifest, sample code), and a way to reload plugins without restarting the entire app (for easier development). Also, write thorough documentation for the SDK with examples.
- **Testing:** Write tests for the plugin system. E.g., a test plugin that performs a known set of actions, to verify events and API calls work as expected. Also test sandbox escape attempts (ensuring a plugin can’t do what it shouldn’t). Possibly do a security audit of the sandbox approach.
- **Outcome:** By end of Phase 2, the Actual app supports loading external plugin modules. We should have at least one or two plugins functioning (one possibly developed in-house as a reference). The core and UI are now flexible, with hooks and extension points in place. We likely will release this as a beta feature for community to try writing plugins.

### Phase 3: **Extensible UX & Marketplace with Monetization**

**Objective:** Embrace full extensibility in the user experience and build an ecosystem around Actual. This involves making plugin management user-friendly and setting up a marketplace for discovery (and possibly sale) of plugins.

- **Polish Plugin UI/UX:** Create a *Plugin Manager* section in the Settings or main menu. Users should be able to see installed plugins, enable/disable them, configure them, and check for updates. Include details like plugin version, description, author, and permission usage (“This plugin can read transactions and access the internet.”).
- **Discovery of Plugins:** Integrate a **Plugin Marketplace** browser within the app. This could fetch a list of available plugins from a central repository (e.g., Actual’s website or a GitHub repository listing plugins). Users can browse or search for plugins by category (Import, Reports, Automation, etc.), and install them with one click. Under the hood, installation might download a plugin package (likely a secure, signed bundle) and place it into the app’s plugins directory.
- **Monetization Support:** If certain plugins are paid, implement a flow to purchase or unlock them. This could redirect to an external store or use an in-app purchase mechanism. A practical approach might be issuing license keys: the plugin can check a license key before activating full features. The marketplace UI can handle the purchase and provide the key to the plugin (maybe stored in the plugin’s config). This area can get complex (handling payments, subscriptions, revenue share), but since it’s beyond core technical architecture, the main point is ensuring the platform doesn’t hinder closed-source or paid plugins. Perhaps allow plugins to be distributed as simply as open ones (the difference being the code might be obfuscated and require a license to function).
- **Scaling and Quality:** With many plugins, ensure the app remains stable. Possibly implement **plugin sandbox resource limits** (so one plugin can’t consume all memory or CPU indefinitely – e.g., if it goes haywire, the host can terminate its worker). Also, consider an approval process for the official marketplace to maintain quality and security. Community ratings and comments can be shown in the UI to inform users.
- **Extensible UX Elements:** At this phase, we can add more advanced extension points if needed by popular demand. For example, allow plugins to define *new types of entities* in the UI or even new data in the core (with careful design). Or allow deep integrations like a plugin that replaces certain core behaviors (though that is tricky with consistency). Based on Phase 2 feedback, we might add more hooks.
- **Community & Monetization Balance:** Encourage a healthy mix of free and paid plugins. Perhaps some core features that were on Actual’s roadmap but not yet implemented could be done by third parties (with or without charge). The marketplace could incentivize developers to contribute and maybe earn for niche features (for instance, integration with a regional bank or a cryptocurrency wallet might be too niche for core but perfect as a paid plugin by a community dev).
- **Continuous Security Monitoring:** As plugins proliferate, set up a process for reporting malicious or problematic plugins. The app could have a kill-switch to disable known bad plugins (for example, if a plugin is found stealing data, the marketplace could flag it and the app could warn users who have it installed).
- **Outcome:** By the end of Phase 3, Actual Budget transforms into an **extensible platform**. Users can tailor their budgeting app with plugins – from cosmetic themes to full new modules – and developers have a marketplace to distribute and possibly sell their plugins. Actual’s core remains lean and focused, while the ecosystem handles diverse user needs. This should significantly increase Actual’s appeal (much like VSCode or Obsidian gained from plugins) and can create a community-driven innovation cycle. Importantly, all this is achieved without sacrificing the app’s performance, security, or privacy ethos.

---

**Tables & Diagrams (for summary):**

Below is a **summary table of Actual’s core components** and their roles, which also highlights where extension is possible:

| **Component**             | **Description**                                                  | **Extensibility**                    |
|---------------------------|------------------------------------------------------------------|--------------------------------------|
| **Loot Core (Engine)**    | Core budgeting logic, data access, and local DB server. Runs in a worker/process. Manages accounts, transactions, budgets, sync (CRDT). | Exposed via API; Plugins use this for all data operations. New rules or calculations can hook into core events. |
| **Sync Server**           | Optional server for multi-device sync. Stores encrypted change messages and a backup of the budget file. | Could allow plugins on server side (less likely) – focus is on client-side plugins as server is stateless relay. |
| **Desktop/Web UI**        | React app (with Redux) providing the user interface: Budgeting screen, account registers, reports, etc. | To be modularized. Plugins can insert UI elements (new pages or widgets). The UI will load plugin components as needed. |
| **API Layer**             | JavaScript API (`@actual-app/api`) for core operations, used by UI and available to scripts. | Foundation of the Plugin SDK. The SDK will be a restricted view of this API for third-party use. |
| **Database (SQLite)**     | Local SQLite database storing all data. Utilizes views for derived data. | Schema changes via migrations. Plugins may get read/write access through API, but direct DB schema mods by plugins are discouraged (to maintain integrity). |
| **CRDT Sync Engine**      | Part of core – handles merging changes from multiple devices using CRDT, ensuring eventual consistency. | Generally internal. Not exposed directly, but ensures plugins triggering changes still sync properly. |
| **Security Mechanisms**   | Encryption for sync, authentication, sandboxing (planned for plugins). Ensures data is local and safe. | Plugins will operate in sandbox with defined permissions. The core will enforce access rules to protect data. |

Finally, here’s a **Phase-wise focus summary** in a table for clarity:

| **Phase** | **Focus**                            | **Key Actions**                                                 |
|-----------|--------------------------------------|-----------------------------------------------------------------|
| **1: Core + New UI**   | Establish standalone core usage; replace UI | - Initialize core engine in isolation. <br> - Build minimal custom UI using core API. <br> - Ensure all basic features work via API (accounts, transactions, budgeting, sync). |
| **2: Plugin SDK**      | Introduce plugins & hooks; internal refactor | - Define plugin API surface (wrap core API) and events. <br> - Implement plugin loading and sandbox execution. <br> - Create extension points in UI (dynamic menus/views). <br> - Convert some built-in features into plugins to test system. |
| **3: Marketplace & UX**| Community plugin ecosystem & polish         | - Provide in-app plugin browser/installer with ratings. <br> - Implement optional monetization (license keys or similar). <br> - Harden security: permission prompts, plugin signing. <br> - Refine plugin API from feedback, add any needed hooks. |

Each phase builds on the previous, gradually transitioning Actual from a closed system to an open platform while maintaining its core strengths of speed, privacy, and robust budgeting functionality.

Throughout all phases, thorough testing and community involvement will guide adjustments. By the end, Actual Budget will not only be a personal finance app, but a **flexible budgeting framework** that users can customize to their needs, and a marketplace will enable developers to innovate on top of a solid foundation.

**Sources:**

- Official Actual Budget documentation and repository, which describe the project structure and design.
- Community references confirming use of local SQLite and no REST API.
- Release notes and issue trackers indicating technology choices (Redux) and ongoing modularization efforts.
- Actual Budget FAQ explaining the security model and lack of remote endpoints.
- Actual community projects that highlight potential integration points for plugins (bank sync, AI categorize).

