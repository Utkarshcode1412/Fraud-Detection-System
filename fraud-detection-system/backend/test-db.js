const { Client } = require("pg");

const client = new Client({
  host: "ep-hidden-smoke-atsvk9ku-pooler.c-9.us-east-1.aws.neon.tech",
  port: 5432,
  database: "neondb",
  user: "neondb_owner",
  password: "YOUR_PASSWORD",
  ssl: {
    rejectUnauthorized: false,
  },
});

client.connect()
.then(() => {
  console.log("✅ Connected");
  return client.end();
})
.catch(console.error);