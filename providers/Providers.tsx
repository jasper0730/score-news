import { ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";
import ToasterProvider from "./ToastProvider";
import SessionProvider from "./SessionProvider";
import { UserProvider } from "./UserProvider";

interface ProvidersProps {
  children: ReactNode;
}
const Providers = ({ children }: ProvidersProps) => {
  return (
    <SessionProvider>
      <UserProvider>
        <ToasterProvider />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </UserProvider>
    </SessionProvider>
  );
};

export default Providers;