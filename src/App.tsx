import { useMemo } from "react";
import CredentialKeeper from "./services/CredentialKeeper";
import { ExportPage } from "./components/export/ExportPage";
import { PinForm } from "./components/credential/PinForm";
import SellsyClient from "./services/SellsyClient";
import { BrowserRouter, Route, Routes } from "react-router-dom";

function App() {
  const sellsyClient = useMemo(() => new SellsyClient(), []);
  const credentialKeeper = useMemo(() => new CredentialKeeper(), []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<PinForm credentialKeeper={credentialKeeper} />}
        />
        <Route path="/sellsy">
          <Route
            path="exports"
            element={
              <ExportPage
                sellsyClient={sellsyClient}
                credentialKeeper={credentialKeeper}
              />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
