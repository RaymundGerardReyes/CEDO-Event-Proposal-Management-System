import { createMachine, assign } from "xstate"

// Status constants
export const STATUS = {
  OVERVIEW: "overview",
  ORG_INFO: "orgInfo",
  SCHOOL_EVENT: "schoolEvent",
  COMMUNITY_EVENT: "communityEvent",
  PENDING_REVIEW: "pendingReview",
  APPROVED: "approved",
  DENIED: "denied",
  REPORTING: "reporting",
  REPORT_PENDING: "reportPending",
  REPORT_APPROVED: "reportApproved",
  REPORT_DENIED: "reportDenied",
  SUBMITTING: "submitting",
  ERROR: "error",
}

// Load persisted form data from localStorage
export const loadPersistedFormData = () => {
  if (typeof window === "undefined") return {}

  try {
    const savedData = localStorage.getItem("eventProposalFormData")
    return savedData ? JSON.parse(savedData) : {}
  } catch (error) {
    console.error("Error loading persisted form data:", error)
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
  id: "eventProposal",
  initial: STATUS.OVERVIEW,
  context: {
    formData: {
      currentSection: STATUS.OVERVIEW,
      organizationName: "",
      organizationTypes: [],
      hasActiveProposal: false,
      proposalStatus: "draft",
      reportStatus: "draft",
      validationErrors: {},
    },
    errors: {},
    submissionId: null,
    error: null,
  },
  states: {
    [STATUS.OVERVIEW]: {
      on: {
        START_PROPOSAL: {
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
        UPDATE_FORM: {
          actions: assign({
            formData: (context, event) => {
              // Safely handle event.data which might be undefined
              const eventData = event && event.data ? event.data : {}

              const updatedFormData = {
                ...context.formData,
                ...eventData,
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
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.SCHOOL_EVENT,
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
        UPDATE_FORM: {
          actions: assign({
            formData: (context, event) => {
              // Safely handle event.data which might be undefined
              const eventData = event && event.data ? event.data : {}

              const updatedFormData = {
                ...context.formData,
                ...eventData,
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
        UPDATE_FORM: {
          actions: assign({
            formData: (context, event) => {
              // Safely handle event.data which might be undefined
              const eventData = event && event.data ? event.data : {}

              const updatedFormData = {
                ...context.formData,
                ...eventData,
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
        PREVIOUS: {
          target: STATUS.SCHOOL_EVENT,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.SCHOOL_EVENT,
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
        UPDATE_FORM: {
          actions: assign({
            formData: (context, event) => {
              // Safely handle event.data which might be undefined
              const eventData = event && event.data ? event.data : {}

              const updatedFormData = {
                ...context.formData,
                ...eventData,
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
      },
    },
    [STATUS.SUBMITTING]: {
      on: {
        SUBMIT: {
          target: STATUS.PENDING_REVIEW,
          actions: assign({
            formData: (context, event) => {
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
            submissionId: (_, event) => {
              return event && event.data && event.data.submissionId ? event.data.submissionId : `event-${Date.now()}`
            },
          }),
        },
        ERROR: {
          target: STATUS.ERROR,
          actions: assign({
            error: (_, event) => {
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
        UPDATE_FORM: {
          actions: assign({
            formData: (context, event) => {
              // Safely handle event.data which might be undefined
              const eventData = event && event.data ? event.data : {}

              const updatedFormData = {
                ...context.formData,
                ...eventData,
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
        UPDATE_FORM: {
          actions: assign({
            formData: (context, event) => {
              // Safely handle event.data which might be undefined
              const eventData = event && event.data ? event.data : {}

              const updatedFormData = {
                ...context.formData,
                ...eventData,
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
        UPDATE_FORM: {
          actions: assign({
            formData: (context, event) => {
              // Safely handle event.data which might be undefined
              const eventData = event && event.data ? event.data : {}

              const updatedFormData = {
                ...context.formData,
                ...eventData,
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
        UPDATE_FORM: {
          actions: assign({
            formData: (context, event) => {
              // Safely handle event.data which might be undefined
              const eventData = event && event.data ? event.data : {}

              const updatedFormData = {
                ...context.formData,
                ...eventData,
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
        DENY_REPORT: {
          target: STATUS.REPORT_DENIED,
          actions: assign({
            formData: (context) => {
              const updatedFormData = {
                ...context.formData,
                currentSection: STATUS.REPORT_DENIED,
                reportStatus: "denied",
                validationErrors: {},
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
        UPDATE_FORM: {
          actions: assign({
            formData: (context, event) => {
              // Safely handle event.data which might be undefined
              const eventData = event && event.data ? event.data : {}

              const updatedFormData = {
                ...context.formData,
                ...eventData,
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
        UPDATE_FORM: {
          actions: assign({
            formData: (context, event) => {
              // Safely handle event.data which might be undefined
              const eventData = event && event.data ? event.data : {}

              const updatedFormData = {
                ...context.formData,
                ...eventData,
              }
              persistFormData(updatedFormData)
              return updatedFormData
            },
          }),
        },
      },
    },
    [STATUS.REPORT_DENIED]: {
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
        UPDATE_FORM: {
          actions: assign({
            formData: (context, event) => {
              // Safely handle event.data which might be undefined
              const eventData = event && event.data ? event.data : {}

              const updatedFormData = {
                ...context.formData,
                ...eventData,
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
        UPDATE_FORM: {
          actions: assign({
            formData: (context, event) => {
              // Safely handle event.data which might be undefined
              const eventData = event && event.data ? event.data : {}

              const updatedFormData = {
                ...context.formData,
                ...eventData,
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
