import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ChatMessage {
    id: string;
    username: string;
    isSystem: boolean;
    text: string;
    isForced: boolean;
    isBigMessage: boolean;
    timestamp: Time;
    isBroadcast: boolean;
    isBot: boolean;
}
export type Time = bigint;
export interface backendInterface {
    getMessages(since: Time): Promise<Array<ChatMessage>>;
    postMessage(msg: ChatMessage): Promise<void>;
}
