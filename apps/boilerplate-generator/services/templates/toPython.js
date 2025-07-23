// script to convert problem structure to Python code
// will return both boilerplate and full-boilerplate code

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
      const func = { name: lines[i].split(":")[1].trim(), inputs: [], output: null };
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
          func.output = lines[i].replace("Output:", "").trim();
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
          const method = { name: methodLine, inputs: [], output: null };
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
              method.output = lines[i].replace("Output:", "").trim();
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

function generateFullBoilerplate(parsed) {
  let code = "";
  code += "# Imports\n";
  code += "import sys\n";
  code += generateBoilerplate(parsed) + "\n";
  code += "if __name__ == '__main__':\n";
  let mainFunc = parsed.functions[0] || (parsed.classes[0]?.methods[0]);
  if (mainFunc) {
    mainFunc.inputs.forEach(inp => {
      code += `    ${inp.name} = input()  # TODO: parse as ${mapType(inp.type)}\n`;
    });
    let call;
    if (parsed.functions[0]) {
      call = `${mainFunc.name}(${mainFunc.inputs.map(inp => inp.name).join(", ")})`;
    } else {
      call = `obj = ${parsed.classes[0].name}()\n    obj.${mainFunc.name}(${mainFunc.inputs.map(inp => inp.name).join(", ")})`;
    }
    code += `    print(${call})\n`;
  }
  return code;
}

export function generatePythonBoilerplates(structure) {
  const parsed = parseStructure(structure);
  const boilerplate = generateBoilerplate(parsed);
  const fullBoilerplate = generateFullBoilerplate(parsed);
  return { boilerplate, fullBoilerplate };
}