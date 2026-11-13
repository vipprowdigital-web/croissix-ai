// mobile_app\types\css.d.ts
//
// Lets TypeScript accept side-effect style imports such as
//   import "@/styles/globals.css";
// Newer TypeScript versions report "Cannot find module or type declarations
// for side-effect import" for them unless the extension is declared.
declare module "*.css";
