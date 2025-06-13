"use client";

import { FilterForm } from "@/components/dashboard/admin/filter-form";
import { PageHeader } from "@/components/dashboard/admin/page-header";
import { CheckboxField, DatePickerField, RadioField, SelectField } from "@/components/dashboard/admin/responsive-form-field";
import { ResponsiveTable } from "@/components/dashboard/admin/responsive-table";
import { SearchForm } from "@/components/dashboard/admin/search-form";
import { Badge } from "@/components/dashboard/admin/ui/badge";
import { Button } from "@/components/dashboard/admin/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/admin/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

// Sample data
const products = [
    { id: 1, name: "Laptop Pro", category: "electronics", price: 1299, inStock: true, rating: 4.5, dateAdded: "2023-01-15" },
    { id: 2, name: "Smartphone X", category: "electronics", price: 899, inStock: true, rating: 4.2, dateAdded: "2023-02-10" },
    { id: 3, name: "Desk Chair", category: "furniture", price: 249, inStock: false, rating: 3.8, dateAdded: "2023-01-05" },
    { id: 4, name: "Coffee Table", category: "furniture", price: 349, inStock: true, rating: 4.0, dateAdded: "2023-03-20" },
    { id: 5, name: "Wireless Headphones", category: "electronics", price: 199, inStock: true, rating: 4.7, dateAdded: "2023-02-28" },
    { id: 6, name: "Bookshelf", category: "furniture", price: 179, inStock: true, rating: 3.5, dateAdded: "2023-01-25" },
    { id: 7, name: "Fitness Tracker", category: "electronics", price: 129, inStock: false, rating: 4.1, dateAdded: "2023-03-05" },
    { id: 8, name: "Dining Table", category: "furniture", price: 599, inStock: true, rating: 4.3, dateAdded: "2023-02-15" },
    { id: 9, name: "Smart Watch", category: "electronics", price: 249, inStock: true, rating: 4.4, dateAdded: "2023-03-15" },
    { id: 10, name: "Office Desk", category: "furniture", price: 399, inStock: true, rating: 4.2, dateAdded: "2023-01-10" },
];

export default function SearchFilterExamplePageContent() {
    const { isMobile } = useIsMobile();
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        category: "all",
        priceRange: "all",
        inStock: false,
        minRating: 0,
        dateAdded: "",
    });

    const handleSearch = (term) => {
        setSearchTerm(term);
    };

    const handleFilter = (filterData) => {
        setFilters({
            category: filterData.category || "all",
            priceRange: filterData.priceRange || "all",
            inStock: filterData.inStock === "on",
            minRating: filterData.minRating || 0,
            dateAdded: filterData.dateAdded || "",
        });
    };

    const handleResetFilters = () => {
        setFilters({
            category: "all",
            priceRange: "all",
            inStock: false,
            minRating: 0,
            dateAdded: "",
        });
    };

    // Apply filters and search
    const filteredProducts = products.filter((product) => {
        if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }
        if (filters.category !== "all" && product.category !== filters.category) {
            return false;
        }
        if (filters.priceRange !== "all") {
            if (filters.priceRange === "under200" && product.price >= 200) return false;
            if (filters.priceRange === "200to500" && (product.price < 200 || product.price > 500)) return false;
            if (filters.priceRange === "over500" && product.price <= 500) return false;
        }
        if (filters.inStock && !product.inStock) {
            return false;
        }
        if (filters.minRating > 0 && product.rating < filters.minRating) {
            return false;
        }
        if (filters.dateAdded && new Date(product.dateAdded) < new Date(filters.dateAdded)) {
            return false;
        }
        return true;
    });

    const tableHeaders = [
        { key: "name", label: "Product Name" },
        {
            key: "category",
            label: "Category",
            render: (value) => (
                <Badge className={value === "electronics" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                    {value}
                </Badge>
            ),
        },
        { key: "price", label: "Price", render: (value) => `$${value.toFixed(2)}` },
        {
            key: "inStock",
            label: "Availability",
            render: (value) => (
                <Badge variant={value ? "default" : "destructive"}>{value ? "In Stock" : "Out of Stock"}</Badge>
            ),
        },
        { key: "rating", label: "Rating" },
        { key: "dateAdded", label: "Date Added", render: (value) => new Date(value).toLocaleDateString() },
    ];

    const categoryOptions = [
        { value: "all", label: "All Categories" },
        { value: "electronics", label: "Electronics" },
        { value: "furniture", label: "Furniture" },
    ];

    const priceRangeOptions = [
        { value: "all", label: "All Prices" },
        { value: "under200", label: "Under $200" },
        { value: "200to500", label: "Between $200 - $500" },
        { value: "over500", label: "Over $500" },
    ];

    const ratingOptions = [
        { value: "0", label: "Any Rating" },
        { value: "3", label: "3+ Stars" },
        { value: "4", label: "4+ Stars" },
        { value: "4.5", label: "4.5+ Stars" },
    ];

    return (
        <div className="flex-1 bg-[#f8f9fa] p-4 sm:p-6 md:p-8">
            <PageHeader title="Search & Filter Example" subtitle="Responsive search and filter components" />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                    <FilterForm
                        onFilter={handleFilter}
                        onReset={handleResetFilters}
                        title="Filter Products"
                        collapsible={!isMobile}
                        defaultCollapsed={false}
                    >
                        <SelectField
                            label="Category"
                            id="category"
                            name="category"
                            value={filters.category}
                            options={categoryOptions}
                        />

                        <SelectField
                            label="Price Range"
                            id="priceRange"
                            name="priceRange"
                            value={filters.priceRange}
                            options={priceRangeOptions}
                        />

                        <CheckboxField label="In Stock Only" id="inStock" name="inStock" checked={filters.inStock} />

                        <RadioField
                            label="Minimum Rating"
                            name="minRating"
                            value={filters.minRating.toString()}
                            options={ratingOptions}
                            orientation="vertical"
                        />

                        <DatePickerField label="Added After" id="dateAdded" name="dateAdded" value={filters.dateAdded} />
                    </FilterForm>
                </div>

                <div className="lg:col-span-3">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <CardTitle>Products</CardTitle>
                                <SearchForm
                                    onSearch={handleSearch}
                                    placeholder="Search products..."
                                    initialValue={searchTerm}
                                    expandable={isMobile}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <p className="text-sm text-muted-foreground">
                                    Showing {filteredProducts.length} of {products.length} products
                                </p>
                            </div>

                            <ResponsiveTable
                                headers={tableHeaders}
                                data={filteredProducts}
                                keyField="id"
                                emptyState={
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <p className="text-lg font-medium">No products found</p>
                                        <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
                                        <Button variant="outline" onClick={handleResetFilters} className="mt-4">
                                            Reset Filters
                                        </Button>
                                    </div>
                                }
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
} 