"use client"

// Inspired by react-hot-toast library
import * as React from "react";

// Note: In JavaScript, you don't import types directly like this.
// If ToastActionElement and ToastProps were actual components or objects,
// the import would be: import { ToastActionElement, ToastProps } from "@/components/ui/toast";
// Since they are types, this line is effectively removed in JS for type information.
// You'd rely on documentation or PropTypes if you need runtime type checking.

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
};

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const toastTimeouts = new Map();

// 'dispatch' needs to be defined or passed to addToRemoveQueue if it's used here.
// Assuming 'dispatch' is available in the scope where addToRemoveQueue is called from (e.g., within the reducer or a context).
// For this direct conversion, we'll keep it as is, but in a real scenario, ensure 'dispatch' is accessible.
// Or, more likely, the dispatch call within setTimeout should be managed by the component/hook that owns the dispatch function.
// Let's assume 'dispatch' will be the global one defined later in this file for now.

const addToRemoveQueue = (toastId) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    // Ensure 'dispatch' here refers to the globally defined 'dispatch' function
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state, action) => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
              ...t,
              open: false,
            }
            : t
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default: // It's good practice to have a default case in reducers
      return state;
  }
};

const listeners = [];
let memoryState = { toasts: [] };

// This dispatch function is defined globally in this module.
function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

function toast({ ...props }) {
  const id = genId();

  const update = (updateProps) => // Renamed 'props' to 'updateProps' to avoid conflict
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...updateProps, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]); // Dependency array includes 'state' which might cause re-subscriptions.
  // Usually, for listeners like this, the dependency array might be empty []
  // if listeners.push(setState) should only happen on mount.
  // However, to keep it a direct conversion from your TS:
  // If 'state' itself being in the dependency array is intentional for your logic, keep it.
  // Otherwise, for a typical global listener pattern, you might use an empty array: React.useEffect(() => {...}, []);

  return {
    ...state,
    toast,
    dismiss: (toastId) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { toast, useToast };
