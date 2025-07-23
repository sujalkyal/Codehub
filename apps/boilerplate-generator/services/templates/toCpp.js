// script to convert problem structure to C++ code
// will return both boilerplate and full-boilerplate code

import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mappingPath = path.join(__dirname, "mapping.json");
const typeMapping = JSON.parse(fs.readFileSync(mappingPath, "utf-8"));

function parseStructure(structure) {
  // Split by lines and parse functions/classes
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
  return typeMapping[type]?.cpp || type;
}

function generateFunctionBoilerplate(func) {
  const args = func.inputs.map(inp => `${mapType(inp.type)} ${inp.name}`).join(", ");
  return `${mapType(func.outputType)} ${func.name}(${args}) {\n  // Write your code here \n}`;
}

function generateClassBoilerplate(cls) {
  let code = `class ${cls.name} {\npublic:`;
  cls.methods.forEach(method => {
    const args = method.inputs.map(inp => `${mapType(inp.type)} ${inp.name}`).join(", ");
    code += `\n    ${mapType(method.outputType)} ${method.name}(${args}) {\n        // Write your code here\n    }`;
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

function generateInputCode(input, knownSizes = {}) {
  const type = mapType(input.type);
  const name = input.name;

  if (["int", "string", "bool", "double", "float", "char", "long"].includes(type)) {
    // Scalar
    return `    ${type} ${name};\n    cin >> ${name};\n`;
  } else if (type.startsWith("vector<vector<")) {
    // 2D vector
    const sizeVars = Object.keys(knownSizes);
    const [rowsVar, colsVar] = sizeVars.slice(-2); // use last 2 known scalars
    const innerType = type.match(/<([^<>]+)>/g).pop().slice(1, -1);
    return (
      `    ${type} ${name}(${rowsVar}, vector<${innerType}>(${colsVar}));\n` +
      `    for(int i = 0; i < ${rowsVar}; ++i)\n` +
      `        for(int j = 0; j < ${colsVar}; ++j)\n` +
      `            cin >> ${name}[i][j];\n`
    );
  } else if (type.startsWith("vector<")) {
    // 1D vector
    const sizeVar = Object.keys(knownSizes).pop(); // use last known scalar
    return (
      `    ${type} ${name}(${sizeVar});\n` +
      `    for(int i = 0; i < ${sizeVar}; ++i) cin >> ${name}[i];\n`
    );
  } else {
    return `    // TODO: Add custom input logic for type: ${type}\n    cin >> ${name};\n`;
  }
}

function generateOutputCode(outputType) {
  const type = mapType(outputType); // ensure mapped to C++ equivalent
  if (type === "int" || type === "string" || type === "bool" || type === "double" || type === "float" || type === "char" || type === "long") {
    return `    cout << result << endl;`;
  } else if (type.startsWith("vector<vector<")) {
    return `
    for (const auto& row : result) {
        for (const auto& val : row) {
            cout << val << " ";
        }
        cout << endl;
    }`;
  } else if (type.startsWith("vector<")) {
    return `
    for (const auto& val : result) {
        cout << val << " ";
    }
    cout << endl;`;
  } else {
    return `    // TODO: Add custom print logic for type: ${type}\n    cout << "Unsupported return type" << endl;`;
  }
}

function generateFullBoilerplate(parsed) {
  let includes = ["#include <bits/stdc++.h>"];
  let code = includes.join("\n") + "\n\nusing namespace std;\n\n";
  code += generateBoilerplate(parsed) + "\n\n";
  code += "int main() {\n";
  // For demo, just show input/output for first function or method
  let mainFunc = parsed.functions[0] || (parsed.classes[0]?.methods[0]);
  if (mainFunc) {
    // Generate input code
    let knownSizes = {};
    for (let i = 0; i < mainFunc.inputs.length; i++) {
      const inp = mainFunc.inputs[i];
      code += generateInputCode(inp, knownSizes);
      // Store scalar values like `int n` or `int m`
      const type = mapType(inp.type);
      if (type === 'int') knownSizes[inp.name] = true;
    }
    // Call function/class method
    let call;
    if (parsed.functions[0]) {
      call = `${mainFunc.name}(${mainFunc.inputs.map(inp => inp.name).join(", ")})`;
    } else {
      call = `${parsed.classes[0].name} obj;\n    obj.${mainFunc.name}(${mainFunc.inputs.map(inp => inp.name).join(", ")})`;
    }
    code += `    auto result = ${call};\n`;
    code += generateOutputCode(mainFunc.outputType) + "\n";
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
