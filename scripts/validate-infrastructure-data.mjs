import fs from "node:fs";
import path from "node:path";

const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(scriptDir, "..");
const dataPath = path.join(root, "data", "humanity-infrastructure.json");
const htmlPath = path.join(root, "index.html");
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const html = fs.readFileSync(htmlPath, "utf8");
const errors = [];

const statuses = new Set(["active", "archived", "experimental", "verification pending"]);
const verifications = new Set(["verified", "verified project; thread mapping pending", "verification pending"]);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function fail(message) {
  errors.push(message);
}

function requireString(obj, field, context) {
  if (typeof obj[field] !== "string" || obj[field].trim() === "") {
    fail(`${context}.${field} is required`);
  }
}

function checkUrl(value, context) {
  try {
    const url = new URL(value);
    if (!["http:", "https:", "mailto:"].includes(url.protocol)) {
      fail(`${context} uses unsupported protocol ${url.protocol}`);
    }
  } catch {
    fail(`${context} is not a valid URL: ${value}`);
  }
}

function checkLinks(items, context) {
  if (!Array.isArray(items) || items.length === 0) {
    fail(`${context} must contain at least one link`);
    return;
  }
  items.forEach((link, index) => {
    requireString(link, "label", `${context}[${index}]`);
    requireString(link, "url", `${context}[${index}]`);
    if (link.url) checkUrl(link.url, `${context}[${index}].url`);
  });
}

function checkPeople(items, context) {
  if (!Array.isArray(items) || items.length === 0) {
    fail(`${context} must contain at least one person or maintainer organization`);
    return;
  }
  items.forEach((person, index) => {
    requireString(person, "name", `${context}[${index}]`);
    requireString(person, "role", `${context}[${index}]`);
    requireString(person, "url", `${context}[${index}]`);
    requireString(person, "evidence", `${context}[${index}]`);
    if (person.role.toLowerCase() === "signal source") {
      fail(`${context}[${index}] mixes a signal source into a builder role`);
    }
    if (person.url) checkUrl(person.url, `${context}[${index}].url`);
  });
}

function checkEntry(entry, context, { pending = false } = {}) {
  ["id", "name", "status", "verification", "focusArea", "replacesOrEnables", "lastVerified"].forEach((field) => {
    requireString(entry, field, context);
  });
  if (entry.id && !/^[a-z0-9-]+$/.test(entry.id)) fail(`${context}.id must be kebab-case`);
  if (entry.status && !statuses.has(entry.status)) fail(`${context}.status is not allowed: ${entry.status}`);
  if (entry.verification && !verifications.has(entry.verification)) {
    fail(`${context}.verification is not allowed: ${entry.verification}`);
  }
  if (entry.lastVerified && !datePattern.test(entry.lastVerified)) {
    fail(`${context}.lastVerified must be YYYY-MM-DD`);
  }
  checkLinks(entry.officialLinks, `${context}.officialLinks`);
  checkLinks(entry.evidence, `${context}.evidence`);
  checkPeople(entry.people, `${context}.people`);
  if (pending && entry.verification !== "verification pending") {
    fail(`${context} must use verification pending`);
  }
}

if (!data.meta || typeof data.meta !== "object") {
  fail("meta is required");
} else {
  ["publicLabel", "lastVerified", "siteVersion", "siteLastUpdated", "siteLastUpdatedLabel"].forEach((field) => {
    requireString(data.meta, field, "meta");
  });
  if (!datePattern.test(data.meta.lastVerified || "")) fail("meta.lastVerified must be YYYY-MM-DD");
  if (Number.isNaN(Date.parse(data.meta.siteLastUpdated))) fail("meta.siteLastUpdated must be parseable");
  checkLinks(data.meta.sourceThread, "meta.sourceThread");
  if (!Array.isArray(data.meta.verificationRules) || data.meta.verificationRules.length < 3) {
    fail("meta.verificationRules must contain the tracker rules");
  }
}

const allIds = new Set();
["projects", "signals", "leads"].forEach((collection) => {
  if (!Array.isArray(data[collection])) fail(`${collection} must be an array`);
});

(data.projects || []).forEach((project, index) => {
  checkEntry(project, `projects[${index}]`);
  if (allIds.has(project.id)) fail(`duplicate id: ${project.id}`);
  allIds.add(project.id);
});

(data.leads || []).forEach((lead, index) => {
  checkEntry(lead, `leads[${index}]`, { pending: true });
  requireString(lead, "pendingReason", `leads[${index}]`);
  if (allIds.has(lead.id)) fail(`duplicate id: ${lead.id}`);
  allIds.add(lead.id);
});

(data.signals || []).forEach((signal, index) => {
  ["id", "name", "role", "lastVerified", "note"].forEach((field) => requireString(signal, field, `signals[${index}]`));
  if (signal.role !== "signal source") fail(`signals[${index}].role must be signal source`);
  if (!datePattern.test(signal.lastVerified || "")) fail(`signals[${index}].lastVerified must be YYYY-MM-DD`);
  checkLinks(signal.links, `signals[${index}].links`);
  if (!Array.isArray(signal.signalFor) || signal.signalFor.length === 0) {
    fail(`signals[${index}].signalFor must list related project or lead ids`);
  } else {
    signal.signalFor.forEach((id) => {
      if (!allIds.has(id)) fail(`signals[${index}].signalFor references unknown id: ${id}`);
    });
  }
  if (allIds.has(signal.id)) fail(`duplicate id: ${signal.id}`);
  allIds.add(signal.id);
});

if (!html.includes('id="builders"')) fail("index.html must include the builders section");
if (!html.includes("data/humanity-infrastructure.json")) fail("index.html must render from the tracker data file");

const versionMatch = html.match(/data-site-version="([^"]+)"/);
const updatedMatch = html.match(/data-site-updated="([^"]+)"/);
if (!versionMatch || versionMatch[1] !== data.meta.siteVersion) {
  fail("footer data-site-version must match meta.siteVersion");
}
if (!updatedMatch || updatedMatch[1] !== data.meta.siteLastUpdatedLabel) {
  fail("footer data-site-updated must match meta.siteLastUpdatedLabel");
}

if (errors.length) {
  console.error("Infrastructure tracker validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Validated ${data.projects.length} projects, ${data.signals.length} signals, and ${data.leads.length} pending leads.`);
