import {Box, Container} from "@mui/material";
import React from "react";

const Footer = () => {
  return (
    <footer>
      <Box bgcolor="text.secondary">
        <Container maxWidth="lg">
          <Box textAlign="center" pt={{ xs: 2, sm: 5 }} pb={{ xs: 2, sm: 5 }}>
            Copyright TodoListSync &reg; {new Date().getFullYear()}
          </Box>
        </Container>
      </Box>
    </footer>
  );
}

export default Footer;