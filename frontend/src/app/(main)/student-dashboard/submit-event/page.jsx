import SubmitEventFlow from "./SubmitEventFlow"

export default function SubmitEventPage() {
  return (
    <main className="flex w-full flex-col items-center py-8">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800">Submit a Community Event Proposal</h1>
        <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
          Complete the form below to submit your event proposal for approval. All fields marked with an asterisk (*) are
          required.
        </p>
      </div>

      {/* Render the SubmitEventFlow component directly without any wrappers */}
      <div className="w-full">
        <SubmitEventFlow />
      </div>
    </main>
  )
}
