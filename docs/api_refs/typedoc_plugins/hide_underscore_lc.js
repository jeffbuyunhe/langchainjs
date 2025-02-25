const {
  Application,
  Converter,
  Context,
  ReflectionKind,
  DeclarationReflection,
  RendererEvent,
} = require("typedoc");
const fs = require("fs");
const fsPromises = require("fs/promises");
const path = require("path")

const PATH_TO_LANGCHAIN_PKG_JSON = "../../langchain/package.json";
const BASE_OUTPUT_DIR = "./public";
const SCRIPT_HTML = `<script>
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.keyCode === 75) { // Check for CMD + K or CTRL + K
      const input = document.getElementById('tsd-search-field'); // Get the search input element by ID
      input.focus(); // Focus on the search input element
      document.getElementById('tsd-search').style.display = 'block'; // Show the div wrapper with ID tsd-search
    }
  }, false); // Add event listener for keydown events
</script>`;

/**
 * @param {Application} application 
 * @returns {void}
 */
function load(application) {
  /**
   * @type {string}
   */
  let langchainVersion;
  try {
    const langChainPackageJson = fs.readFileSync(PATH_TO_LANGCHAIN_PKG_JSON).toString();
    langchainVersion = JSON.parse(langChainPackageJson).version;
  } catch (e) {
    throw new Error(`Error reading LangChain version for typedoc: ${e}`)
  }

  /**
   * @type {Array<DeclarationReflection>}
   */
  let reflectionsToHide = [];
  
  application.converter.on(
    Converter.EVENT_CREATE_DECLARATION,
    resolveReflection
  );
  application.converter.on(Converter.EVENT_RESOLVE_BEGIN, onBeginResolve);

  application.renderer.on(RendererEvent.BEGIN, onBeginRenderEvent);


  application.renderer.on(RendererEvent.END, onEndRenderEvent);

  const reflectionKindsToHide = [
    ReflectionKind.Property,
    ReflectionKind.Accessor,
    ReflectionKind.Variable,
    ReflectionKind.Method,
    ReflectionKind.Function,
    ReflectionKind.Class,
    ReflectionKind.Interface,
    ReflectionKind.Enum,
    ReflectionKind.TypeAlias,
  ];

  /**
   * @param {Context} context 
   * @returns {void}
   */
  function onBeginRenderEvent(context) {
    const { project } = context;
    if (project && langchainVersion) {
      project.packageVersion = langchainVersion;
    }
  }

  /**
   * @param {Context} context 
   * @returns {void}
   */
  function onBeginResolve(context) {
    reflectionsToHide.forEach((reflection) => {
      const { project } = context;
      // Remove the property from documentation
      project.removeReflection(reflection);
    });
  }

  /**
   * @param {Context} _context 
   * @param {DeclarationReflection} reflection 
   * @returns {void}
   */
  function resolveReflection(
    _context,
    reflection
  ) {
    const reflectionKind = reflection.kind;
    if (reflectionKindsToHide.includes(reflectionKind)) {
      if (
        reflection.name.startsWith("_") ||
        reflection.name.startsWith("lc_")
      ) {
        reflectionsToHide.push(reflection);
      }
    }
    if (reflection.name.includes("/src")) {
      reflection.name = reflection.name.replace("/src", "")
    }
    if (reflection.name.startsWith("libs/")) {
      reflection.name = reflection.name.replace("libs/", "")
    }
  }

  /**
   * @param {Context} context 
   */
  async function onEndRenderEvent(context) {
    const htmlToSplitAt = `<div class="tsd-toolbar-contents container">`;
    const { urls } = context;
    // We want async. If not then it can load lots of very large
    // `.html` files into memory at one time, which we don't want.
    for await (const { url } of urls) {
      const indexFilePath = path.join(BASE_OUTPUT_DIR, url);
      const htmlFileContent = fs.readFileSync(indexFilePath, "utf-8");
      const [part1, part2] = htmlFileContent.split(htmlToSplitAt);
      const htmlWithScript = part1 + SCRIPT_HTML + part2;
      await fsPromises.writeFile(indexFilePath, htmlWithScript);
    }
  }
}

module.exports = { load };
