import React from "react";
import PropTypes from "prop-types";
import { Button as MuiButton } from "@mui/material";

/**
 * Primary UI component for user interaction.
 * Built on Material-UI Button with CVstomize theming.
 */
export const Button = ({
  primary = false,
  size = "medium",
  backgroundColor,
  label,
  ...props
}) => {
  const variant = primary ? "contained" : "outlined";

  const sizeMap = {
    small: "small",
    medium: "medium",
    large: "large",
  };

  return (
    <MuiButton
      variant={variant}
      size={sizeMap[size]}
      sx={{
        backgroundColor: primary ? backgroundColor : "transparent",
        borderColor: backgroundColor,
        color: primary ? "#000" : backgroundColor || "primary.main",
        fontWeight: "bold",
        "&:hover": {
          backgroundColor: primary
            ? backgroundColor
            : `${backgroundColor}20` || "primary.light",
          opacity: 0.9,
        },
      }}
      {...props}
    >
      {label}
    </MuiButton>
  );
};

Button.propTypes = {
  /** Is this the principal call to action on the page? */
  primary: PropTypes.bool,
  /** What background color to use */
  backgroundColor: PropTypes.string,
  /** How large should the button be? */
  size: PropTypes.oneOf(["small", "medium", "large"]),
  /** Button contents */
  label: PropTypes.string.isRequired,
  /** Optional click handler */
  onClick: PropTypes.func,
};

Button.defaultProps = {
  backgroundColor: "#9d99e5",
  primary: false,
  size: "medium",
  onClick: undefined,
};

export default Button;
