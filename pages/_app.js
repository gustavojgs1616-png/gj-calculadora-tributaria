import "@/styles/globals.css";
import { AssinaturaProvider } from "../lib/AssinaturaContext";

export default function App({ Component, pageProps }) {
  return (
    <AssinaturaProvider>
      <Component {...pageProps} />
    </AssinaturaProvider>
  );
}
