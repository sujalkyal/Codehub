"use client";
import { useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DIFFICULTY = ["EASY", "MEDIUM", "HARD"];
const TAGS = [
  "Array",
  "String",
  "Math",
  "Dynamic Programming",
  "Graph",
  "Tree",
  "Greedy",
  "Sorting",
  "Binary Search",
  "Hashing",
  "Bit Manipulation",
  "Stack",
  "Queue",
  "Heap",
  "Linked List",
  "Recursion",
  "Backtracking",
  "Two Pointers",
  "Sliding Window",
  "Prefix Sum",
  "Trie",
  "Segment Tree",
  "Disjoint Set",
  "BFS",
  "DFS",
  // Tags from test file
  "implementation",
  "comparison",
  "number theory",
  "loops",
  "set",
  "hash map",
  "prefix sum",
];

export default function ContributePage() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    structure: "",
    inputFormat: "",
    outputFormat: "",
    constraints: "",
    sampleInput: "",
    sampleOutput: "",
    difficulty: "EASY",
    tags: [],
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        tags: prev.tags.includes(value)
          ? prev.tags.filter((t) => t !== value)
          : [...prev.tags, value],
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFile = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please upload an input/output file.");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, tags: form.tags };
      console.log("[DEBUG] Payload to send:", payload);
      const data = new FormData();
      data.append("json", JSON.stringify(payload));
      data.append("input_output", file);

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BOILERPLATE_API_URL || "http://localhost:4000/generate"}`,
        data
      );
      toast.success("Problem created! ID: " + res.data.problemId);
      setForm({
        title: "",
        description: "",
        structure: "",
        inputFormat: "",
        outputFormat: "",
        constraints: "",
        sampleInput: "",
        sampleOutput: "",
        difficulty: "EASY",
        tags: [],
      });
      setFile(null);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to create problem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B192C] flex flex-col items-center py-10 px-2">
      <ToastContainer />
      <div className="w-full max-w-2xl bg-[#1E3E62] rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-[#FF6500] mb-6 text-center">
          Contribute a New Problem
        </h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[#FF6500] font-semibold mb-1">
              Title
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 rounded bg-[#0B192C] text-white border border-[#FF6500] focus:outline-none"
              placeholder="Enter problem title"
            />
          </div>
          <div>
            <label className="block text-[#FF6500] font-semibold mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-3 py-2 rounded bg-[#0B192C] text-white border border-[#FF6500] focus:outline-none"
              placeholder="Describe the problem"
            />
          </div>
          <div>
            <label className="block text-[#FF6500] font-semibold mb-1">
              Structure
            </label>
            <input
              name="structure"
              value={form.structure}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 rounded bg-[#0B192C] text-white border border-[#FF6500] focus:outline-none"
              placeholder="e.g. Function signature, class, etc."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#FF6500] font-semibold mb-1">
                Input Format
              </label>
              <input
                name="inputFormat"
                value={form.inputFormat}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded bg-[#0B192C] text-white border border-[#FF6500] focus:outline-none"
                placeholder="Describe input format"
              />
            </div>
            <div>
              <label className="block text-[#FF6500] font-semibold mb-1">
                Output Format
              </label>
              <input
                name="outputFormat"
                value={form.outputFormat}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded bg-[#0B192C] text-white border border-[#FF6500] focus:outline-none"
                placeholder="Describe output format"
              />
            </div>
          </div>
          <div>
            <label className="block text-[#FF6500] font-semibold mb-1">
              Constraints
            </label>
            <input
              name="constraints"
              value={form.constraints}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 rounded bg-[#0B192C] text-white border border-[#FF6500] focus:outline-none"
              placeholder="e.g. 1 ≤ n ≤ 10^5"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#FF6500] font-semibold mb-1">
                Sample Input
              </label>
              <textarea
                name="sampleInput"
                value={form.sampleInput}
                onChange={handleChange}
                required
                rows={2}
                className="w-full px-3 py-2 rounded bg-[#0B192C] text-white border border-[#FF6500] focus:outline-none"
                placeholder="Sample input"
              />
            </div>
            <div>
              <label className="block text-[#FF6500] font-semibold mb-1">
                Sample Output
              </label>
              <textarea
                name="sampleOutput"
                value={form.sampleOutput}
                onChange={handleChange}
                required
                rows={2}
                className="w-full px-3 py-2 rounded bg-[#0B192C] text-white border border-[#FF6500] focus:outline-none"
                placeholder="Sample output"
              />
            </div>
          </div>
          <div>
            <label className="block text-[#FF6500] font-semibold mb-1">
              Difficulty
            </label>
            <select
              name="difficulty"
              value={form.difficulty}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded bg-[#0B192C] text-white border border-[#FF6500] focus:outline-none"
            >
              {DIFFICULTY.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[#FF6500] font-semibold mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <label
                  key={tag}
                  className="flex items-center text-white bg-[#1E3E62] px-2 py-1 rounded border border-[#FF6500] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    name="tags"
                    value={tag}
                    checked={form.tags.includes(tag)}
                    onChange={handleChange}
                    className="mr-2 accent-[#FF6500]"
                  />
                  {tag}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[#FF6500] font-semibold mb-1">
              Input/Output File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFile}
              required
              className="w-full text-white"
            />
            <span className="text-xs text-gray-300">Accepted: .json</span>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 rounded bg-[#FF6500] text-[#0B192C] font-bold text-lg hover:bg-[#ff7f32] transition"
          >
            {loading ? "Submitting..." : "Submit Problem"}
          </button>
        </form>
      </div>
    </div>
  );
}
