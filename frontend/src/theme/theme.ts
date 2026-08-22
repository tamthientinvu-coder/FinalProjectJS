import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1565c0" },
    secondary: { main: "#ef6c00" },
    background: { default: "#f5f7fa" },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Roboto", system-ui, "Segoe UI", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
});

export default theme;
