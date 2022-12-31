export type TCSSObject = Record<string, any>;

/**
 *
 *
 * @export
 * @param {TCSSObject} css
 * @return {*}  {string}
 */
export function objectToCSS(css: TCSSObject): string {
  let value = "";
  const cssString = Object.keys(css)
    .map((setting) => {
      value = css[setting];
      if (typeof value === "string" || typeof value === "number") {
        return `${setting}: ${value};`;
      }
    })
    .join(" ");

  return cssString;
}
