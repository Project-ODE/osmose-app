import { Signal } from "signal-ts";

export const KEY_DOWN_EVENT: Signal<KeyboardEvent> = new Signal<KeyboardEvent>();

export const MOUSE_DOWN_EVENT: Signal<MouseEvent> = new Signal<MouseEvent>();
export const MOUSE_MOVE_EVENT: Signal<MouseEvent> = new Signal<MouseEvent>();
export const MOUSE_UP_EVENT: Signal<MouseEvent> = new Signal<MouseEvent>();
export const MOUSE_LEAVE_EVENT: Signal<MouseEvent> = new Signal<MouseEvent>();

export const CLICK_EVENT: Signal<Event> = new Signal<Event>();
export const AUX_CLICK_EVENT: Signal<Event> = new Signal<Event>();