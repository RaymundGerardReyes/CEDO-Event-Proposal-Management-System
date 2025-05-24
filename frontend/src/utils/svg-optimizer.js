/**
 * SVG Optimization Utility
 *
 * This utility provides functions to optimize SVG files for web use.
 * It includes methods for path simplification, attribute optimization,
 * and overall file size reduction.
 */

/**
 * Simplifies SVG path data by reducing unnecessary points
 * @param {string} pathData - The SVG path data string
 * @param {number} tolerance - Simplification tolerance (higher = more simplification)
 * @returns {string} Simplified path data
 */
export function simplifyPath(pathData, tolerance = 0.5) {
    // Implementation would use algorithms like Ramer-Douglas-Peucker
    // For demonstration purposes, we're returning the original path
    return pathData
}

/**
 * Optimizes SVG by removing unnecessary attributes and whitespace
 * @param {string} svgContent - The full SVG content as string
 * @returns {string} Optimized SVG content
 */
export function optimizeSvg(svgContent) {
    // Remove comments
    let optimized = svgContent.replace(/<!--[\s\S]*?-->/g, "")

    // Remove unnecessary whitespace
    optimized = optimized.replace(/>\s+</g, "><")

    // Remove empty attributes
    optimized = optimized.replace(/\s+(\w+)=""/g, "")

    return optimized
}

/**
 * Adds responsive attributes to SVG
 * @param {string} svgContent - The full SVG content as string
 * @returns {string} SVG with responsive attributes
 */
export function makeResponsive(svgContent) {
    // Add preserveAspectRatio attribute if not present
    if (!svgContent.includes("preserveAspectRatio")) {
        svgContent = svgContent.replace(/<svg/, '<svg preserveAspectRatio="xMidYMid meet"')
    }

    return svgContent
}

/**
 * Converts SVG to React component format
 * @param {string} svgContent - The full SVG content as string
 * @param {Object} options - Conversion options
 * @returns {string} React component code
 */
export function svgToReactComponent(svgContent, options = {}) {
    const { componentName = "SvgLogo", props = [] } = options

    // Extract viewBox
    const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/)
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 100 100"

    // Create props string
    const propsString = props.map((prop) => `${prop.name}={${prop.name}}`).join(" ")

    // Replace static values with props
    let componentCode = svgContent.replace(
        /<svg[^>]*>/,
        `<svg 
        width={width} 
        height={height} 
        viewBox="${viewBox}" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        ${propsString}
      >`,
    )

    // Wrap in React component
    componentCode = `
  import React from 'react';
  
  const ${componentName} = ({ 
    className = "", 
    width = 150, 
    height = 45,
    ${props.map((p) => `${p.name} = ${JSON.stringify(p.default)}`).join(",\n  ")} 
  }) => {
    return (
      ${componentCode}
    );
  };
  
  export default ${componentName};
  `

    return componentCode
}
