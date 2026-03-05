import { seedGymnasticsTemplate } from "../src/db/seeders/gymnasticEvent.seeder.ts";

const seeders = {
  gymnastics: seedGymnasticsTemplate,
} as const;

// This type resolves to "gymnastics"
type SeederName = keyof typeof seeders;

const target = process.argv[2] as SeederName | undefined;

if (!target || !(target in seeders)) {
  console.error("❌ Unknown or missing seeder name.");
  console.error("Usage: tsx scripts/seed.ts <seederName>");
  console.error("Available seeders:", Object.keys(seeders).join(", "));
  process.exit(1);
}

// Run the chosen seeder
seeders[target]()
  .then(() => {
    console.log(`✅ ${target} seeder done`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(`❌ ${target} seeder failed:`, err);
    process.exit(1);
  });
