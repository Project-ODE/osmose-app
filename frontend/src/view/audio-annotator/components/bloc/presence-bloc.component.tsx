import React, { useEffect, useMemo, useRef } from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import { TooltipComponent } from "../tooltip.component.tsx";
import { DEFAULT_COLOR } from "@/consts/colors.const.tsx";
import { AlphanumericKeys } from "@/consts/shorcuts.const.tsx";
import Tooltip from "react-bootstrap/Tooltip";
import { confirm } from "@/view/global-components";
import { useAppDispatch, useAppSelector } from '@/service/app';
import { addPresenceResult, focusLabel, getPresenceLabels, removePresence } from '@/service/annotator';
import { disableShortcuts, enableShortcuts, KEY_DOWN_EVENT } from "@/service/events";
import { useAnnotator } from "@/service/annotator/hook.ts";


export const PresenceBloc: React.FC = () => {
  const {
    label_set,
  } = useAnnotator();

  const {
    results,
    focusedLabel,
    labelColors
  } = useAppSelector(state => state.annotator);
  const dispatch = useAppDispatch()

  const _focused = useRef<string | undefined>(focusedLabel);
  useEffect(() => {
    _focused.current = focusedLabel;
  }, [ focusedLabel ]);
  const presenceLabels = useMemo(() => getPresenceLabels(results), [ results ]);

  useEffect(() => {
    KEY_DOWN_EVENT.add(onKbdEvent);
    return () => {
      KEY_DOWN_EVENT.remove(onKbdEvent);
    }
  }, []);

  function onKbdEvent(event: KeyboardEvent) {
    if (!label_set) return;
    const active_alphanumeric_keys = AlphanumericKeys[0].slice(0, label_set.labels.length);

    if (event.key === "'") {
      event.preventDefault();
    }

    for (const i in active_alphanumeric_keys) {
      if (event.key !== AlphanumericKeys[0][i] && event.key !== AlphanumericKeys[1][i]) continue;

      const calledLabel = label_set.labels[i];
      if (_focused.current === calledLabel) continue;
      if (!presenceLabels.includes(calledLabel)) {
        dispatch(addPresenceResult({ label: calledLabel, focus: false }));
      }
      dispatch(focusLabel(calledLabel))
    }
  }

  const toggle = async (label: string) => {
    if (presenceLabels.includes(label)) {
      // Remove presence
      if (results?.find(a => a.label === label)) {
        // if annotations exists with this label: wait for confirmation
        dispatch(disableShortcuts())
        const response = await confirm(`You are about to remove ${ results.filter(r => r.label === label).length } annotations using "${ label }" label. Are you sure ?`, `Remove "${ label }" annotations`);
        dispatch(enableShortcuts())
        if (!response) return;
      }
      dispatch(removePresence(label));
    } else {
      // Add presence
      dispatch(addPresenceResult({ label }));
    }
  }

  return (
    <div className="card ml-2 flex-grow-1 mini-content">
      <h6 className="card-header text-center">Presence / Absence</h6>
      <div className="card-body">
        <ul className="presence-absence-columns">
          { label_set?.labels.map((label, key) => (
            <li className="form-check tooltip-wrap" key={ `tag-${ key.toString() }` }>
              <input id={ `tags_key_checkbox_shortcuts_${ key.toString() }` }
                     className="form-check-input"
                     type="checkbox"
                     onChange={ () => toggle(label) }
                     checked={ presenceLabels.includes(label) }/>

              <OverlayTrigger overlay={ <Tooltip><TooltipComponent id={ key }/></Tooltip> } placement="top">
                <label className="form-check-label" htmlFor={ `tags_key_checkbox_shortcuts_${ key.toString() }` }
                       style={ { color: labelColors[label] ?? DEFAULT_COLOR } }>
                  { label }
                </label>
              </OverlayTrigger>
            </li>
          )) }
        </ul>
      </div>
    </div>
  )
}
