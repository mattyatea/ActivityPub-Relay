import type { APRequest } from "@/types/activityPubTypes.ts";
import { signHeaders } from "@/utils/httpSignature.ts";

export async function checkPublicCollection(activity: APRequest) {
    if (activity.object === "https://www.w3.org/ns/activitystreams#Public") return true;
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
        method: 'POST',
        body: JSON.stringify(body),
        headers
    });
    console.log("Activity sent");
    console.log(response);
}

export async function acceptFollow(activity: APRequest, targetInbox: string) {
    const numId = Math.floor(Date.now() / 1000);
    const body: APRequest = {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        id: `https://${process.env.HOSTNAME}/activity/${numId}`,
        type: "Accept",
        actor: "https://" + process.env.HOSTNAME + "/actor",
        object: activity,
    };
    const headers = signHeaders(JSON.stringify(body), targetInbox);
    console.log(headers);
    console.log(body);
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
