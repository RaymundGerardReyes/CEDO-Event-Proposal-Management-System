// Converted from TypeScript to React JS (JavaScript)
// NOTE: If you are using this file as .ts, please rename it to .js for React JS compatibility.
// The following code is for use in a .js file, not .ts.

/*
"use client";

import React, { useEffect, useReducer, useContext } from "react";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

const ToastContext = React.createContext({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
});

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
};

const toastTimeouts = new Map();

const addToRemoveQueue = (toastId, dispatch) => {
  if (toastTimeouts.has(toastId)) return;
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: actionTypes.REMOVE_TOAST, toastId });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(toastId, timeout);
};

function reducer(state, action) {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };
    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;
      if (toastId) {
        addToRemoveQueue(toastId, action.dispatch);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id, action.dispatch);
        });
      }
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined ? { ...t, open: false } : t
        ),
      };
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return { ...state, toasts: [] };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state;
  }
}

export function ToastProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { toasts: [] });

  const toast = (props) => {
    const id = genId();
    dispatch({ type: actionTypes.ADD_TOAST, toast: { ...props, id, open: true, onOpenChange: (open) => { if (!open) dismiss(id); } } });
    return {
      id,
      dismiss: () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id, dispatch }),
      update: (newProps) => dispatch({ type: actionTypes.UPDATE_TOAST, toast: { ...newProps, id } }),
    };
  };

  const dismiss = (toastId) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId, dispatch });

  return (
    <ToastContext.Provider value={{ ...state, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
*/

// Please move this code to use-toast.js and remove this .ts file for React JS only projects.
