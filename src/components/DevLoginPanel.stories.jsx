import React from "react";
import DevLoginPanel from "./DevLoginPanel";

export default {
  title: "Development/DevLoginPanel",
  component: DevLoginPanel,
  parameters: {
    docs: {
      description: {
        component:
          "Development-only component for quick login without Firebase. Provides persistent and ephemeral user options for testing different scenarios.",
      },
    },
    backgrounds: {
      default: "dark",
    },
  },
  tags: ["autodocs"],
};

export const Default = () => (
  <div style={{ maxWidth: 400, padding: 20 }}>
    <DevLoginPanel />
  </div>
);

Default.parameters = {
  docs: {
    description: {
      story: `
## Dev Login Panel

Only visible in development mode (isDevelopment = true).

**User Types:**
- **Persistent User**: Data persists across sessions (like a real user)
- **Ephemeral User**: Data resets on logout (clean slate testing)

**Usage**: Bypass Firebase authentication for local development testing.
      `,
    },
  },
};
