## Plan: Introduce TypeScript

**Goal**: Migrate the project's JavaScript codebase to TypeScript to improve code quality, maintainability, and developer experience, while ensuring compatibility with Cloudflare Pages.

**Rationale**: TypeScript's static type checking catches errors early, enhances tooling, and improves code readability and refactoring confidence, especially as the project grows. Cloudflare Pages requires a build step to compile TypeScript to JavaScript.

**Steps**:

1.  **Install TypeScript and Build Tools**:
    *   Install `typescript` as a development dependency.
    *   For initial compilation, we will use `tsc` (the TypeScript compiler) as it's straightforward for transpilation. If advanced bundling or minification is required later, a tool like `esbuild` or `Rollup` could be integrated.

2.  **Configure `tsconfig.json`**:
    *   Create a `tsconfig.json` file in the project root.
    *   Configure it to target ES2020 (or a suitable modern ES version), output to a `dist` directory, enable strict type checking, and allow ES module interop.

3.  **Convert JavaScript Files to TypeScript**:
    *   Rename `.js` files to `.ts` (or `.tsx` if React/JSX is introduced later).
    *   Gradually add type annotations to variables, function parameters, and return types.
    *   Address any type errors reported by the TypeScript compiler.

4.  **Update `package.json` Scripts**:
    *   Add a `build` script to `package.json` that runs the TypeScript compiler (`tsc`).
    *   Modify existing development scripts (e.g., `start`, `dev`) to run the build step or watch for changes.

5.  **Update HTML References**:
    *   Ensure `index.html` and `dashboard.html` reference the compiled JavaScript files in the `dist` directory.

6.  **Verify Functionality**:
    *   Thoroughly test the application after each major conversion step to ensure all features work as expected.
    *   Run `pnpm run lint` and `pnpm run format` to maintain code style.

**Note on Cloudflare Pages**: Cloudflare Pages will deploy the compiled JavaScript output from the `dist` directory. The build step will be executed as part of the CI/CD pipeline (e.g., on GitHub Actions) before deployment.
