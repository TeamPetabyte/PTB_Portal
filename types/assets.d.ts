// Ambient declarations so TypeScript/VS Code accepts side-effect asset imports
// (e.g. `import "./globals.css"`). Does not affect the build — Next handles these
// via its bundler; this only silences editor error TS2882.
declare module "*.css";
