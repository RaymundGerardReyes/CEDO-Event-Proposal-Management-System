// frontend/src/app/(main)/admin-dashboard/review/decision.jsx

import { Button } from "@/components/dashboard/admin/ui/button"
import { Label } from "@/components/dashboard/admin/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/admin/ui/select"
import { Textarea } from "@/components/dashboard/admin/ui/textarea"
import { FileText } from "lucide-react"

export default function DecisionPanel({ reviewDecision, setReviewDecision, reviewComment, setReviewComment }) {
    return (
        <div className="border rounded-md p-4 space-y-4">
            <h3 className="text-lg font-semibold mb-3">Review Decision</h3>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="decision">Decision</Label>
                    <Select value={reviewDecision || ""} onValueChange={(value) => setReviewDecision(value)}>
                        <SelectTrigger id="decision">
                            <SelectValue placeholder="Select your decision" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="approve">Approve</SelectItem>
                            <SelectItem value="revision">Request Revision</SelectItem>
                            <SelectItem value="reject">Reject</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="comment">Decision Comments</Label>
                    <Textarea
                        id="comment"
                        placeholder="Provide feedback or reasons for your decision"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="min-h-[100px]"
                    />
                </div>

                <div className="pt-4">
                    <Label className="text-xs text-muted-foreground mb-2 block">Quick Links</Label>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            View GPOA
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            View Project Proposal
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            View Budget
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
