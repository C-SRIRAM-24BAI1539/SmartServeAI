
const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";

const SYSTEM_PROMPT = `
You classify home-service requests for SmartServe AI.

Understand the actual fault, not just the object mentioned.
Users may have incorrect grammar, spelling mistakes, or incomplete sentences.

Supported categories:
"plumbing", "electrical", "ac-servicing", "carpentry",
"appliance-repair", "other", "none".

Choose exactly one faultType from:
"remote_pairing",
"water_flow",
"insufficient_heating",
"ac_not_cooling",
"ac_water_leak",
"electrical_fault",
"plumbing_fault",
"carpentry_fault",
"appliance_fault",
"routine_maintenance",
"unknown".

CLASSIFICATION RULES:

1. An AC remote that is not connecting, pairing, or communicating
is an electronics/control-connection problem.
Use faultType "remote_pairing" and category "appliance-repair".
Do NOT classify it as AC cooling repair unless the user reports a
cooling problem too.

2. A water heater/geyser with weak water flow, blocked water outlet,
or a water supply problem is a plumbing problem.
Use faultType "water_flow" and category "plumbing".

3. A water heater/geyser that does not heat enough or does not heat
at all has a heating/electrical/appliance fault.
Use faultType "insufficient_heating" and category "electrical"
unless the user clearly describes a different fault.

4. An AC that does not cool, blows hot air, or has weak cooling:
faultType "ac_not_cooling", category "ac-servicing".

5. Water leaking from an AC:
faultType "ac_water_leak", category "ac-servicing".

6. General electrical faults, faulty switches, or power interruptions:
faultType "electrical_fault", category "electrical".

7. General pipe, tap, drainage, or household water leaks:
faultType "plumbing_fault", category "plumbing".

8. General appliance faults:
faultType "appliance_fault", category "appliance-repair".

9. Routine AC maintenance:
faultType "routine_maintenance", category "ac-servicing".

Examples:
"Remote and AC not connecting"
=> remote_pairing, appliance-repair.

"My geyser has very low water flow"
=> water_flow, plumbing.

"My water heater is not heating enough"
=> insufficient_heating, electrical.

"My AC is not cooling"
=> ac_not_cooling, ac-servicing.

"Water is leaking from my AC"
=> ac_water_leak, ac-servicing.

"I got a cold"
=> not a home service, category none.

"Tell me a joke"
=> not a home service, category none.

"Something is burning and smoke is coming from my switch"
=> possible electrical emergency.

SAFETY:
For electric shocks, smoke, fire, gas leaks, or similar hazards,
prioritize immediate safety guidance over booking recommendations.
Do not recommend ordinary service booking for these hazards.
Do not diagnose human-health conditions.

Do not invent services or claim providers are available.
The application checks the actual service database separately.
If intent is unclear, set needsClarification to true.
For unrelated requests, use problemType "unknown" and category "none".
Use an empty safetyWarning when no special warning is needed.
Return ONLY valid JSON.

Return this structure:
{
  "isHomeService": true,
  "problemType": "concise_snake_case_identifier",
  "faultType": "one_allowed_fault_type",
  "serviceCategory": "one_allowed_category",
  "affectedItem": "item involved",
  "issue": "specific fault",
  "confidence": 0.9,
  "needsClarification": false,
  "userMessage": "short natural response",
  "safetyWarning": ""
}
`;

const allowedCategories = new Set([
  "plumbing",
  "electrical",
  "ac-servicing",
  "carpentry",
  "appliance-repair",
  "other",
  "none",
]);

const allowedFaultTypes = new Set([
  "remote_pairing",
  "water_flow",
  "insufficient_heating",
  "ac_not_cooling",
  "ac_water_leak",
  "electrical_fault",
  "plumbing_fault",
  "carpentry_fault",
  "appliance_fault",
  "routine_maintenance",
  "unknown",
]);

export async function classifyRequest(description) {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      format: "json",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: description },
      ],
      options: { temperature: 0.1 },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(
      `Ollama request failed with status ${response.status}. ` +
      "Check that Ollama is running and the selected model is installed."
    );
  }

  const result = await response.json();
  const content = result.message?.content;

  if (!content) {
    throw new Error("Ollama returned an empty classification.");
  }

  let parsed;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Ollama returned an invalid classification response.");
  }

  const isHomeService = parsed.isHomeService === true;

  const serviceCategory = allowedCategories.has(parsed.serviceCategory)
    ? parsed.serviceCategory
    : "none";

  const faultType = allowedFaultTypes.has(parsed.faultType)
    ? parsed.faultType
    : "unknown";

  return {
    isHomeService,
    problemType:
      typeof parsed.problemType === "string"
        ? parsed.problemType
        : "unknown",
    faultType,
    serviceCategory: isHomeService ? serviceCategory : "none",
    affectedItem:
      typeof parsed.affectedItem === "string"
        ? parsed.affectedItem
        : "",
    issue:
      typeof parsed.issue === "string"
        ? parsed.issue
        : "",
    confidence: Math.max(
      0,
      Math.min(1, Number(parsed.confidence) || 0)
    ),
    needsClarification: parsed.needsClarification === true,
    userMessage:
      typeof parsed.userMessage === "string" &&
      parsed.userMessage.trim()
        ? parsed.userMessage.trim()
        : "Please describe the problem a little more clearly.",
    safetyWarning:
      typeof parsed.safetyWarning === "string"
        ? parsed.safetyWarning
        : "",
    method: "ollama-llm",
  };
}
