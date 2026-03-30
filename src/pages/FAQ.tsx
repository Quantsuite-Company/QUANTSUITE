import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function FAQ() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-foreground mb-8">Frequently Asked Questions</h1>
      
      <Accordion type="single" collapsible className="space-y-4">
        <AccordionItem value="item-1" className="border border-border rounded-lg px-4">
          <AccordionTrigger className="text-left">
            What is QuantSuite and how does it help traders?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            QuantSuite is an AI-powered quantitative trading platform that combines advanced machine learning models 
            with traditional quant methods. It provides real-time market intelligence, algorithmic trading signals, 
            and risk analytics to help professional traders and institutions execute superior trading strategies.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2" className="border border-border rounded-lg px-4">
          <AccordionTrigger className="text-left">
            How does the AI-powered trading intelligence work?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            Our AI models analyze vast amounts of market data, news sentiment, and trading patterns in real-time 
            to identify high-probability trading opportunities. The system uses ensemble learning techniques 
            combining multiple algorithms to provide robust predictions with confidence intervals.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3" className="border border-border rounded-lg px-4">
          <AccordionTrigger className="text-left">
            What makes QuantSuite different from traditional trading platforms?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            QuantSuite fuses AI foresight with quantitative rigor, providing not just analysis but predictive 
            intelligence. Unlike static calculators, our platform adapts to market conditions, learns from patterns, 
            and provides dynamic risk assessments that evolve with changing market dynamics.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4" className="border border-border rounded-lg px-4">
          <AccordionTrigger className="text-left">
            Can I trust the AI predictions for real trading?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            QuantSuite's AI models are backtested extensively and provide transparency through confidence scores 
            and risk metrics. However, all trading involves risk and AI predictions should be part of a comprehensive 
            strategy. Always implement proper risk management and consult financial professionals for significant positions.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5" className="border border-border rounded-lg px-4">
          <AccordionTrigger className="text-left">
            How do I get started with algorithmic trading on QuantSuite?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            Start with our AI-powered toolkit that provides pre-built strategies and signals. The platform guides 
            you through backtesting, risk assessment, and gradual position sizing. Advanced users can customize 
            algorithms and integrate with major brokers through our API connections.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-6" className="border border-border rounded-lg px-4">
          <AccordionTrigger className="text-left">
            Is my trading data and strategies secure?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            Absolutely. QuantSuite uses enterprise-grade encryption and secure cloud infrastructure. Your proprietary 
            trading strategies and data are never shared or used to train models for other users. We maintain strict 
            data isolation and follow institutional-level security protocols.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}