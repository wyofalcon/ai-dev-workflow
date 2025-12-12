import React, { useState } from "react";
import { Box } from "@mui/material";
import LocationAutocomplete from "./LocationAutocomplete";

export default {
  title: "Forms/LocationAutocomplete",
  component: LocationAutocomplete,
  parameters: {
    docs: {
      description: {
        component:
          "Location input with ZIP code autocomplete. When user enters a 5-digit US ZIP code, it automatically looks up the city/state using the Zippopotam.us API.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text" },
    placeholder: { control: "text" },
    helperText: { control: "text" },
    disabled: { control: "boolean" },
    fullWidth: { control: "boolean" },
  },
};

export const Default = () => {
  const [value, setValue] = useState("");
  return (
    <Box sx={{ width: 300 }}>
      <LocationAutocomplete
        value={value}
        onChange={setValue}
        label="Location"
        placeholder="San Francisco, CA or 94102"
      />
    </Box>
  );
};

Default.parameters = {
  docs: {
    description: {
      story:
        "Default empty state. Try typing a ZIP code like 94102 to see autocomplete.",
    },
  },
};

export const WithValue = () => {
  const [value, setValue] = useState("San Francisco, CA");
  return (
    <Box sx={{ width: 300 }}>
      <LocationAutocomplete
        value={value}
        onChange={setValue}
        label="Location"
      />
    </Box>
  );
};

WithValue.parameters = {
  docs: {
    description: {
      story: "Pre-filled with a city/state value.",
    },
  },
};

export const Disabled = () => {
  const [value, setValue] = useState("New York, NY");
  return (
    <Box sx={{ width: 300 }}>
      <LocationAutocomplete
        value={value}
        onChange={setValue}
        label="Location"
        disabled={true}
      />
    </Box>
  );
};

Disabled.parameters = {
  docs: {
    description: {
      story: "Disabled state for read-only display.",
    },
  },
};
