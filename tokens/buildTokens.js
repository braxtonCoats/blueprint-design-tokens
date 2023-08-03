const StyleDictionaryPackage = require("style-dictionary");
const { fileHeader } = StyleDictionaryPackage.formatHelpers;
const { isPx, transformShadow } = require("./lib/utils");

/**
 * format for css variables
 */
StyleDictionaryPackage.registerFormat({
  name: "css/variables",
  formatter: function(dictionary, config) {
    return `${this.selector} {
        ${dictionary.allProperties
          .map((prop) => `  --${prop.name}: ${prop.value};`)
          .join("\n")}
      }`;
  },
});

/**
 * transform: js variable names
 * example: `namespace.item.variant.property.modifier`
 */
StyleDictionaryPackage.registerTransform({
  name: "name/js",
  type: "name",
  transformer: (token, options) => {
    return token.path.join(".");
  },
});

StyleDictionaryPackage.registerTransform({
  name: "sizes/px",
  type: "value",
  matcher: function(prop) {
    return [
      "fontSize",
      "spacing",
      "borderRadius",
      "borderWidth",
      "sizing",
    ].includes(prop.attributes.category);
  },
  transformer: function(prop) {
    // You can also modify the value here if you want to convert pixels to ems
    return parseFloat(prop.original.value) + "px";
  },
});

// transform: px to rem
StyleDictionaryPackage.registerTransform({
  name: "pxToRem",
  type: "value",
  transformer: (token, options) => {
    if (isPx(token.value)) {
      const baseFontSize = 16;
      const floatValue = parseFloat(token.value.replace("px", ""));

      if (isNaN(floatValue)) {
        return token.value;
      }

      if (floatValue === 0) {
        return "0";
      }

      return `${floatValue / baseFontSize}rem`;
    }
    return token.value;
  },
});

/**
 * Transform shadow shorthands for css variables
 */

StyleDictionaryPackage.registerTransform({
  name: "shadow/shorthand",
  type: "value",
  transitive: true,
  matcher: (token) => ["boxShadow"].includes(token.type),
  transformer: (token) => {
    return Array.isArray(token.original.value)
      ? token.original.value.map((single) => transformShadow(single)).join(", ")
      : transformShadow(token.original.value);
  },
});

// transform: composite typography to shorthands
StyleDictionaryPackage.registerTransform({
  name: "typography/shorthand",
  type: "value",
  transitive: true,
  matcher: (token) => token.type === "typography",
  transformer: (token) => {
    const { value } = token;
    return `${value.fontWeight} ${value.fontSize}/${value.lineHeight} ${value.fontFamily}`;
  },
});

function getStyleDictionaryConfig(theme) {
  return {
    source: [`output/${theme}.json`],
    platforms: {
      css: {
        transforms: [
          "attribute/cti",
          "name/cti/kebab",
          "sizes/px",
          "shadow/shorthand",
          "pxToRem",
          "typography/shorthand",
        ],
        buildPath: `output/`,
        files: [
          {
            destination: `css/${theme}.css`,
            format: "css/variables",
            selector: `.${theme}-theme`,
          },
        ],
      },
      js: {
        buildPath: `output/`,
        transforms: ["name/js/es6", "pxToRem"],
        // map the array of token file paths to style dictionary output files
        files: [
          {
            destination: `js/esm/${theme}.js`,
            format: `javascript/es6`,
          },
        ],
      },
      scss: {
        buildPath: `output/`,
        transforms: [
          "attribute/cti",
          "name/cti/kebab",
          "sizes/px",
          "shadow/shorthand",
          "pxToRem",
          "typography/shorthand",
        ],
        // map the array of token file paths to style dictionary output files
        files: [
          {
            destination: `scss/${theme}.scss`,
            format: `scss/map-deep`,
          },
        ],
      },
      jsModule: {
        buildPath: `output/`,
        transforms: ["pxToRem"],
        // map the array of token file paths to style dictionary output files
        files: [
          {
            destination: `js/module/${theme}.js`,
            format: `scss/map-flat`,
          },
        ],
      },
    },
  };
}

console.log("Building tokens...");

["dark", "light"].map(function(theme) {
  console.log("\n==============================================");
  console.log(`\nProcessing: [${theme}]`);

  const StyleDictionary = StyleDictionaryPackage.extend(
    getStyleDictionaryConfig(theme)
  );
  const platforms = ["css","scss"];
  platforms.map((platform) => {
    return StyleDictionary.buildPlatform(platform);
  });

  console.log("\nEnd processing");
});

console.log("\n==============================================");
console.log("\nBuild completed!");