# BluePrint-Design-Tokens

This repo stores and generates tokens used in the BluePrint design system. 
It is managed by Braxton Coats and the Forge development team. 

## What are design tokens?
The Sage design system says it well: 

Design Tokens are Design System’s most basic, lowest level element. In atomic design terminology those would be the protons or electrons.

Basically those are **key-value records named and organized the same way regardless of the platform** (e.g. web, Android, iOS, Figma). They can define various properties, such as colors, paddings, margins, sizes, font sizes, font families, transitions, animations, and others. **They represent certain design decisions.**

Design tokens purpose is to:
- **Release developers from taking design decisions.** Often while developing a component, developer needs to take decision what tint of what color should be used. This decision should be taken by designer, not developer.
- **Improve handover process and communication between designers and developers.** Both, developers and designers are going to use the same token name for given property (color, background color, border, padding, margin, transition and so on). In the end, developers don't need to know what the final value will be.
- **Narrow value set to only needed values.** Design System uses narrow set of values (spacings, colors, typography properties and others). Those are only values that are needed for visual description of the component.
- **Keep visual consistency across all components of the library.**

## Documentation
You can view how tokens are used in BluePrint components by vising [BluePrint's documentation site](https://brand.bandwidth.com/63df57c99/p/5749f7-welcome-to-blueprint)

#### Install

To add to a project using npm:

```bash
# Using npm:
npm install blueprint-design-tokens
```

#### CSS

To make use of the css variables, import them into your code like so:

```css
/* Inside css */
@import "~blueprint-design-tokens/tokens/output/css/<theme>.css";
```

#### SCSS

To make use of the scss variables, import them into your code like so:

```css
/* Inside css */
@import "~blueprint-design-tokens/tokens/output/scss/<theme>.scss";
```