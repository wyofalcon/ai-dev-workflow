import React, { useState, useEffect, useRef } from "react";
import {
  TextField,
  Autocomplete,
  CircularProgress,
  InputAdornment,
  Typography,
  Box,
} from "@mui/material";
import { LocationOn as LocationIcon } from "@mui/icons-material";

/**
 * LocationAutocomplete - A text field with zip code autocomplete
 *
 * When user types a 5-digit US zip code, it automatically looks up
 * the city/state and offers it as a suggestion.
 *
 * Uses the free Zippopotam.us API for zip code lookups.
 */
function LocationAutocomplete({
  value,
  onChange,
  disabled = false,
  label = "Location",
  placeholder = "San Francisco, CA or 94102",
  helperText = "Enter city, state or zip code for auto-fill",
  fullWidth = true,
  ...otherProps
}) {
  const [inputValue, setInputValue] = useState(value || "");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Lookup zip code using free Zippopotam.us API
  const lookupZipCode = (zipCode) => {
    if (!zipCode || zipCode.length !== 5 || !/^\d{5}$/.test(zipCode)) {
      setOptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`https://api.zippopotam.us/us/${zipCode}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error("Not found");
      })
      .then((data) => {
        if (data.places && data.places.length > 0) {
          const place = data.places[0];
          const city = place["place name"];
          const state = place["state abbreviation"];
          const formattedLocation = `${city}, ${state}`;

          setOptions([
            {
              label: formattedLocation,
              zipCode: zipCode,
              city: city,
              state: state,
            },
          ]);
        } else {
          setOptions([]);
        }
      })
      .catch(() => {
        setOptions([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Check if input looks like a zip code and trigger lookup (debounced)
  useEffect(() => {
    const trimmed = inputValue.trim();

    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Check if it's a 5-digit zip code
    if (/^\d{5}$/.test(trimmed)) {
      debounceRef.current = setTimeout(() => {
        lookupZipCode(trimmed);
      }, 300);
    } else if (/^\d{1,4}$/.test(trimmed)) {
      // Partial zip code - show loading hint but don't lookup yet
      setOptions([]);
    } else {
      setOptions([]);
      setLoading(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputValue]);

  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
    // Always call onChange with the current input value for manual typing
    onChange(newInputValue);
  };

  const handleChange = (event, newValue) => {
    if (newValue && typeof newValue === "object") {
      // User selected an autocomplete option
      onChange(newValue.label);
      setInputValue(newValue.label);
    } else if (typeof newValue === "string") {
      // User typed and pressed enter
      onChange(newValue);
      setInputValue(newValue);
    }
  };

  return (
    <Autocomplete
      freeSolo
      options={options}
      getOptionLabel={(option) =>
        typeof option === "string" ? option : option.label
      }
      value={inputValue}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onChange={handleChange}
      loading={loading}
      disabled={disabled}
      filterOptions={(x) => x} // Don't filter - we control options via API
      renderOption={(props, option) => {
        const { key, ...otherPropsRest } = props;
        return (
          <li key={key} {...otherPropsRest}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LocationIcon color="primary" fontSize="small" />
              <Box>
                <Typography variant="body1">{option.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  ZIP: {option.zipCode}
                </Typography>
              </Box>
            </Box>
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          fullWidth={fullWidth}
          label={label}
          placeholder={placeholder}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <LocationIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <>
                {loading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </>
            ),
            sx: {
              "& input::placeholder": {
                color: "text.disabled",
                opacity: 0.7,
              },
            },
          }}
          {...otherProps}
        />
      )}
    />
  );
}

export default LocationAutocomplete;
