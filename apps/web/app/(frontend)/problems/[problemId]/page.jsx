export default function ProblemPage({ params }) {
  const { problemId } = params;

  return (
    <div>
      <h1>Welcome to the Problem Page</h1>
      <p>Problem ID: {problemId}</p>
    </div>
  );
}
