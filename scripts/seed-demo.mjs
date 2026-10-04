/**
 * Dev helper: fills an existing account with ~14 months of realistic demo data.
 *
 *   npm run seed:demo -- <username>
 *
 * Adds a few tags to each of the user's categories (if missing) and inserts random
 * income/expense transactions. Existing data is left untouched.
 */
import mongoose from "mongoose";

const username = (process.argv[2] ?? "").toLowerCase();
if (!username) {
  console.error("Usage: npm run seed:demo -- <username>");
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is missing (run with --env-file=.env.local).");
  process.exit(1);
}

// Colors follow the app's validated categorical order (src/lib/palette.ts).
const PALETTE = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];

const PRESETS = {
  default: { expense: ["Groceries", "Transport", "Leisure", "Bills"], income: ["Salary", "Refund"] },
  "my son": { expense: ["Diapers", "Clothes", "Doctor", "Childcare"], income: ["Family allowance"] },
  vinted: { expense: ["Shipping", "Stock"], income: ["Flea market 1", "Flea market 2", "Online sales"] },
};

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;

const user = await db.collection("users").findOne({ username });
if (!user) {
  console.error(`No user "${username}".`);
  process.exit(1);
}
const categories = await db.collection("categories").find({ userId: user._id }).toArray();
if (categories.length === 0) {
  console.error("This user has no categories yet — finish onboarding first.");
  process.exit(1);
}

const today = new Date();
const start = new Date(Date.UTC(today.getFullYear(), today.getMonth() - 13, 1));
let inserted = 0;

for (const category of categories) {
  const preset = PRESETS[category.name.toLowerCase()] ?? PRESETS.default;
  const tagIds = { income: [], expense: [] };

  let colorIndex = await db.collection("tags").countDocuments({ userId: user._id, categoryId: category._id });
  for (const type of ["expense", "income"]) {
    for (const name of preset[type]) {
      const color = PALETTE[colorIndex % PALETTE.length];
      const existing = await db.collection("tags").findOne({ userId: user._id, categoryId: category._id, name });
      const id =
        existing?._id ??
        (
          await db.collection("tags").insertOne({
            userId: user._id,
            categoryId: category._id,
            name,
            color,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        ).insertedId;
      if (!existing) colorIndex += 1;
      tagIds[type].push(id);
    }
  }

  const docs = [];
  for (let d = new Date(start); d <= today; d.setUTCDate(d.getUTCDate() + 1)) {
    const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    // ~1 expense every other day, a bit more on weekends.
    const expenses = Math.random() < (date.getUTCDay() % 6 === 0 ? 0.75 : 0.45) ? rand(1, 2) : 0;
    for (let i = 0; i < expenses; i++) {
      docs.push({ type: "expense", amount: rand(250, 9500), date, tagIds: Math.random() < 0.85 ? [pick(tagIds.expense)] : [] });
    }
    // Income: a monthly one on the 1st–3rd, plus occasional extras.
    if (date.getUTCDate() === rand(1, 3) || Math.random() < 0.06) {
      docs.push({ type: "income", amount: rand(3000, 42000), date, tagIds: [pick(tagIds.income)] });
    }
  }

  if (docs.length) {
    const now = new Date();
    await db.collection("transactions").insertMany(
      docs.map((t) => ({ ...t, userId: user._id, categoryId: category._id, note: "", createdAt: now, updatedAt: now })),
    );
    inserted += docs.length;
  }
  console.log(`• ${category.icon} ${category.name}: ${docs.length} transactions`);
}

console.log(`Done — ${inserted} transactions added for @${username}.`);
await mongoose.disconnect();
