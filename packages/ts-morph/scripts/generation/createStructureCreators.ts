/**
 * Code Manipulation - Create create helpers on `Structure`
 * -------------------------------------------------
 * This modifies the Structure.generated.ts file that is used
 * for doing type guards and creation on structures.
 * -------------------------------------------------
 */
import { tsMorph } from "../deps.ts";
import { Structure, TsMorphInspector } from "../inspectors/mod.ts";

export function createStructureCreators(inspector: TsMorphInspector) {
  const structureTypeGuardsFile = inspector.getProject().getSourceFileOrThrow("Structure.generated.ts");
  const typeGuardsExpr = structureTypeGuardsFile
    .getVariableDeclarationOrThrow("Structure")
    .getInitializerIfKindOrThrow(tsMorph.SyntaxKind.AsExpression)
    .getExpressionIfKindOrThrow(tsMorph.SyntaxKind.ObjectLiteralExpression);

  clearPreviouslyGeneratedMethods(typeGuardsExpr);

  const structureInfos = getStructureInfos(inspector);
  addNewMethods(typeGuardsExpr, structureInfos);

  structureTypeGuardsFile.fixMissingImports();
}

function clearPreviouslyGeneratedMethods(typeGuardsExpr: tsMorph.ObjectLiteralExpression) {
  // remove all the methods that start with "create"
  for (const prop of typeGuardsExpr.getProperties()) {
    if (tsMorph.Node.isMethodDeclaration(prop) && prop.getName().startsWith("create"))
      prop.remove();
  }
}

interface StructureInfo {
  name: string;
  kind: string;
}

function getStructureInfos(inspector: TsMorphInspector) {
  const infos = new Map<Structure, StructureInfo>();
  const structures = inspector.getStructures();

  for (const structure of structures) {
    if (!shouldIncludeStructure(structure.getName()))
      continue;

    const structureKind = structure.getStructureKindName();
    if (structureKind == null)
      continue;
    handleStructure(structure, structureKind);
  }

  return Array.from(infos.values()).filter(v => shouldIncludeStructure(v.name));

  function handleStructure(structure: Structure, structureKind: string) {
    let structureInfo = infos.get(structure);
    if (structureInfo == null) {
      const kind = structure.getStructureKindName();
      if (kind) {
        structureInfo = {
          name: structure.getName(),
          kind,
        };
        infos.set(structure, structureInfo);
      }
    }
    if (!structureInfo) {
      return;
    }

    // for (const baseStructure of structure.getBaseStructures())
    //   handleStructure(baseStructure, structureKind);
  }

  function shouldIncludeStructure(name: string) {
    return !name.endsWith("SpecificStructure") && name !== "KindedStructure" && name !== "Structure";
  }
}

function addNewMethods(typeGuardsExpr: tsMorph.ObjectLiteralExpression, structureInfos: StructureInfo[]) {
  typeGuardsExpr.addMethods(structureInfos.map(info => ({
    docs: [`Create a structure for a ${info.name}.`],
    name: `create${formatName(info.name)}`,
    parameters: [{ name: "structure", type: `OptionalKind<${info.name}>` }],
    returnType: info.name,
    statements: writer => {
      writer.write(`return { kind: StructureKind.${info.kind}, ...structure }`);
    },
  })));

  function formatName(name: string) {
    name = name.replace("Structure", "").replace(/Node$/, "");
    if (name === "ExportDeclaration" || name === "ImportDeclaration" || name === "VariableDeclaration")
      return name;
    return name.replace(/Declaration$/, "");
  }
}
