import { Hono } from 'hono';
import type { APRequest } from '@/types/activityPubTypes';
import { acceptFollow, checkPublicCollection } from '@/utils/activityPub';
import { parseHeader, fetchActor, verifySignature } from '@/utils/httpSignature';

// Define the type for our environment bindings.
// This will be used by Hono to type `c.env`.
export type Bindings = {
  DB: D1Database;
  HOSTNAME: string;
  PUBLICKEY: string;
  PRIVATEKEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware to check for required environment variables.
// This ensures the worker doesn't run without essential configuration.
app.use('*', async (c, next) => {
  if (!c.env.HOSTNAME || !c.env.PUBLICKEY || !c.env.PRIVATEKEY || !c.env.DB) {
    console.error('Missing environment variables. Make sure HOSTNAME, PUBLICKEY, PRIVATEKEY are set and the D1 database is bound in wrangler.toml.');
    return c.text('Internal Server Error: Missing configuration', 500);
  }
  await next();
});

// Actor endpoint
app.get('/actor', (c) => {
  return c.json({
    "@context": ["https://www.w3.org/ns/activitystreams"],
    "id": `https://${c.env.HOSTNAME}/actor`,
    "type": "Person",
    "preferredUsername": "relay",
    "inbox": `https://${c.env.HOSTNAME}/inbox`,
    "outbox": `https://${c.env.HOSTNAME}/outbox`,
    "discoverable": true,
    "publicKey": {
      "publicKeyPem": c.env.PUBLICKEY,
      "owner": `https://${c.env.HOSTNAME}/actor`,
      "type": "Key",
      "id": `https://${c.env.HOSTNAME}/actor#main-key`
    }
  }, 200, { "Content-Type": "application/activity+json" });
});

// .well-known/nodeinfo endpoint
app.get('/.well-known/nodeinfo', (c) => {
  return c.json({
    "links": [
      {
        "rel": "http://nodeinfo.diaspora.software/ns/schema/2.1",
        "href": `https://${c.env.HOSTNAME}/nodeinfo/2.1.json`
      }
    ]
  });
});

// .well-known/webfinger endpoint
app.get('/.well-known/webfinger', (c) => {
  return c.json({
    "subject": `acct:relay@${c.env.HOSTNAME}`,
    "links": [
      {
        "rel": "self",
        "type": "application/activity+json",
        "href": `https://${c.env.HOSTNAME}/actor`
      }
    ]
  }, 200, { "Content-Type": "application/jrd+json; charset=UTF-8" });
});

// NodeInfo 2.1 JSON endpoint
app.get('/nodeinfo/2.1.json', (c) => {
  return c.json({
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
  });
});

// .well-known/host-meta endpoint
app.get('/.well-known/host-meta', (c) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
  <Link rel="lrdd" template="https://${c.env.HOSTNAME}/.well-known/webfinger?resource={uri}" />
</XRD>`;
  return c.body(xml, 200, { "Content-Type": "application/xml" });
});

// Inbox endpoint for receiving activities
app.post('/inbox', async (c) => {
  // Clone the request to safely read the body, as it can only be read once.
  const reqClone = c.req.raw.clone();
  const activity: APRequest = await reqClone.json();

  // Pass the original request to verifySignature. Cloning is a precaution.
  if (!await verifySignature(c.req.raw)) {
    return c.text("Unauthorized: Signature verification failed", 401);
  }

  const header = parseHeader(c.req.raw);
  const keyId = header["keyId"];
  const actor = await fetchActor(keyId);

  if (activity.type === "Follow") {
    if (await checkPublicCollection(activity)) {
      const { results: actorExists } = await c.env.DB.prepare("SELECT id FROM actors WHERE id = ?").bind(activity.actor).all();
      if (!actorExists || actorExists.length === 0) {
        await c.env.DB.prepare("INSERT INTO actors (id, publicKey) VALUES (?, ?)").bind(activity.actor, actor.publicKey.publicKeyPem).run();
      }

      const { results: followRequestExists } = await c.env.DB.prepare("SELECT id FROM followRequest WHERE id = ?").bind(activity.id).all();
      if (!followRequestExists || followRequestExists.length === 0) {
        await c.env.DB.prepare("INSERT INTO followRequest (id, actor, object) VALUES (?, ?, ?)")
          .bind(activity.id, activity.actor, typeof activity.object === 'string' ? activity.object : activity.object.id)
          .run();
      }

      await acceptFollow(activity, actor.inbox, c.env);
      return c.text("Accepted", 202);
    }
    return c.text("Bad Request: Follow must be for the public collection", 400);
  }

  if (activity.type === "Undo") {
    const followActivityId = typeof activity.object !== "string" ? activity.object?.id : activity.object;
    if (followActivityId) {
      // Use the D1 binding from the context to perform the delete operations.
      await c.env.DB.prepare("DELETE FROM followRequest WHERE id = ?").bind(followActivityId).run();
      await c.env.DB.prepare("DELETE FROM actors WHERE id = ?").bind(activity.actor).run();
    }
    return c.text("OK", 200);
  }

  return c.text("Not Implemented: Activity type not handled", 501);
});

export default app;