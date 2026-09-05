// svg.d.ts
declare module "*.svg" {
  import * as React from "react";
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;
  // SVGs are loaded via @svgr/webpack, so the default export is a React
  // component (accepting className and other SVG props), not a string.
  const ReactComponentDefault: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;
  export default ReactComponentDefault;
}
