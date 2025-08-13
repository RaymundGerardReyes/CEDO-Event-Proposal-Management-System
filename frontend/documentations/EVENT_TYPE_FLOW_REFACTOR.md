# Event Type Flow Refactor - Comprehensive Documentation

## 🎯 **Overview**

This refactor implements direct routing based on event type selection, eliminating the need for a separate organization page and providing a more streamlined user experience.

## 🔄 **Before vs After**

### **Before (Old Flow):**
```
Event Type Selection → Organization Page → School Event OR Community Event
```

### **After (New Flow):**
```
Event Type Selection → Direct to School Event OR Community Event (with embedded organization collection)
```

## 📁 **Files Modified**

### **1. Event Type Selection**
- **File:** `frontend/src/app/main/student-dashboard/submit-event/[draftId]/event-type/page.jsx`
- **Changes:** Updated routing logic to direct users to appropriate sections based on event type

### **2. School Event Page**
- **File:** `frontend/src/app/main/student-dashboard/submit-event/[draftId]/school-event/page.jsx`
- **Changes:** Added organization information collection step before event details

### **3. Community Event Page**
- **File:** `frontend/src/app/main/student-dashboard/submit-event/[draftId]/community-event/page.jsx`
- **Changes:** Added organization information collection step before event details

### **4. Shared Organization Component**
- **File:** `frontend/src/app/main/student-dashboard/submit-event/[draftId]/shared/OrganizationSection.jsx`
- **New:** Reusable component for collecting organization information

## 🚀 **New Flow Details**

### **Step 1: Event Type Selection**
- User selects "School-Based Event" or "Community-Based Event"
- System saves the selection and updates user's `organization_type`
- **Direct routing** based on selection:
  - `school-based` → `/school-event`
  - `community-based` → `/community-event`

### **Step 2: Organization Information Collection**
- **Embedded** in both school-event and community-event pages
- Collects required organization details:
  - Organization Name
  - Organization Description
  - Contact Person
  - Contact Email
  - Contact Phone
- Auto-fills from user profile when available
- Validates required fields before proceeding

### **Step 3: Event Details Collection**
- **School Event:** Section3_SchoolEvent component
- **Community Event:** Section4_CommunityEvent component
- Collects event-specific information and files

### **Step 4: Reporting**
- Both flows converge to the reporting section
- Final submission and status tracking

## 🔧 **Technical Implementation**

### **Routing Logic (Event Type Page)**
```javascript
// Direct routing based on event type
let targetRoute;
if (mappedType === 'community-based') {
    targetRoute = `/student-dashboard/submit-event/${draftId}/community-event`;
} else if (mappedType === 'school-based') {
    targetRoute = `/student-dashboard/submit-event/${draftId}/school-event`;
} else {
    targetRoute = `/student-dashboard/submit-event/${draftId}/organization`; // fallback
}
```

### **Multi-Step Pages (School/Community Event)**
```javascript
const [currentStep, setCurrentStep] = useState('organization'); // 'organization' or 'event'

// Render organization section first, then event details
if (currentStep === 'organization') {
    return <OrganizationSection ... />;
}

// Render event details section
return <Section3_SchoolEvent ... />;
```

### **Data Management**
- **Combined Data:** Organization and event data are combined in form state
- **Sectioned Saving:** Data is saved to appropriate sections based on current step
- **Auto-save:** Debounced auto-save for both organization and event data

## 🧪 **Testing**

### **Test Scripts Available:**
1. **`frontend/test-new-flow.js`** - Comprehensive test of the new flow
2. **`frontend/browser-test.js`** - Browser console test for event type selection
3. **`frontend/comprehensive-flow-test.js`** - Complete data flow verification

### **Manual Testing Steps:**
1. Go to `/student-dashboard/submit-event`
2. Create a new draft
3. Select "Community-Based Event"
4. Verify routing to community-event page
5. Fill organization information
6. Proceed to event details
7. Complete the form

## ✅ **Benefits of the New Flow**

### **User Experience:**
- **Faster Navigation:** Direct routing eliminates unnecessary steps
- **Clearer Flow:** Users immediately see the relevant form for their event type
- **Reduced Confusion:** No intermediate organization page

### **Technical Benefits:**
- **Simplified Routing:** Fewer page transitions
- **Better Data Management:** Organization data collected in context
- **Improved Validation:** Field validation happens at the right time
- **Enhanced UX:** Auto-fill from user profile

### **Maintenance Benefits:**
- **Shared Components:** OrganizationSection can be reused
- **Consistent Logic:** Same organization collection for both event types
- **Easier Testing:** Clearer flow paths to test

## 🔍 **Key Features**

### **Auto-Fill from User Profile:**
- Automatically loads user's organization information
- Pre-fills form fields when available
- Graceful fallback when profile data is missing

### **Validation:**
- Required field validation before proceeding
- Real-time validation feedback
- Clear error messages

### **Navigation:**
- Back button returns to previous step
- Previous button in organization section returns to event type selection
- Previous button in event section returns to organization section

### **Data Persistence:**
- Auto-save functionality for both sections
- Data recovery from localStorage
- Proper section-based data storage

## 🚨 **Important Notes**

### **Backward Compatibility:**
- Existing drafts will still work
- Organization page is still available as fallback
- No breaking changes to existing functionality

### **Data Structure:**
- Organization data is stored in the `organization` section
- Event data is stored in the respective event sections
- Combined data is used for form state management

### **Error Handling:**
- Graceful fallbacks for missing data
- Clear error messages for validation failures
- Network error handling for API calls

## 🎉 **Success Criteria**

The refactor is successful when:
1. ✅ Event type selection routes directly to appropriate sections
2. ✅ Organization information is collected in both flows
3. ✅ User profile data is auto-filled correctly
4. ✅ Validation works properly for all required fields
5. ✅ Navigation between steps works smoothly
6. ✅ Data is saved correctly to the appropriate sections
7. ✅ Both school and community event flows complete successfully

## 📞 **Support**

For issues or questions about this refactor:
1. Check the test scripts for verification
2. Review the console logs for debugging information
3. Verify the routing logic in the event type page
4. Ensure the shared OrganizationSection component is working correctly 