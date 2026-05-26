export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

export interface JsonObject {
	[key: string]: JsonValue;
}

export type ResponseTextFormat =
	| {
			type: "json_schema";
			name: string;
			strict?: boolean;
			schema: JsonObject;
	  }
	| {
			type: "json_object";
	  };
