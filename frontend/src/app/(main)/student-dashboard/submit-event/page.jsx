"use client"

import { useEffect, useState, Suspense } from "react"
import SubmitEventFlow from "./SubmitEventFlow"

// 🔧 DEBUG: Proposal ID Recovery Component
const ProposalIdDebugger = () => {
  const checkProposalIdRecovery = () => {
    console.log('🔧 DEBUG: Checking proposal ID recovery...');

    if (typeof window !== 'undefined') {
      const storageKeys = [
        'eventProposalFormData',
        'cedoFormData',
        'formData',
        'submitEventFormData'
      ];

      storageKeys.forEach(key => {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            console.log(`📋 ${key}:`, {
              organizationName: parsed.organizationName,
              contactEmail: parsed.contactEmail,
              id: parsed.id,
              proposalId: parsed.proposalId,
              organization_id: parsed.organization_id,
              keys: Object.keys(parsed)
            });
          }
        } catch (error) {
          console.error(`Failed to check ${key}:`, error);
        }
      });
    }
  };

  const injectTestProposalId = () => {
    if (typeof window !== 'undefined') {
      const existingData = localStorage.getItem('eventProposalFormData');
      if (existingData) {
        try {
          const parsed = JSON.parse(existingData);
          const updatedData = {
            ...parsed,
            id: 88,
            proposalId: 88,
            organization_id: 88,
            currentSection: 'reporting' // Force to Section 5
          };

          localStorage.setItem('eventProposalFormData', JSON.stringify(updatedData));
          console.log('✅ Injected test proposal ID 88');

          // Reload the page to apply changes
          window.location.reload();
        } catch (error) {
          console.error('Failed to inject proposal ID:', error);
        }
      }
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm">
      <h3 className="text-sm font-bold text-gray-800 mb-2">🔧 Debug Tools</h3>
      <div className="space-y-2">
        <button
          onClick={checkProposalIdRecovery}
          className="w-full text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
        >
          Check Proposal ID
        </button>
        <button
          onClick={injectTestProposalId}
          className="w-full text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
        >
          Inject Test ID (88)
        </button>
      </div>
    </div>
  );
};

export default function SubmitEventPage() {
  const [sidebarState, setSidebarState] = useState({
    collapsed: false,
    isMobile: false,
    width: 288 // Default desktop expanded width
  })

  // Listen for sidebar state changes
  useEffect(() => {
    const handleSidebarToggle = (event) => {
      console.log("SubmitEventPage: Received sidebar-toggle event", event.detail)
      setSidebarState(event.detail)
    }

    // Check if we're on mobile
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768
      setSidebarState(prev => ({
        ...prev,
        isMobile,
        width: isMobile ? 0 : (prev.collapsed ? 80 : 288)
      }))
    }

    // Initial check
    checkMobile()

    // Listen for sidebar events
    window.addEventListener("sidebar-toggle", handleSidebarToggle)
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("sidebar-toggle", handleSidebarToggle)
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  // Calculate layout values based on sidebar state
  const getLayoutStyles = () => {
    if (sidebarState.isMobile) {
      return {
        marginLeft: '0',
        paddingTop: '5rem', // Space for mobile menu button
        paddingLeft: '1rem',
        paddingRight: '1rem'
      }
    }

    return {
      marginLeft: sidebarState.collapsed ? '5rem' : '18rem',
      paddingTop: '2rem',
      paddingLeft: '2rem',
      paddingRight: '2rem'
    }
  }

  const layoutStyles = getLayoutStyles()

  return (
    <div
      className="min-h-screen bg-gray-50 transition-all duration-500 ease-out"
      style={{
        marginLeft: layoutStyles.marginLeft,
        paddingTop: layoutStyles.paddingTop,
        paddingLeft: layoutStyles.paddingLeft,
        paddingRight: layoutStyles.paddingRight,
        paddingBottom: '2rem'
      }}
    >
      {/* Header Section */}
      <header className="mb-8">
        <div className="max-w-4xl">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-cedo-blue mb-3 leading-tight">
            Submit a Community Event Proposal
          </h1>
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg leading-relaxed max-w-3xl">
            Complete the form below to submit your event proposal for approval. All fields marked with an asterisk (*) are
            required.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <SubmitEventFlow />
        </div>
      </main>

      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-3 rounded-lg z-50 max-w-xs">
          <div>Sidebar State:</div>
          <div>Collapsed: {sidebarState.collapsed.toString()}</div>
          <div>Mobile: {sidebarState.isMobile.toString()}</div>
          <div>Width: {sidebarState.width}px</div>
          <div>MarginLeft: {layoutStyles.marginLeft}</div>
        </div>
      )}
    </div>
  )
}
