import { ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";
import ToasterProvider from "./ToastProvider";
import SessionProvider from "./SessionProvider";

interface ProvidersProps {
  children: ReactNode;
}
const Providers = ({ children }: ProvidersProps) => {
  return (
    <SessionProvider>
      <ToasterProvider />
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
};

export default Providers;