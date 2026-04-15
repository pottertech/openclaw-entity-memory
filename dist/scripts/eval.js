import fs from "node:fs/promises";
import path from "node:path";
async function main() {
    const fixtureFile = process.env.EVAL_FIXTURE_FILE ??
        "tests/fixtures/eval-cases.json";
    const fullPath = path.resolve(process.cwd(), fixtureFile);
    let cases = [];
    try {
        const raw = await fs.readFile(fullPath, "utf8");
        cases = JSON.parse(raw);
    }
    catch (error) {
        console.error(JSON.stringify({
            ok: false,
            msg: "could not load eval cases",
            error: error instanceof Error ? error.message : String(error),
            file: fixtureFile,
        }));
        process.exit(1);
    }
    if (!Array.isArray(cases) || cases.length === 0) {
        console.error(JSON.stringify({ ok: false, msg: "no eval cases found", file: fixtureFile }));
        process.exit(1);
    }
    const results = cases.map((c) => ({
        name: c.name,
        question: c.question,
        sameAnswer: false,
        notes: "placeholder — connect semantic baseline and hybrid services to run",
    }));
    console.log(JSON.stringify({
        ok: true,
        fixtureFile,
        caseCount: cases.length,
        results,
    }, null, 2));
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
