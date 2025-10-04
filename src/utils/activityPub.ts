import type { APRequest } from "@/types/activityPubTypes.ts";
import { signHeaders } from "@/utils/httpSignature.ts";
import type { Bindings } from "@/server.ts";

const PUBLIC_COLLECTION = "https://www.w3.org/ns/activitystreams#Public";

function normaliseAudienceField(value: string | string[] | undefined): string[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

export function checkPublicCollection(activity: APRequest) {
    if (typeof activity.object === "string" && activity.object === PUBLIC_COLLECTION) {
        return true;
    }

    if (typeof activity.object === "object" && activity.object !== null) {
        const objectTargets = [
            ...normaliseAudienceField(activity.object.to as string | string[] | undefined),
            ...normaliseAudienceField(activity.object.cc as string | string[] | undefined),
            ...normaliseAudienceField(activity.object.bto as string | string[] | undefined),
            ...normaliseAudienceField(activity.object.bcc as string | string[] | undefined),
            ...normaliseAudienceField(activity.object.audience as string | string[] | undefined),
        ];
        if (objectTargets.includes(PUBLIC_COLLECTION)) {
            return true;
        }
    }

    const topLevelTargets = [
        ...normaliseAudienceField(activity.to),
        ...normaliseAudienceField(activity.cc),
        ...normaliseAudienceField(activity.bto),
        ...normaliseAudienceField(activity.bcc),
        ...normaliseAudienceField(activity.audience),
    ];

    return topLevelTargets.includes(PUBLIC_COLLECTION);
}

export async function sendActivity(req: string, body: APRequest, headers: {
    Accept: string;
    "Cache-Control": string;
    Digest: string;
    Signature: string;
    "User-Agent": string;
    Host: string;
    Date: string;
    "Content-Type": string
}) {
    const response = await fetch(req, {
        method: "POST",
        body: JSON.stringify(body),
        headers,
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => "<no response body>");
        throw new Error(`Failed to deliver activity to ${req}: ${response.status} ${response.statusText} ${errorText}`);
    }

    return response;
}

export async function acceptFollow(activity: APRequest, targetInbox: string, env: Bindings) {
    const numId = Math.floor(Date.now() / 1000);
    const body: APRequest = {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        id: `https://${env.HOSTNAME}/activity/${numId}`,
        type: "Accept",
        actor: `https://${env.HOSTNAME}/actor`,
        object: activity,
    };
    const headers = signHeaders(JSON.stringify(body), targetInbox, env);
    await sendActivity(targetInbox, body, headers);
}
/*
export async function follow(x: APActor) {
    const numId = Math.floor(Date.now() / 1000);
    const strInbox = x.inbox;
    const body: APRequest = {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        id: `https://${process.env.HOSTNAME}/activity/${numId}`,
        type: "Follow",
        actor: "https://" + process.env.HOSTNAME + "/actor",
        object: x.id,
    };
    const headers = signHeaders(JSON.stringify(body), strInbox);
    await sendActivity(strInbox, body, headers);
}
*/
