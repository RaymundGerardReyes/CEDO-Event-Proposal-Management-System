// frontend/src/app/(main)/admin-dashboard/review/comments.jsx

import { Button } from "@/components/dashboard/admin/ui/button"
import { Label } from "@/components/dashboard/admin/ui/label"
import { Textarea } from "@/components/dashboard/admin/ui/textarea"
import { MessageSquare } from "lucide-react"

export default function CommentsPanel({ selectedProposal, newComment, setNewComment, handleAddComment }) {
    if (!selectedProposal?.details) return null

    return (
        <div className="border rounded-md p-4 space-y-4">
            <h3 className="text-lg font-semibold mb-3">Comment Thread</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto mb-4">
                {selectedProposal.details.comments && selectedProposal.details.comments.length > 0 ? (
                    selectedProposal.details.comments.map((comment, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-md ${comment.role === "Admin" ? "bg-gray-100" : "bg-blue-50"}`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold">{comment.role}</span>
                                <span className="text-xs text-muted-foreground">{comment.date}</span>
                            </div>
                            <p>{comment.text}</p>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-4 text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No comments yet</p>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="new-comment">Add Comment</Label>
                <Textarea
                    id="new-comment"
                    placeholder="Type your comment here..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px]"
                />
                <Button onClick={handleAddComment} disabled={!newComment.trim()} className="w-full">
                    Post Comment
                </Button>
            </div>
        </div>
    )
}