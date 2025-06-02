// components/ui/use-toast.js
"use client";

import * as React from "react"; // Assuming React is used if this were a full hook

// Note: The original .ts file was mostly commented out.
// This is a conceptual conversion of the commented TypeScript structure to JavaScript.

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000; // This seems unusually long

// Removed actionTypes constant object as it's used within the reducer

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const toastTimeouts = new Map();

// This dispatch function would be defined if the reducer logic is fully implemented
// let dispatch; 

const addToRemoveQueue = (toastId, dispatchFn) => { // dispatchFn to avoid conflict if dispatch is global
  if (toastTimeouts.has(toastId)) return;
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatchFn({ type: "REMOVE_TOAST", toastId: toastId }); // Changed actionTypes.REMOVE_TOAST
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(toastId, timeout);
};

function toastReducer(state, action) { // Renamed to avoid conflict with potential global reducer
  switch (action.type) {
    case "ADD_TOAST": // Changed actionTypes.ADD_TOAST
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case "UPDATE_TOAST": // Changed actionTypes.UPDATE_TOAST
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };
    case "DISMISS_TOAST": { // Changed actionTypes.DISMISS_TOAST
      const { toastId } = action;
      // The dispatch function here would need to be passed correctly or accessed from context
      const dispatchFn = action.dispatch;
      if (toastId) {
        addToRemoveQueue(toastId, dispatchFn);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id, dispatchFn);
        });
      }
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined ? { ...t, open: false } : t
        ),
      };
    }
    case "REMOVE_TOAST": // Changed actionTypes.REMOVE_TOAST
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

const ToastContext = React.createContext(null); // Initialize with null or a default shape

export function ToastProvider({ children }) {
  const [state, dispatch] = React.useReducer(toastReducer, { toasts: [] });

  // The actual dispatch function for addToRemoveQueue needs to be correctly scoped or passed.
  // For simplicity, I'm assuming `dispatch` from useReducer is accessible.
  // In the original code, `action.dispatch` was passed to `addToRemoveQueue` inside `DISMISS_TOAST`.

  const customToast = (props) => { // Renamed from toast to avoid conflict with the export
    const id = genId();
    dispatch({ type: "ADD_TOAST", toast: { ...props, id, open: true, onOpenChange: (open) => { if (!open) dismiss(id); } } }); // Pass dispatch
    return {
      id,
      dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id, dispatch }), // Pass dispatch
      update: (newProps) => dispatch({ type: "UPDATE_TOAST", toast: { ...newProps, id } }),
    };
  };

  const dismiss = (toastId) => dispatch({ type: "DISMISS_TOAST", toastId, dispatch }); // Pass dispatch

  return (
    <ToastContext.Provider value={{ ...state, toast: customToast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (context === undefined) { // Check for undefined as context can be null initially
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}