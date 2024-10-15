import { promises as fs } from "fs";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import StyleDictionary from "style-dictionary";
import { extractCollectionAndMode, extractCollectionModes } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/**
 Public BP - components URL
 */
const styleDictionaryURL = "https://bwdesign.zeroheight.com/api/token_management/token_set/6064/style_dictionary_links";

/**
 *  Test token set
 *
 */
//const styleDictionaryURL = "https://bwdesign.zeroheight.com/api/token_management/token_set/5782/style_dictionary_links";

/**
 * ZH demo URL
 * */
//const styleDictionaryURL = "https://zeroheight.zeroheight.com/api/token_management/token_set/7770/style_dictionary_links";

/**
 * Fetches links for each collection and mode
 *
 * @returns {string[]} list of URLs for each collection and mode
 */
async function fetchLinks() {
  try {
    /** styleDictionaryURL value is generated per a token set at zeroheight.
     *
     * If you generate a private link, you need to generate access token and add additional headers to the request
     * X-API-CLIENT
     * X-API-KEY
     *
     * Learn more: https://zeroheight.com/help/article/documenting-figma-color-variables/
     */
    const response = await fetch(styleDictionaryURL);
    const textResponse = await response.text();
    const links = textResponse.split("\n");

    return links;
  } catch (error) {
    console.error("❗️Error fetching links:", error);
  }
}

/**
 * Iterates links, fetches Style Dictionary JSON files and saves them
 *
 * @param {string[]} links
 */
async function saveFiles(links) {
  try {
    for (const link of links) {
      const response = await fetch(link);

      if (!response.ok) {
        throw new Error(`Failed to fetch from ${link}: ${response.statusText}`);
      }

      const jsonData = await response.json();

      const [collection, mode] = extractCollectionAndMode(link);
      const directory = path.join(__dirname, "json", collection);

      await fs.mkdir(directory, { recursive: true });

      const fileName = `${mode}.json`;
      const filePath = path.join(directory, fileName);

      await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));
    }
  } catch (error) {
    console.error("❗️Error:", error);
  }
}

StyleDictionaryPackage.registerTransform({
  name: "sizes/px",
  type: "value",
  matcher: function (prop) {
    return [
      "fontSize",
      "spacing",
      "borderRadius",
      "borderWidth",
      "sizing",
    ].includes(prop.attributes.category);
  },
  transformer: function (prop) {
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

/**
 * Returns Style Dictionary config
 *
 * @param {string} mode1
 * @param {string} mode2
 * @returns {json} Style Dictionary config
 */
function getStyleDictionaryConfig(mode1, mode2) {

  // This combines the token set name with the raw value token set name
  // const buildDir = [mode1, mode2].join("-");
  const buildDir = [mode1, "bp"].join("-");

  return {
    source: [`json/blueprint_theme/${mode1}.json`, `json/brand_palette/${mode2}.json`],
    platforms: {
      web: {
        transformGroup: "web",
        buildPath: `build/web/${buildDir}/`,
        files: [
          {
            destination: "tokens.css",
            format: "css/variables",
          },
        ],
      },
      scss: {
        buildPath: `build/scss/${buildDir}/`,
        transforms: [
          "attribute/cti",
          "name/cti/kebab",
          "sizes/px",
          "shadow/shorthand",
          "pxToRem",
          "typography/shorthand",
        ],
        files: [
          {
            destination: "tokens.scss",
            format: "scss/map-deep",
          }
        ],
      },
    },
  };
}

/**
 * Main function that builds tokens
 */
(async () => {
  const links = await fetchLinks();
  await saveFiles(links);

  const collectionModes = extractCollectionModes(links);
  // const tokensCollectionModes = collectionModes.tokens;
  // const primitivesCollectionModes = collectionModes.primitives;
  const tokensCollectionModes = collectionModes.blueprint_theme;
  const primitivesCollectionModes = collectionModes.brand_palette;
  const platforms = ["web", "scss"];

  console.log("\n🚀 Build started...");

  tokensCollectionModes.forEach((m1) => {
    primitivesCollectionModes.forEach((m2) => {
      platforms.forEach((platform) => {
        const sd = new StyleDictionary(getStyleDictionaryConfig(m1, m2));
        sd.buildPlatform(platform);
      });
    });
  });
})();
