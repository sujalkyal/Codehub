// script to convert problem structure to C++ code
// will return both boilerplate and full-boilerplate code

import fs from "fs";
import path from "path";

const mappingPath = path.join(__dirname, "mapping.json");
const typeMapping = JSON.parse(fs.readFileSync(mappingPath, "utf-8"));

function parseStructure(structure) {
  // Split by lines and parse functions/classes
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
  return typeMapping[type]?.cpp || type;
}

function generateFunctionBoilerplate(func) {
  const args = func.inputs.map(inp => `${mapType(inp.type)} ${inp.name}`).join(", ");
  return `${mapType(func.output)} ${func.name}(${args}) {\n    // Write your code here\n}`;
}

function generateClassBoilerplate(cls) {
  let code = `class ${cls.name} {\npublic:`;
  cls.methods.forEach(method => {
    const args = method.inputs.map(inp => `${mapType(inp.type)} ${inp.name}`).join(", ");
    code += `\n    ${mapType(method.output)} ${method.name}(${args}) {\n        // Write your code here\n    }`;
  });
  code += `\n};`;
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
  let includes = ["#include <iostream>", "#include <vector>", "#include <string>", "#include <map>"];
  let code = includes.join("\n") + "\nusing namespace std;\n\n";
  code += generateBoilerplate(parsed) + "\n";
  code += "int main() {\n";
  // For demo, just show input/output for first function or method
  let mainFunc = parsed.functions[0] || (parsed.classes[0]?.methods[0]);
  if (mainFunc) {
    // Generate input code
    mainFunc.inputs.forEach(inp => {
      code += `    ${mapType(inp.type)} ${inp.name};\n    cin >> ${inp.name};\n`;
    });
    // Call function/class method
    let call;
    if (parsed.functions[0]) {
      call = `${mainFunc.name}(${mainFunc.inputs.map(inp => inp.name).join(", ")})`;
    } else {
      call = `${parsed.classes[0].name} obj;\n    obj.${mainFunc.name}(${mainFunc.inputs.map(inp => inp.name).join(", ")})`;
    }
    code += `    auto result = ${call};\n    cout << result << endl;\n`;
  }
  code += "    return 0;\n}";
  return code;
}

export function generateCppBoilerplates(structure) {
  const parsed = parseStructure(structure);
  const boilerplate = generateBoilerplate(parsed);
  const fullBoilerplate = generateFullBoilerplate(parsed);
  return { boilerplate, fullBoilerplate };
}