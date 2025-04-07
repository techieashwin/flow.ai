import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import ContextProvider from "./context/Context.jsx";
import { Auth0Provider } from '@auth0/auth0-react';
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <Auth0Provider
    domain="dev-y5ngxwl05o4t1rgr.us.auth0.com"
    clientId="AyFG2GuOZDxS5n6krzClVQI3IOXxD6iC"
    authorizationParams={{
      redirect_uri: window.location.origin,
    }}
  >
    
    <ContextProvider>
      <BrowserRouter>
      <App />
      </BrowserRouter>
    </ContextProvider>
  </Auth0Provider>
);
