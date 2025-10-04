import {Hono} from 'hono';
import type {APRequest} from '@/types/activityPubTypes';
import {parseHeader, fetchActor, verifySignature} from '@/utils/httpSignature';
import {followActivity} from "@/activity/follow.ts";
import {undoActivity} from "@/activity/undo.ts";
import {relayActivity} from "@/activity/relay.ts";

export type Bindings = {
    DB: D1Database;
    HOSTNAME: string;
    PUBLICKEY: string;
    PRIVATEKEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', async (c, next) => {
    if (!c.env.HOSTNAME || !c.env.PUBLICKEY || !c.env.PRIVATEKEY || !c.env.DB) {
        console.error('Missing environment variables. Make sure HOSTNAME, PUBLICKEY, PRIVATEKEY are set and the D1 database is bound in wrangler.toml.');
        return c.text('Internal Server Error: Missing configuration', 500);
    }
    await next();
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
        const followActivityResult = await followActivity(activity, actor, c);
        if (followActivityResult) {
            return c.text("Accepted", 202);
        } else {
            return c.text("Bad Request: Follow handling failed", 400);
        }
    }

    if (activity.type === "Undo") {
        const undoActivityResult = await undoActivity(activity, c);
        if (undoActivityResult) {
            return c.text("OK", 200);
        } else {
            return c.text("Bad Request: Undo handling failed", 400);
        }
    }

    if (activity.type === "Create" || activity.type === "Announce") {
        const relayResult = await relayActivity(activity, c);

        if (!relayResult.success) {
            if (relayResult.relayedCount === 0 && relayResult.failureCount === 0) {
                return c.text("Accepted: Activity is not public or no followers registered", 202);
            }
        }

        return c.text(`Accepted: Relayed to ${relayResult.relayedCount} follower(s)`, 202);
    }

    return c.text("Not Implemented: Activity type not handled", 501);
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
    }, 200, {"Content-Type": "application/activity+json"});
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
    }, 200, {"Content-Type": "application/jrd+json; charset=UTF-8"});
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
    return c.body(xml, 200, {"Content-Type": "application/xml"});
});

export default app;