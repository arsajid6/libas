const fs = require('fs');
const path = 'C:/Users/Dell/.gemini/antigravity/brain/5f13112f-bddc-45af-b0b6-8a90c9febbc6/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n').filter(Boolean);

console.log("--- PAST USER INPUTS ---");
lines.forEach(l => {
  const parsed = JSON.parse(l);
  if (parsed.type === "USER_INPUT") {
    console.log(parsed.content);
  }
});
