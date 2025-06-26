import { assign, createMachine } from "xstate"

// Status constants
export const STATUS = {
  OVERVIEW: "overview",
  EVENT_TYPE_SELECTION: "eventTypeSelection",
  ORG_INFO: "organizationInfo",
  SCHOOL_EVENT: "schoolEvent",
  COMMUNITY_EVENT: "communityEvent",
  PENDING_REVIEW: "pendingReview",
  APPROVED: "approved",
  DENIED: "denied",
  REPORTING: "reporting",
  REPORT_PENDING: "reportPending",
  REPORT_APPROVED: "reportApproved",
  REPORT_REVISION: "reportRevision",
  SUBMITTING: "submitting",
  ERROR: "error",
}

// Load persisted form data from localStorage
export const loadPersistedFormData = () => {
  if (typeof window === "undefined") return {}

  try {
    const savedData = localStorage.getItem("eventProposalFormData")
    if (!savedData) {
      console.log('📭 No persisted form data found')
      return {}
    }

    const parsedDataRaw = JSON.parse(savedData)

    // 🔄 LEGACY MIGRATION: Early versions stored the Org-Info section id as
    // "orgInfo".  Normalise it to the canonical "organizationInfo" so the
    // state-machine and the UI are in sync regardless of snapshot age.
    const parsedData = {
      ...parsedDataRaw,
      currentSection: parsedDataRaw.currentSection === 'orgInfo'
        ? 'organizationInfo'
        : parsedDataRaw.currentSection,
    }

    console.log('📖 Loaded persisted form data:', parsedData)

    // Validate that essential fields exist
    if (!parsedData || typeof parsedData !== 'object') {
      console.warn('⚠️ Invalid persisted data format, resetting')
      localStorage.removeItem("eventProposalFormData")
      return {}
    }

    // Ensure minimal required structure
    const validatedData = {
      currentSection: parsedData.currentSection || "overview",
      organizationName: parsedData.organizationName || "",
      organizationTypes: Array.isArray(parsedData.organizationTypes) ? parsedData.organizationTypes : [],
      selectedEventType: parsedData.selectedEventType || "",
      hasActiveProposal: Boolean(parsedData.hasActiveProposal),
      proposalStatus: parsedData.proposalStatus || "draft",
      reportStatus: parsedData.reportStatus || "draft",
      validationErrors: parsedData.validationErrors || {},
      ...parsedData
    }

    console.log('✅ Validated form data:', validatedData)
    return validatedData
  } catch (error) {
    console.error("Error loading persisted form data:", error)
    // Clear corrupted data
    try {
      localStorage.removeItem("eventProposalFormData")
    } catch (clearError) {
      console.error("Error clearing corrupted data:", clearError)
    }
    return {}
  }
}

// Save form data to localStorage
const persistFormData = (formData) => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("eventProposalFormData", JSON.stringify(formData))
  } catch (error) {
    console.error("Error persisting form data:", error)
  }
}

// Clear persisted form data
export const clearPersistedFormData = () => {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem("eventProposalFormData")
  } catch (error) {
    console.error("Error clearing persisted form data:", error)
  }
}

