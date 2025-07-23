// script to convert problem structure to Python code
// Updated to be identical in behavior to the C++ parser logic

import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mappingPath = path.join(__dirname, "mapping.json");
const typeMapping = JSON.parse(fs.readFileSync(mappingPath, "utf-8"));

function parseStructure(structure) {
  const lines = structure.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const result = { functions: [], classes: [] };
  let i = 0;
  while (i < lines.length) {
    if (lines[i].startsWith("Function:")) {
      const func = { name: lines[i].split(":")[1].trim(), inputs: [], outputType: null };
      i++;
      while (i < lines.length && (lines[i].startsWith("Input:") || lines[i].startsWith("Output:"))) {
        if (lines[i].startsWith("Input:")) {
          const inputStr = lines[i].replace("Input:", "").trim();
          if (inputStr) {
            inputStr.split(",").forEach(pair => {
              const [type, ...nameParts] = pair.trim().split(" ");
              func.inputs.push({ type, name: nameParts.join(" ") });
            });
          }
        } else if (lines[i].startsWith("Output:")) {
          func.outputType = lines[i].replace("Output:", "").trim();
        }
        i++;
      }
      result.functions.push(func);
    } else if (lines[i].startsWith("Class:")) {
      const className = lines[i].split(":")[1].trim();
      i++;
      const methods = [];
      while (i < lines.length && lines[i].startsWith("Methods:")) {
        i++;
        while (i < lines.length && lines[i].startsWith("-")) {
          const methodLine = lines[i].replace("-", "").trim();
          const method = { name: methodLine, inputs: [], outputType: null };
          i++;
          while (i < lines.length && (lines[i].startsWith("Input:") || lines[i].startsWith("Output:"))) {
            if (lines[i].startsWith("Input:")) {
              const inputStr = lines[i].replace("Input:", "").trim();
              if (inputStr) {
                inputStr.split(",").forEach(pair => {
                  const [type, ...nameParts] = pair.trim().split(" ");
                  method.inputs.push({ type, name: nameParts.join(" ") });
                });
              }
            } else if (lines[i].startsWith("Output:")) {
              method.outputType = lines[i].replace("Output:", "").trim();
            }
            i++;
          }
          methods.push(method);
        }
      }
      result.classes.push({ name: className, methods });
    } else {
      i++;
    }
  }
  return result;
}

function mapType(type) {
  return typeMapping[type]?.python || type;
}

function generateFunctionBoilerplate(func) {
  const args = func.inputs.map(inp => inp.name).join(", ");
  return `def ${func.name}(${args}):\n    # Write your code here\n    pass`;
}

function generateClassBoilerplate(cls) {
  let code = `class ${cls.name}:`;
  if (cls.methods.length === 0) {
    code += `\n    pass`;
  } else {
    cls.methods.forEach(method => {
      const args = ["self"].concat(method.inputs.map(inp => inp.name)).join(", ");
      code += `\n    def ${method.name}(${args}):\n        # Write your code here\n        pass`;
    });
  }
  return code;
}

function generateBoilerplate(parsed) {
  let code = "";
  parsed.classes.forEach(cls => {
    code += generateClassBoilerplate(cls) + "\n\n";
  });
  parsed.functions.forEach(func => {
    code += generateFunctionBoilerplate(func) + "\n\n";
  });
  return code.trim();
}

function generateInputCode(input, knownSizes = {}) {
  const type = mapType(input.type);
  const name = input.name;

  if (["int", "str", "bool", "float"].includes(type)) {
    return `    ${name} = ${type}(input())`;
  }

  if (type.startsWith("List[List[")) {
    const sizeVars = Object.keys(knownSizes);
    const [rowsVar, colsVar] = sizeVars.slice(-2);
    const inner = type.match(/List\[List\[(.*?)\]\]/)?.[1];

    if (!rowsVar || !colsVar || !["int", "str", "bool", "float"].includes(inner)) {
      return `    ${name} = input()  # TODO: Parse as ${type}`;
    }

    return `    ${name} = [[${inner}(x) for x in input().split()] for _ in range(${rowsVar})]`;
  }

  if (type.startsWith("List[")) {
    const inner = type.match(/List\[(.*?)\]/)?.[1];

    if (!["int", "str", "bool", "float"].includes(inner)) {
      return `    ${name} = input()  # TODO: Parse as ${type}`;
    }

    return `    ${name} = list(map(${inner}, input().split()))`;
  }

  return `    ${name} = input()  # TODO: Parse as ${type}`;
}

function generateOutputCode(outputType) {
  const type = mapType(outputType);
  if (["int", "str", "bool", "float"].includes(type)) {
    return `    print(result)`;
  } else if (type.startsWith("List[List[")) {
    return `    for row in result:\n        print(*row)`;
  } else if (type.startsWith("List[")) {
    return `    print(*result)`;
  } else {
    return `    print(result)  # TODO: Add custom print logic`;
  }
}

function generateFullBoilerplate(parsed) {
  let code = "# Imports\n";
  code += "import sys\n\n";
  code += generateBoilerplate(parsed) + "\n\n";
  code += "if __name__ == '__main__':\n";
  let mainFunc = parsed.functions[0] || (parsed.classes[0]?.methods[0]);
  if (mainFunc) {
    let knownSizes = {};
    mainFunc.inputs.forEach(inp => {
      code += generateInputCode(inp, knownSizes) + "\n";
      const type = mapType(inp.type);
      if (type === 'int') knownSizes[inp.name] = true;
    });
    let call;
    if (parsed.functions[0]) {
      call = `${mainFunc.name}(${mainFunc.inputs.map(inp => inp.name).join(", ")})`;
    } else {
      call = `obj = ${parsed.classes[0].name}()\n    result = obj.${mainFunc.name}(${mainFunc.inputs.map(inp => inp.name).join(", ")})`;
      code += `    ${call}\n`;
      code += generateOutputCode(mainFunc.outputType) + "\n";
      return code;
    }
    code += `    result = ${call}\n`;
    code += generateOutputCode(mainFunc.outputType) + "\n";
  }
  return code;
}

export function generatePythonBoilerplates(structure) {
  const parsed = parseStructure(structure);
  const boilerplate = generateBoilerplate(parsed);
  const fullBoilerplate = generateFullBoilerplate(parsed);
  return { boilerplate, fullBoilerplate };
}
