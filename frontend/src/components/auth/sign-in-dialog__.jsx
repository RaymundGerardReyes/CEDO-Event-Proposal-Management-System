import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function SignInDialog({ isOpen, onClose, children }) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Sign In</DialogTitle> {/* Added DialogTitle for accessibility */}
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    )
}
