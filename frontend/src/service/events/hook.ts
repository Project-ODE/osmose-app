import { useAppSelector } from "@/service/app.ts";
import { useEffect, useRef } from "react";
import {
  AUX_CLICK_EVENT,
  CLICK_EVENT,
  KEY_DOWN_EVENT,
  MOUSE_DOWN_EVENT,
  MOUSE_MOVE_EVENT,
  MOUSE_UP_EVENT
} from "@/service/events/event.ts";

export const useLoadEventService = () => {
  const areKbdShortcutsEnabled = useAppSelector(state => state.event.areKbdShortcutsEnabled);
  const areKbdShortcutsEnabledRef = useRef<boolean>(areKbdShortcutsEnabled);

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown.bind(this));
    document.addEventListener("mousedown", onMouseDown.bind(this));
    document.addEventListener("mousemove", onMouseMove.bind(this));
    document.addEventListener("mouseup", onMouseUp.bind(this));
    document.addEventListener("click", onClick.bind(this));
    document.addEventListener("auxclick", onAuxClick.bind(this));

    return () => {
      document.removeEventListener("keydown", onKeyDown.bind(this));
      document.removeEventListener("mousedown", onMouseDown.bind(this));
      document.removeEventListener("mousemove", onMouseMove.bind(this));
      document.removeEventListener("mouseup", onMouseUp.bind(this));
      document.removeEventListener("click", onClick.bind(this));
      document.removeEventListener("auxclick", onAuxClick.bind(this));
    }
  }, []);

  useEffect(() => {
    areKbdShortcutsEnabledRef.current = areKbdShortcutsEnabled;
  }, [areKbdShortcutsEnabled]);

  function onKeyDown(event: KeyboardEvent) {
    if (!areKbdShortcutsEnabledRef.current) return;
    KEY_DOWN_EVENT.emit(event);
  }

  function onMouseDown(event: MouseEvent) {
    MOUSE_DOWN_EVENT.emit(event);
  }

  function onMouseMove(event: MouseEvent) {
    MOUSE_MOVE_EVENT.emit(event);
  }

  function onMouseUp(event: MouseEvent) {
    MOUSE_UP_EVENT.emit(event);
  }

  function onClick(event: MouseEvent) {
    CLICK_EVENT.emit(event);
  }

  function onAuxClick(event: MouseEvent) {
    AUX_CLICK_EVENT.emit(event);
  }
}
