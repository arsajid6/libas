const fs = require('fs');
const path = 'C:/Users/Dell/.gemini/antigravity/brain/5f13112f-bddc-45af-b0b6-8a90c9febbc6/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n').filter(Boolean);
const lastLines = lines.slice(-20);
lastLines.forEach(l => console.log(JSON.parse(l).content || JSON.parse(l).tool_calls));
