import { Label } from "@/components/dashboard/admin/ui/label"
import { Button } from "@/components/dashboard/admin/ui/button"
import { FileText, Download } from "lucide-react"

export default function EventDetails({ selectedProposal }) {
  if (!selectedProposal?.details) return null

  const { schoolEvent, communityEvent } = selectedProposal.details

  const renderSchool = () => {
    if (!schoolEvent) return null
    return (
      <div className="border rounded-md p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">School-Based Event</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">Event/Activity Name</Label>
            <p className="font-medium">{schoolEvent.name}</p>
          </div>
          {schoolEvent.description && (
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <p>{schoolEvent.description}</p>
            </div>
          )}
          <div>
            <Label className="text-xs text-muted-foreground">Venue</Label>
            <p>{schoolEvent.venue}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Mode of Event</Label>
            <p>{schoolEvent.mode}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Start/End Date</Label>
            <p>
              {schoolEvent.startDate} - {schoolEvent.endDate}
            </p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Start/End Time</Label>
            <p>
              {schoolEvent.startTime} - {schoolEvent.endTime}
            </p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Type of Event</Label>
            <p>{schoolEvent.type}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Target Audience</Label>
            <p>
              {Array.isArray(schoolEvent.audience) ? schoolEvent.audience.join(', ') : schoolEvent.audience}
            </p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Return Service Credit Amount</Label>
            <p>{schoolEvent.credits}</p>
          </div>
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">Attachments</Label>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>GPOA: {schoolEvent.attachments.gpoa}</span>
                <Button variant="ghost" size="sm" className="h-6 px-2 ml-auto">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>Project Proposal: {schoolEvent.attachments.proposal}</span>
                <Button variant="ghost" size="sm" className="h-6 px-2 ml-auto">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderCommunity = () => {
    if (!communityEvent) return null
    return (
      <div className="border rounded-md p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Community-Based Event</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">Event/Activity Name</Label>
            <p className="font-medium">{communityEvent.name}</p>
          </div>
          {communityEvent.description && (
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <p>{communityEvent.description}</p>
            </div>
          )}
          <div>
            <Label className="text-xs text-muted-foreground">Venue</Label>
            <p>{communityEvent.venue}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Mode of Event</Label>
            <p>{communityEvent.mode}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Start/End Date</Label>
            <p>
              {communityEvent.startDate} - {communityEvent.endDate}
            </p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Type of Event</Label>
            <p>
              {Array.isArray(communityEvent.type) ? communityEvent.type.join(', ') : communityEvent.type}
            </p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Target Audience</Label>
            <p>
              {Array.isArray(communityEvent.audience) ? communityEvent.audience.join(', ') : communityEvent.audience}
            </p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">SDP Credits Amount</Label>
            <p>{communityEvent.credits}</p>
          </div>
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">Attachments</Label>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>GPOA: {communityEvent.attachments.gpoa}</span>
                <Button variant="ghost" size="sm" className="h-6 px-2 ml-auto">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>Project Proposal: {communityEvent.attachments.proposal}</span>
                <Button variant="ghost" size="sm" className="h-6 px-2 ml-auto">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {renderSchool()}
      {renderCommunity()}
    </>
  )
} 