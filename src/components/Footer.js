import React from "react";
import { Box, Typography, Link } from "@mui/material";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: "auto",
        backgroundColor: (theme) =>
          theme.palette.mode === "light"
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        align="center"
        sx={{ mb: 1, fontStyle: "italic" }}
      >
        "You have skills you've never thought to put on a resume. We help you
        find them."
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center">
        {"Copyright © "}
        <Link color="inherit" href="https://cvstomize.com">
          CVstomize
        </Link>{" "}
        {new Date().getFullYear()}
        {" | "}
        <Link color="inherit" href="/terms" sx={{ textDecoration: "none" }}>
          Terms & Conditions
        </Link>
      </Typography>
    </Box>
  );
}
