import { Button } from "@/components/dashboard/admin/ui/button";
import { Input } from "@/components/dashboard/admin/ui/input";
import { ChevronLeft, Search } from "lucide-react";

export default function ProposalsHeaderControls() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center mb-4">
            <div>
                <h3 className="cedo-header">Recent Proposals</h3>
                <p className="cedo-subheader">Latest proposal submissions and their status</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search proposals..." className="pl-8 w-full sm:w-[250px]" />
                </div>
                <Button variant="outline" size="sm">Export</Button>
                <div className="border rounded-md px-3 py-1 text-sm flex items-center gap-1">
                    All Statuses
                    <ChevronLeft className="h-4 w-4" />
                </div>
            </div>
        </div>
    );
} 