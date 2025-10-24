type AudienceField = string | string[] | undefined;

export interface APActivity {
	'@context': string | string[];
	id: string;
	type: 'Accept' | 'Follow' | 'Undo' | 'Create' | 'Announce' | string;
	actor: string;
	object?:
		| string
		| APActivity
		| (Record<string, unknown> & {
				to?: AudienceField;
				cc?: AudienceField;
				bto?: AudienceField;
				bcc?: AudienceField;
				audience?: AudienceField;
		  });
	to?: AudienceField;
	cc?: AudienceField;
	bto?: AudienceField;
	bcc?: AudienceField;
	audience?: AudienceField;
}

export type APRequest = APActivity;

export type APActor = {
	'@context': string[] | string;
	id: string;
	inbox: string;
	outbox?: string;
	endpoints?: {
		sharedInbox?: string;
	};
	publicKey?: {
		id?: string;
		owner?: string;
		publicKeyPem: string;
	};
};
