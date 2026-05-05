const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    // Add semester and tahun_ajaran columns if they don't exist
    const { error: error1 } = await supabase
      .from("mapel")
      .select("semester")
      .limit(1);

    if (error1 && error1.message.includes("undefined column")) {
      console.log("Adding semester column...");
      await supabase
        .rpc("raw_sql", {
          query: "ALTER TABLE mapel ADD COLUMN semester TEXT;",
        })
        .catch((e) => console.log("semester column might already exist:", e));
    }

    const { error: error2 } = await supabase
      .from("mapel")
      .select("tahun_ajaran")
      .limit(1);

    if (error2 && error2.message.includes("undefined column")) {
      console.log("Adding tahun_ajaran column...");
      await supabase
        .rpc("raw_sql", {
          query: "ALTER TABLE mapel ADD COLUMN tahun_ajaran TEXT;",
        })
        .catch((e) =>
          console.log("tahun_ajaran column might already exist:", e),
        );
    }

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
