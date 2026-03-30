import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Footer } from "./Footer";
import { IconMenu2 } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import quantsuiteLogo from "@/assets/quantsuite-logo.png";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />

        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-background/95 backdrop-blur px-4 gap-3">
            <SidebarTrigger className="hover:bg-muted p-2 rounded-md">
              <IconMenu2 className="w-5 h-5" />
            </SidebarTrigger>
            <button
              onClick={() => navigate('/')}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img src={quantsuiteLogo} alt="QuantSuite" className="h-8 w-auto" />
            </button>
          </header>

          <main className="flex-1 overflow-auto bg-background flex flex-col">
            <div className="flex-1">
              {children}
            </div>
            <Footer />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}