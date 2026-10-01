import { pool } from "../../src/db/index";
import { getSections, getTeam } from "../../src/lib/control";

async function main() {
  try {
    const [sections, members] = await Promise.all([getSections(), getTeam()]);
    console.log(JSON.stringify({
      members: members.length,
      teamSections: sections.filter((section) => section.key === "team").length,
    }));
  } finally {
    await pool.end();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
