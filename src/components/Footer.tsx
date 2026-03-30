import { IconMail, IconBrandLinkedin, IconBrandGithub } from "@tabler/icons-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-background border-t mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">About QuantSuite</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered quantitative trading platform combining advanced analytics, machine learning, and real-time market intelligence. 
              Built for professional traders, quants, and financial institutions seeking algorithmic trading excellence.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Quick Links</h3>
            <div className="space-y-2">
              <Link 
                to="/privacy-policy" 
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                to="/faq" 
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                FAQ
              </Link>
              <Link 
                to="/about" 
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                About
              </Link>
            </div>
          </div>

          {/* Contact Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Contact</h3>
            <div className="space-y-2">
              <a 
                href="mailto:anirban_ua2503aih38@iitp.ac.in"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <IconMail className="w-4 h-4" />
                anirban_ua2503aih38@iitp.ac.in
              </a>
            </div>
          </div>

          {/* Connect with CEO */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Connect with CEO</h3>
            <div className="flex gap-4">
              <a
                href="https://www.linkedin.com/in/anirban-chowdhury-968950354/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-primary transition-all"
              >
                <IconBrandLinkedin className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/biriyani4ever-one"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-primary transition-all"
              >
                <IconBrandGithub className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 QuantSuite. AI-Powered Quantitative Trading Platform.
          </p>
        </div>
      </div>
    </footer>
  );
}