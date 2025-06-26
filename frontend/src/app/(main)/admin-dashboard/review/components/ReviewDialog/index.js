/**
 * ReviewDialog - Compound Component Pattern Implementation
 * 
 * This follows the compound components pattern where the main component
 * acts as a container and provides sub-components for flexible composition.
 * 
 * Based on research from:
 * - Alex Kondov's refactoring guide
 * - Compound Components Pattern by Cassie
 * - Modal management best practices
 */

import ReviewDialog from './ReviewDialog';
import ReviewDialogContent from './ReviewDialogContent';
import ReviewDialogFooter from './ReviewDialogFooter';
import ReviewDialogHeader from './ReviewDialogHeader';
import ReviewDialogTabs from './ReviewDialogTabs';

// Compound component pattern - attach sub-components as static properties
ReviewDialog.Header = ReviewDialogHeader;
ReviewDialog.Content = ReviewDialogContent;
ReviewDialog.Footer = ReviewDialogFooter;
ReviewDialog.Tabs = ReviewDialogTabs;

export default ReviewDialog;

// Named exports for direct usage
export {
    ReviewDialogContent,
    ReviewDialogFooter, ReviewDialogHeader, ReviewDialogTabs
};

