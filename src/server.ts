import { serve } from "bun";
import { Database } from "bun:sqlite";
import type { APRequest } from "@/types/activityPubTypes.ts";
import { acceptFollow, checkPublicCollection } from "@/utils/activityPub.ts";
import { parseHeader, fetchActor, verifySignature } from "@/utils/httpSignature.ts";

if (!process.env.HOSTNAME || !process.env.PUBLICKEY || !process.env.DB_FILE) {
    throw new Error("Missing environment variables");
}
const db = initializeDatabase(process.env.DB_FILE);

// Define the server
const server = serve({
  port: 3000,
  hostname: '0.0.0.0',
  fetch: handleRequest
});

console.log(`Listening on https://${server.hostname}:${server.port}`);

// Function to initialize the database
function initializeDatabase(dbFile: string) {
  const database = new Database(dbFile, { create: true });
  database.run("CREATE TABLE IF NOT EXISTS actors (id TEXT PRIMARY KEY, publicKey TEXT)");
  database.run("CREATE TABLE IF NOT EXISTS followRequest (id TEXT PRIMARY KEY, actor TEXT, object TEXT)");
  return database;
}

// Function to handle incoming requests
async function handleRequest(req: Request) {
  const url = new URL(req.url);

  if (url.pathname === "/actor") {
    return handleActorRequest();
  }

  if (url.pathname === '/.well-known/nodeinfo') {
    return handleNodeInfoRequest();
  }

  if (url.pathname === "/.well-known/webfinger") {
    return handleWebFingerRequest();
  }

  if (url.pathname === "/nodeinfo/2.1.json") {
    return handleNodeInfoJsonRequest();
  }

  if (url.pathname === "/.well-known/host-meta") {
    return handleHostMetaRequest();
  }

  if (url.pathname === "/inbox" && req.method === "POST") {
    return handleInboxRequest(req);
  }

  return new Response("Not Found", { status: 404 });
}

// Handlers for specific endpoints
function handleActorRequest() {
  return new Response(JSON.stringify({
    "@context": ["https://www.w3.org/ns/activitystreams"],
    "id": `https://${process.env.HOSTNAME}/actor`,
    "type": "Person",
    "preferredUsername": "relay",
    "inbox": `https://${process.env.HOSTNAME}/inbox`,
    "outbox": `https://${process.env.HOSTNAME}/outbox`,
    "discoverable": true,
    "publicKey": {
      "publicKeyPem": process.env.PUBLICKEY,
      "owner": `https://${process.env.HOSTNAME}/actor`,
      "type": "Key",
      "id": `https://${process.env.HOSTNAME}/actor#main-key`
    }
  }), {
    headers: { "Content-Type": "application/activity+json" }
  });
}

function handleNodeInfoRequest() {
  return new Response(JSON.stringify({
    "links": [
      {
        "rel": "http://nodeinfo.diaspora.software/ns/schema/2.1",
        "href": `https://${process.env.HOSTNAME}/nodeinfo/2.1.json`
      }
    ]
  }));
}

function handleWebFingerRequest() {
  return new Response(JSON.stringify({
    "subject": `acct:relay@${process.env.HOSTNAME}`,
    "links": [
      {
        "rel": "self",
        "type": "application/activity+json",
        "href": `https://${process.env.HOSTNAME}/actor`
      }
    ]
  }), {
    headers: { "Content-Type": "application/jrd+json", "charset": "UTF-8" }
  });
}

function handleNodeInfoJsonRequest() {
  return new Response(JSON.stringify({
    "openRegistrations": false,
    "protocols": ['activitypub'],
    "software": {
      "name": "nanasi-apps.xyz Relay Service",
      "version": "0.0.1"
    },
    "usage": {
      "users": {
        "total": 1,
      }
    },
    "services": {
      "inbound": [],
      "outbound": [],
    },
    "version": "2.1",
  }));
}

function handleHostMetaRequest() {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
  <Link rel="lrdd" template="https://${process.env.HOSTNAME}/.well-known/webfinger?resource={uri}" />
</XRD>`, {
    headers: { "Content-Type": "application/xml" }
  });
}

// Function to handle inbox requests
async function handleInboxRequest(req: Request) {
  const bodyText = await req.text();
  const activity: APRequest = JSON.parse(bodyText);
  const header = parseHeader(req);
  const keyId = header["keyId"];
  const actor = await fetchActor(keyId);

  if (!await verifySignature(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (activity.type === "Follow") {
    return handleFollowRequest(activity, actor);
  }

  if (activity.type === "Undo") {
    return handleUndoRequest(activity);
  }

  return new Response("Not Found", { status: 404 });
}

// Function to handle follow requests
async function handleFollowRequest(activity: APRequest, actor: any) {
  if (await checkPublicCollection(activity)) {
    const actorExists = db.query("SELECT * FROM actors WHERE id = $id").all({ $id: activity.actor });
    if (actorExists.length === 0) {
      db.run("INSERT INTO actors (id, publicKey) VALUES (?, ?)", [activity.actor, actor.publicKey.publicKeyPem]);
    }
    const objectExists = db.query("SELECT * FROM actors WHERE id = $id").all({ $id: activity.id });
    if (objectExists.length === 0) {
      db.run("INSERT INTO actors (id, publicKey) VALUES (?, ?)", [activity.id, actor.publicKey.publicKeyPem]);
    }
    await acceptFollow(activity, actor.inbox);
    return new Response("Accepted", { status: 202 });
  }
  return new Response("Bad Request", { status: 400 });
}

// Function to handle undo requests
function handleUndoRequest(activity: APRequest) {
  const id = typeof activity.object !== "string" ? activity.object?.id : activity.object;
  db.query("DELETE FROM followRequest WHERE id = $id").all({ $id: id });
  return new Response("OK", { status: 200 });
}
