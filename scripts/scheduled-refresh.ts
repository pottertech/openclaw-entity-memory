import { exec as execChild } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execChild);

async function main(): Promise<void> {
  const refreshEveryMinutes = Number(process.env.REFRESH_INTERVAL_MINUTES ?? 60);

  console.log(
    JSON.stringify({
      ok: true,
      msg: "scheduled refresh runner started",
      refreshEveryMinutes,
    }),
  );

  async function runOnce(): Promise<void> {
    try {
      const { stdout, stderr } = await exec("npm run cases:refresh-real", {
        env: process.env,
      });

      console.log(
        JSON.stringify({
          ok: true,
          msg: "case pack refreshed",
          stdout,
          stderr,
          ranAt: new Date().toISOString(),
        }),
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          ok: false,
          msg: "scheduled refresh failed",
          error: error instanceof Error ? error.message : String(error),
          ranAt: new Date().toISOString(),
        }),
      );
    }
  }

  await runOnce();

  setInterval(() => {
    void runOnce();
  }, refreshEveryMinutes * 60 * 1000);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});