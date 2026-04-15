import express from "express";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/v1/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/v1/semantic/query", (req, res) => {
  const question = String(req.body?.question ?? "");
  const semanticCandidates = Array.isArray(req.body?.semanticCandidates)
    ? req.body.semanticCandidates
    : [];

  const top = [...semanticCandidates]
    .sort((a, b) => (Number(b.score ?? 0) - Number(a.score ?? 0)))
    .slice(0, 2);

  let answer = "No clear answer";
  let confidence: "low" | "medium" | "high" = "low";

  const joined = semanticCandidates.map((item: any) => String(item.text ?? "")).join(" ");

  if (/Alice/i.test(joined) && /Project Atlas/i.test(joined)) {
    answer = /lead/i.test(joined) || /tech lead/i.test(joined) ? "Yes" : answer;
    confidence = answer === "Yes" ? "high" : confidence;
  }

  if (
    /PostgreSQL/i.test(joined) &&
    /Tuesday/i.test(joined) &&
    /Project Atlas/i.test(joined) &&
    /Alice/i.test(question)
  ) {
    answer = "Likely yes";
    confidence = "medium";
  }

  res.json({
    answer,
    confidence,
    evidence: top.map((item: any) => ({
      documentXid: item.documentXid,
      chunkXid: item.chunkXid,
      text: item.text,
    })),
    notes: ["mock semantic baseline response"],
  });
});

const port = Number(process.env.SEMANTIC_BASELINE_PORT ?? 4020);

app.listen(port, () => {
  console.log(
    JSON.stringify({
      level: "info",
      msg: "mock semantic baseline listening",
      port,
    }),
  );
});
