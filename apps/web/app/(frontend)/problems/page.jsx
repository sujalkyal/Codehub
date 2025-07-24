
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

export default function ProblemsListPage() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTag, setSelectedTag] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  useEffect(() => {
    setLoading(true);
    axios
      .get("/api/problems/getAllProblem")
      .then((res) => {
        setProblems(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch problems");
        setLoading(false);
      });
  }, []);

  // Collect all tags for filter
  const allTags = Array.from(
    new Set(problems.flatMap((p) => p.tags || []))
  );

  // Filter and paginate
  const filtered = selectedTag
    ? problems.filter((p) => p.tags.includes(selectedTag))
    : problems;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div className="min-h-screen bg-[#0B192C] px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-[#FF6500] mb-6">Problems</h1>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            className={`px-3 py-1 rounded border border-[#FF6500] text-sm font-medium transition ${
              !selectedTag ? "bg-[#FF6500] text-[#0B192C]" : "text-[#FF6500] bg-transparent"
            }`}
            onClick={() => setSelectedTag("")}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`px-3 py-1 rounded border border-[#FF6500] text-sm font-medium transition ${
                selectedTag === tag
                  ? "bg-[#FF6500] text-[#0B192C]"
                  : "text-[#FF6500] bg-transparent"
              }`}
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="text-white">Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full bg-[#1E3E62] text-white">
              <thead>
                <tr>
                  <th className="py-3 px-4 text-left">Title</th>
                  <th className="py-3 px-4 text-left">Difficulty</th>
                  <th className="py-3 px-4 text-left">Tags</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((problem) => (
                  <tr key={problem.id} className="border-b border-[#0B192C] hover:bg-[#0B192C] transition">
                    <td className="py-2 px-4">
                      <Link href={`/problems/${problem.slug}`} className="text-[#FF6500] hover:underline font-semibold">
                        {problem.title}
                      </Link>
                    </td>
                    <td className="py-2 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          problem.difficulty === "EASY"
                            ? "bg-green-600 text-white"
                            : problem.difficulty === "MEDIUM"
                            ? "bg-yellow-600 text-white"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {problem.difficulty}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex flex-wrap gap-1">
                        {problem.tags.map((tag) => (
                          <span key={tag} className="bg-[#FF6500] text-[#0B192C] px-2 py-0.5 rounded text-xs font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination */}
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            className="px-3 py-1 rounded bg-[#1E3E62] text-[#FF6500] border border-[#FF6500] disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </button>
          <span className="text-white font-medium">
            Page {page} of {totalPages || 1}
          </span>
          <button
            className="px-3 py-1 rounded bg-[#1E3E62] text-[#FF6500] border border-[#FF6500] disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
