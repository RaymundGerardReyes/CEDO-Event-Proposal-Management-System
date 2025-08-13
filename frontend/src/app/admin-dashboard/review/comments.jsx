// frontend/src/app/admin-dashboard/review/comments.jsx

import { Button } from "@/components/dashboard/admin/ui/button"
import { Label } from "@/components/dashboard/admin/ui/label"
import { Textarea } from "@/components/dashboard/admin/ui/textarea"
import { MessageSquare } from "lucide-react"

export default function CommentsPanel({
    selectedProposal,
    newComment = "",
    setNewComment,
    handleAddComment
}) {
    // Early return if no proposal or details
    if (!selectedProposal?.details) {
        return (
            <div className="border rounded-md p-4 space-y-4">
                <h3 className="text-lg font-semibold mb-3">Comment Thread</h3>
                <div className="text-center py-4 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Select a proposal to view comments</p>
                </div>
            </div>
        )
    }

    // Safely access comments array with fallback
    const comments = selectedProposal.details.comments || []
    const hasComments = Array.isArray(comments) && comments.length > 0

    // Helper function to safely format comment date
    const formatCommentDate = (dateString) => {
        if (!dateString) return "Unknown date"
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch (error) {
            return "Invalid date"
        }
    }

    // Helper function to get comment styling based on role
    const getCommentStyle = (role) => {
        if (!role) return "bg-gray-50"
        return role.toLowerCase() === "admin" ? "bg-gray-100" : "bg-blue-50"
    }

    return (
        <div className="border rounded-md p-4 space-y-4">
            <h3 className="text-lg font-semibold mb-3">Comment Thread</h3>

            <div className="space-y-4 max-h-[300px] overflow-y-auto mb-4">
                {hasComments ? (
                    comments.map((comment, index) => {
                        // Safely access comment properties with fallbacks
                        const commentRole = comment?.role || "Unknown"
                        const commentText = comment?.text || "No content"
                        const commentDate = comment?.date || comment?.createdAt || null

                        return (
                            <div
                                key={`comment-${index}-${commentRole}-${commentDate}`}
                                className={`p-3 rounded-md ${getCommentStyle(commentRole)}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-sm">
                                        {commentRole}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatCommentDate(commentDate)}
                                    </span>
                                </div>
                                <p className="text-sm leading-relaxed">
                                    {commentText}
                                </p>
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center py-4 text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No comments yet</p>
                        <p className="text-xs mt-1">Be the first to add a comment!</p>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="new-comment">Add Comment</Label>
                <Textarea
                    id="new-comment"
                    placeholder="Type your comment here..."
                    value={newComment || ""}
                    onChange={(e) => setNewComment?.(e.target.value) || null}
                    className="min-h-[80px] resize-none"
                    maxLength={1000}
                />
                <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                        {(newComment || "").length}/1000 characters
                    </span>
                    <Button
                        onClick={handleAddComment}
                        disabled={!newComment?.trim() || !setNewComment || !handleAddComment}
                        className="px-4"
                    >
                        Post Comment
                    </Button>
                </div>
            </div>
        </div>
    )
}