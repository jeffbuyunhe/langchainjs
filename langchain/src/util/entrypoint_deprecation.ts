export function logVersion010MigrationWarning({
  oldEntrypointName,
  newEntrypointName,
  newPackageName = "@langchain/community",
}: {
  oldEntrypointName: string;
  newEntrypointName?: string;
  newPackageName?: string;
}) {
  /* #__PURE__ */ console.warn(
    [
      `[WARNING]: Importing from "langchain/${oldEntrypointName}" is deprecated.\n`,
      `Instead, please add the "${newPackageName}" package to your project with e.g.`,
      ``,
      `    $ npm install ${newPackageName}`,
      ``,
      `and import from "${newPackageName}${
        newEntrypointName === undefined
          ? `/${oldEntrypointName}`
          : newEntrypointName
      }".`,
      ``,
      `This will be mandatory after the next "langchain" minor version bump to 0.2.`,
    ].join("\n")
  );
}
