export type APRequest = {
    "@context": string | string[];
    id: string;
    type: "Accept" | "Follow" | "Undo";
    actor: string;
    object: string | {
        "@context": string | string[];
        id: string;
        type: "Accept" | "Follow" | "Undo";
        actor: string;
        object: string | APRequest;
    };
};
export type APActor = {
    "@context": string[] | string;
    id: string;
    inbox: string;
    outbox: string;
    publicKey: {
        publicKeyPem: string;
    }
}
