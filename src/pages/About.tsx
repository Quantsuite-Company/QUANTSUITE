import { Calculator, TrendingUp, BarChart3, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function About() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <section className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">About QuantSuite</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The AI-powered quantitative trading platform that combines machine learning intelligence with proven 
            quant methods. Built for professional traders, hedge funds, and institutions seeking algorithmic excellence.
          </p>
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center">
            <CardHeader>
              <Brain className="w-8 h-8 text-primary mx-auto" />
              <CardTitle className="text-lg">AI Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Advanced machine learning models that analyze market patterns and predict trading opportunities in real-time.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="w-8 h-8 text-primary mx-auto" />
              <CardTitle className="text-lg">Algorithmic Trading</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sophisticated algorithms that execute trades based on quantitative signals and risk-adjusted strategies.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <TrendingUp className="w-8 h-8 text-primary mx-auto" />
              <CardTitle className="text-lg">Market Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Real-time market analysis combining technical indicators, sentiment data, and macroeconomic factors.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Calculator className="w-8 h-8 text-primary mx-auto" />
              <CardTitle className="text-lg">Risk Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Advanced risk management with stress testing, portfolio optimization, and dynamic hedging strategies.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="bg-muted/30 rounded-lg p-8 space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Our Mission</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-3">AI-Powered Edge</h3>
              <p className="text-muted-foreground">
                We believe the future of trading lies in the fusion of human insight and artificial intelligence. 
                QuantSuite democratizes access to institutional-grade AI trading tools for professional traders worldwide.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-3">Quantitative Excellence</h3>
              <p className="text-muted-foreground">
                Beyond traditional analysis, we provide adaptive algorithms that evolve with market conditions, 
                helping traders achieve consistent alpha through systematic, data-driven approaches.
              </p>
            </div>
          </div>
        </section>

        <section className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Built by Quant Professionals</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Developed by quantitative analysts and AI researchers from top-tier institutions. Our team combines 
            deep expertise in machine learning, financial engineering, and systematic trading to deliver 
            cutting-edge algorithmic solutions for the modern trader.
          </p>
        </section>
      </div>
    </div>
  );
}