// Create the state machine
export const eventStateMachine = createMachine({
  id: "eventSubmission",
  initial: STATUS.OVERVIEW,
  context: {
    formData: {
      currentSection: STATUS.OVERVIEW,
      organizationName: "",
      organizationTypes: [],
      organizationDescription: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      selectedEventType: "",
      hasActiveProposal: false,
      proposalStatus: "draft",
      reportStatus: "draft",
      validationErrors: {},
      organizationType: "",
      submissionId: null,
      // ✅ PROPOSAL ID FIELDS: Ensure these are always available
      id: null,
      proposalId: null,
      organization_id: null,
    },
    errors: {},
    submissionId: null,
    error: null,
  },
  on: {
    UPDATE_FORM: {
      actions: assign({
        formData: (ctx, evt) => {
          const currentFormData = ctx?.formData || {};
          const eventData = evt?.data || {};
          // Merge new data, ensuring that existing fields are not overwritten with null/undefined
          const merged = { ...currentFormData };
          for (const key in eventData) {
            if (eventData[key] !== null && eventData[key] !== undefined) {
              merged[key] = eventData[key];
            }
          }

          // Persist the robustly merged data to localStorage
          persistFormData(merged);
          return merged;
        },
      }),
    },
    // Add a dedicated event to reset the form state
    RESET_FORM: {
      target: `.${STATUS.OVERVIEW}`,
      actions: assign({
        formData: (context) => {
          clearPersistedFormData();
          return {
            currentSection: STATUS.OVERVIEW,
            organizationName: "",
            organizationTypes: [],
            hasActiveProposal: false,
            proposalStatus: "draft",
            reportStatus: "draft",
            validationErrors: {},
          };
        }
      })
    }
  },
  states: {
    [STATUS.OVERVIEW]: {
      on: {
        START_PROPOSAL: {
          target: STATUS.EVENT_TYPE_SELECTION,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.EVENT_TYPE_SELECTION,
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
        CONTINUE_EDITING: {
          target: STATUS.ORG_INFO,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.ORG_INFO,
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
        VIEW_ACTIVE_PROPOSAL: {
          target: STATUS.PENDING_REVIEW,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.PENDING_REVIEW,
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
        SUBMIT_REPORT: {
          target: STATUS.REPORTING,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.REPORTING,
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
      },
    },
    [STATUS.EVENT_TYPE_SELECTION]: {
      on: {
        SELECT_EVENT_TYPE: {
          target: STATUS.ORG_INFO,
          actions: assign({
            formData: ({ context, event }) => {
              const eventType = event?.eventType || "school"
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.ORG_INFO,
                selectedEventType: eventType,
                organizationType: eventType,
                organizationTypes: [eventType],
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
        PREVIOUS: {
          target: STATUS.OVERVIEW,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.OVERVIEW,
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
      },
    },
    [STATUS.ORG_INFO]: {
      on: {
        NEXT: {
          target: STATUS.SCHOOL_EVENT,
          actions: assign({
            formData: (context, event) => {
              const updatedFormData = {
                ...context.formData,
                ...(event?.data ?? {}), // Merge data from the event payload
                currentSection: STATUS.SCHOOL_EVENT,
              };
              persistFormData(updatedFormData);
              return updatedFormData;
            },
          }),
        },
        NEXT_TO_COMMUNITY: {
          target: STATUS.COMMUNITY_EVENT,
          actions: assign({
            formData: (context, event) => {
              const updatedFormData = {
                ...context.formData,
                ...(event?.data ?? {}), // Merge data from the event payload
                currentSection: STATUS.COMMUNITY_EVENT,
              };
              persistFormData(updatedFormData);
              return updatedFormData;
            },
          }),
        },
        PREVIOUS: {
          target: STATUS.OVERVIEW,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.OVERVIEW,
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
        WITHDRAW: {
          target: STATUS.OVERVIEW,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.OVERVIEW,
                hasActiveProposal: false,
                proposalStatus: "draft",
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
      },
    },
    [STATUS.SCHOOL_EVENT]: {
      on: {
        NEXT: {
          target: STATUS.REPORTING,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.REPORTING,
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
        PREVIOUS: {
          target: STATUS.ORG_INFO,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.ORG_INFO,
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
        WITHDRAW: {
          target: STATUS.OVERVIEW,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.OVERVIEW,
                hasActiveProposal: false,
                proposalStatus: "draft",
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
      },
    },
    [STATUS.COMMUNITY_EVENT]: {
      on: {
        NEXT: {
          target: STATUS.REPORTING,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.REPORTING,
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
        PREVIOUS: {
          target: STATUS.ORG_INFO,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.ORG_INFO,
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
        WITHDRAW: {
          target: STATUS.OVERVIEW,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.OVERVIEW,
                hasActiveProposal: false,
                proposalStatus: "draft",
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
        SUBMIT: {
          target: STATUS.SUBMITTING,
        },
      },
    },
    [STATUS.SUBMITTING]: {
      on: {
        SUBMIT: {
          target: STATUS.PENDING_REVIEW,
          actions: assign({
            formData: ({ context, event }) => {
              // Safely handle event.data which might be undefined
              const submissionId =
                event && event.data && event.data.submissionId ? event.data.submissionId : `event-${Date.now()}`

              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.PENDING_REVIEW,
                submissionId: submissionId,
                hasActiveProposal: true,
                proposalStatus: "pending",
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
            submissionId: ({ event }) => {
              return event && event.data && event.data.submissionId ? event.data.submissionId : `event-${Date.now()}`
            },
          }),
        },
        ERROR: {
          target: STATUS.ERROR,
          actions: assign({
            error: ({ event }) => {
              return event && event.data && event.data.error ? event.data.error : "Unknown error occurred"
            },
          }),
        },
      },
    },
    [STATUS.PENDING_REVIEW]: {
      on: {
        BACK_TO_OVERVIEW: {
          target: STATUS.OVERVIEW,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.OVERVIEW,
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
        APPROVE_PROPOSAL: {
          target: STATUS.APPROVED,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.APPROVED,
                proposalStatus: "approved",
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
        DENY_PROPOSAL: {
          target: STATUS.DENIED,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.DENIED,
                proposalStatus: "denied",
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
      },
    },
    [STATUS.APPROVED]: {
      on: {
        BACK_TO_OVERVIEW: {
          target: STATUS.OVERVIEW,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.OVERVIEW,
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
        SUBMIT_REPORT: {
          target: STATUS.REPORTING,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.REPORTING,
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
      },
    },
    [STATUS.DENIED]: {
      on: {
        BACK_TO_OVERVIEW: {
          target: STATUS.OVERVIEW,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.OVERVIEW,
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
        EDIT_PROPOSAL: {
          target: STATUS.ORG_INFO,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.ORG_INFO,
                proposalStatus: "draft",
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
        WITHDRAW_PROPOSAL: {
          target: STATUS.OVERVIEW,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.OVERVIEW,
                hasActiveProposal: false,
                proposalStatus: "draft",
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
      },
    },
    [STATUS.REPORTING]: {
      on: {
        PREVIOUS: {
          target: STATUS.APPROVED,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.APPROVED,
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
        SUBMIT_REPORT: {
          target: STATUS.REPORT_PENDING,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.REPORT_PENDING,
                reportStatus: "pending",
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
      },
    },
    [STATUS.REPORT_PENDING]: {
      on: {
        BACK_TO_OVERVIEW: {
          target: STATUS.OVERVIEW,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.OVERVIEW,
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
        APPROVE_REPORT: {
          target: STATUS.REPORT_APPROVED,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.REPORT_APPROVED,
                reportStatus: "approved",
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
        REQUEST_REVISION: {
          target: STATUS.REPORT_REVISION,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.REPORT_REVISION,
                reportStatus: "revision",
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
      },
    },
    [STATUS.REPORT_APPROVED]: {
      on: {
        COMPLETE_WORKFLOW: {
          target: STATUS.OVERVIEW,
          actions: assign({
            formData: (context) => {
              // Clear persisted data
              clearPersistedFormData()

              // Return fresh state
              return {
                currentSection: STATUS.OVERVIEW,
                organizationName: "",
                organizationTypes: [],
                hasActiveProposal: false,
                proposalStatus: "draft",
                reportStatus: "draft",
                validationErrors: {},
              }
            },
          }),
        },
      },
    },
    [STATUS.REPORT_REVISION]: {
      on: {
        BACK_TO_OVERVIEW: {
          target: STATUS.OVERVIEW,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.OVERVIEW,
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
        EDIT_REPORT: {
          target: STATUS.REPORTING,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.REPORTING,
                reportStatus: "draft",
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
      },
    },
    [STATUS.ERROR]: {
      on: {
        RETRY: {
          target: STATUS.SUBMITTING,
        },
        BACK_TO_FORM: {
          target: STATUS.COMMUNITY_EVENT,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.COMMUNITY_EVENT,
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
      },
    },
  },
})
