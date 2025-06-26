import EnhancedLoadingPage from './reporting/components/EnhancedLoadingPage'

export default function DraftLoading() {
  return (
    <EnhancedLoadingPage
      message="Loading Event Submission..."
      showProgress={true}
      estimatedTime={10000}
    />
  )
}
