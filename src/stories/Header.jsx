import React from "react";
import PropTypes from "prop-types";
import { Box, Typography, Avatar, IconButton } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";

/**
 * Header component showing user info and navigation.
 * Demonstrates a more complex component with multiple props.
 */
export const Header = ({ user, onLogin, onLogout, onCreateAccount }) => (
  <Box
    component="header"
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 24px",
      borderBottom: "1px solid #333",
      backgroundColor: "#1e1e1e",
    }}
  >
    {/* Logo */}
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography
        variant="h5"
        sx={{
          fontWeight: "bold",
          background: "linear-gradient(90deg, #9d99e5, #fdbb2d)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        CVstomize
      </Typography>
    </Box>

    {/* User section */}
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      {user ? (
        <>
          <Typography variant="body2" sx={{ color: "#e0e0e0" }}>
            {user.name}
          </Typography>
          <Avatar
            src={user.photoUrl}
            alt={user.name}
            sx={{ width: 32, height: 32 }}
          />
          <IconButton
            onClick={onLogout}
            size="small"
            sx={{ color: "#9d99e5" }}
            aria-label="Log out"
          >
            <LogoutIcon />
          </IconButton>
        </>
      ) : (
        <Box sx={{ display: "flex", gap: 1 }}>
          <button
            type="button"
            onClick={onLogin}
            style={{
              padding: "8px 16px",
              border: "1px solid #9d99e5",
              borderRadius: "4px",
              backgroundColor: "transparent",
              color: "#9d99e5",
              cursor: "pointer",
            }}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={onCreateAccount}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: "4px",
              backgroundColor: "#9d99e5",
              color: "#000",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Sign up
          </button>
        </Box>
      )}
    </Box>
  </Box>
);

Header.propTypes = {
  /** The logged-in user object */
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
    photoUrl: PropTypes.string,
  }),
  /** Login button click handler */
  onLogin: PropTypes.func.isRequired,
  /** Logout button click handler */
  onLogout: PropTypes.func.isRequired,
  /** Sign up button click handler */
  onCreateAccount: PropTypes.func.isRequired,
};

Header.defaultProps = {
  user: null,
};

export default Header;
