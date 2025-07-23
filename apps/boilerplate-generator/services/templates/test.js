import { generatePythonBoilerplates } from "./toPython.js";
import { generateJavaBoilerplates } from "./toJava.js";
import { generateCppBoilerplates } from "./toCpp.js";

const structure = `
Function: minElement
Input: int n, int m, list<list<int>> arr
Output: list<list<int>>
`;

console.log("===== Parsing Structure =====\n");
console.log(structure);

const cpp_result = generateCppBoilerplates(structure);

console.log("===== C++ Boilerplate =====\n");
console.log(cpp_result.boilerplate);

console.log("\n===== Full C++ Boilerplate =====\n");
console.log(cpp_result.fullBoilerplate);

const java_result = generateJavaBoilerplates(structure);

console.log("===== Java Boilerplate =====\n");
console.log(java_result.boilerplate);

console.log("\n===== Full Java Boilerplate =====\n");
console.log(java_result.fullBoilerplate);

const python_result = generatePythonBoilerplates(structure);

console.log("===== Python Boilerplate =====\n");
console.log(python_result.boilerplate);

console.log("\n===== Full Python Boilerplate =====\n");
console.log(python_result.fullBoilerplate);