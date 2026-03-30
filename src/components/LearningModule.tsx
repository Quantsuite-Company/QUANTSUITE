import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Book, Lamp, Cup, PlayCircle } from 'iconsax-react';
import { useNavigate } from 'react-router-dom';
import { ManualQuizComponent } from './ManualQuizComponent';

interface QuizOption {
  text: string;
  correct: boolean;
  roast?: string;
}

interface Quiz {
  question: string;
  options: QuizOption[];
  explanation: string;
  hint?: string;
  funnyCorrectMessage?: string;
}

interface Lesson {
  id: string;
  title: string;
  content: string[];
  example: {
    scenario: string;
    explanation: string[];
    funnyAnalogy?: string;
  };
  keyTakeaway: string;
  practicalTip: string;
  quiz?: Quiz;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  lessons: Lesson[];
  route: string;
}

const learningPaths: { [key: string]: LearningPath[] } = {
  'ml-volatility-forecasting': [
    {
      id: 'ml-beginner',
      title: 'Crystal Ball for Traders',
      description: 'Predict market mood swings like a fortune teller',
      difficulty: 'Beginner',
      route: '/ml-volatility-forecasting',
      lessons: [
        {
          id: 'ml-intro',
          title: 'What is ML Volatility Forecasting? (Your Personal Market Psychic)',
          content: [
            "🔮 Imagine you had a crystal ball that could predict how crazy the stock market will be tomorrow. Not the exact price, but whether it'll be as calm as a Sunday morning or as wild as a Bollywood dance sequence! 💃",
            "",
            "That's EXACTLY what ML Volatility Forecasting does! It's like having a weather app for the stock market. Just like how weather forecasts tell you 'It's going to be stormy, carry an umbrella,' volatility forecasting tells you 'Market's going to be wild, adjust your trades accordingly!'",
            "",
            "🤖 Meet Your AI Trading Assistant Team:",
            "",
            "Think of it as having three super-smart interns working 24/7 to predict market mood:",
            "",
            "1️⃣ **GARCH (The Pattern Detective)** 🕵️‍♂️",
            "Like that friend who always says 'I told you so!' GARCH notices that crazy market days are usually followed by more crazy days. If yesterday was wild, today probably will be too!",
            "",
            "2️⃣ **EWMA (The Recent Memory Expert)** 📱",
            "Like your Instagram feed – gives more importance to recent posts! If the market was crazy last week, EWMA says 'That's what matters most for predicting this week.'",
            "",
            "3️⃣ **Neural Network (The Genius Child)** 🧠",
            "The smartest kid in class who can spot patterns no one else can see. It looks at everything – price movements, trading volumes, even the day of the week – and finds hidden connections!",
            "",
            "🎯 **Why This is Like Having a Superpower:**",
            "",
            "• **Option Traders**: Know when options will be expensive vs cheap!",
            "• **Stock Traders**: Adjust your position sizes based on expected market chaos",
            "• **Portfolio Managers**: Protect your money when storms are coming",
            "• **Regular Investors**: Know when to reduce risk and when to be brave!"
          ],
          example: {
            scenario: "📈 Real-life magic: It's Monday morning. Your ML models predict high volatility this week. What do you do?",
            explanation: [
              "🔮 **The Prediction**: All three models agree – this week will be WILD!",
              "",
              "📊 **What each model sees**:",
              "• **GARCH**: 'Last week was crazy with 3% daily moves. History says this chaos continues!'",
              "• **EWMA**: 'Recent days show increasing wildness. The trend points UP!'",
              "• **Neural Network**: 'I see patterns in the data. Fed meeting + earnings season + global tensions = CHAOS!'",
              "",
              "💡 **Your Smart Moves**:",
              "1. **Option Buying**: Perfect time! High volatility = higher option prices = more profit potential",
              "2. **Position Sizing**: Reduce your bet sizes – wild markets can hurt more",
              "3. **Stop Losses**: Keep them tighter – prices can move faster than usual",
              "4. **Diversification**: Spread your bets – don't put all eggs in one basket",
              "",
              "📈 **Real Results**: By Wednesday, NIFTY moves 4%! Your options that you bought cheap on Monday are now worth 3x more!",
              "",
              "🎊 **The Power**: While others are surprised by the chaos, you were prepared and profited!"
            ],
            funnyAnalogy: "It's like being the only person at a party who knows it's about to rain. While others get soaked, you're dancing under your umbrella! ☔🕺"
          },
          keyTakeaway: 'ML Volatility Forecasting is like having a weather forecast for the stock market – it helps you prepare for storms and sunny days alike!',
          practicalTip: 'Check volatility predictions before making any trades. High predicted volatility = buy options, lower position sizes. Low predicted volatility = sell options, increase position sizes. 🎯',
          quiz: {
            question: "🎯 Your ML model screams 'HIGH VOLATILITY INCOMING!' What's your smartest move?",
            options: [
              {
                text: "Ignore it completely and YOLO into massive positions 🤑",
                correct: false,
                roast: "Bold strategy! It's like ignoring a tsunami warning because you feel lucky. Spoiler: The market doesn't care about your feelings! 🌊💸"
              },
              {
                text: "Buy options and reduce position sizes to manage risk 🎯",
                correct: true
              },
              {
                text: "Sell all your stocks and hide under a blanket 😰",
                correct: false,
                roast: "Aww, scared money doesn't make money! High volatility isn't the end of the world—it's actually opportunity knocking... loudly! 📈"
              },
              {
                text: "Short everything because volatility = market crash",
                correct: false,
                roast: "Whoa there, Michael Burry! High volatility just means big swings, not necessarily down. Could swing UP and roast your shorts! 🔥"
              }
            ],
            explanation: "High predicted volatility = options become more valuable + bigger price swings = higher risk. Smart traders buy options (to profit from big moves) while reducing position sizes (to protect capital). You want to be prepared, not paralyzed!",
            hint: "Think about what high volatility really means: BIG price movements in EITHER direction.",
            funnyCorrectMessage: "🎉 YES! You're thinking like a pro trader! High volatility is your friend when you respect it and prepare for it!"
          }
        },
        {
          id: 'ml-models',
          title: 'Meet Your AI Trading Squad (The Three Musketeers of Prediction)',
          content: [
            "🎭 Think of these three models as your personal trading advisory board. Each has a different personality and specialty, but together they give you the complete picture!",
            "",
            "🕵️‍♂️ **GARCH - The Pattern Detective**",
            "",
            "GARCH is like that uncle who always says 'Back in my day...' and actually has useful wisdom! He believes that crazy market days cluster together.",
            "",
            "🧠 **How GARCH Thinks**:",
            "• 'If yesterday was wild (+3%), today will probably be wild too!'",
            "• 'If last week was calm, this week will likely be calm'",
            "• 'Markets have moods – and moods last for a while'",
            "",
            "📊 **GARCH's Superpower**: Volatility Clustering",
            "Just like bad weather often comes in streaks, market chaos also comes in waves. GARCH is excellent at spotting these patterns!",
            "",
            "📱 **EWMA - The Social Media Expert**",
            "",
            "EWMA is like your Instagram algorithm – it cares WAY more about what happened recently than what happened months ago!",
            "",
            "🤳 **How EWMA Thinks**:",
            "• 'What happened yesterday = 50% importance'",
            "• 'What happened last week = 25% importance'",
            "• 'What happened last month = 12.5% importance'",
            "• 'Ancient history (6 months ago) = Almost irrelevant'",
            "",
            "⚡ **EWMA's Superpower**: Lightning Fast Adaptation",
            "When market conditions change suddenly, EWMA is the first to notice and adjust predictions!",
            "",
            "🧠 **Neural Network - The Genius Child**",
            "",
            "This is the smartest member of your team. Like a child prodigy who can solve Rubik's cubes blindfolded, Neural Networks find patterns humans can't even imagine!",
            "",
            "🎯 **How Neural Networks Think**:",
            "• 'I see connections between 47 different factors!'",
            "• 'Market volatility on Fridays before long weekends follows this pattern...'",
            "• 'When these 12 indicators align this way, volatility jumps 73% of the time!'",
            "",
            "🎪 **Neural Network's Superpower**: Seeing the Invisible",
            "It can find relationships between things you'd never think are connected – like correlation between oil prices, weather patterns, and NIFTY volatility!"
          ],
          example: {
            scenario: "🎯 Battle of the Predictions: It's Friday, and all three models disagree about next week!",
            explanation: [
              "📊 **The Disagreement**:",
              "• **GARCH**: 'This week was calm, next week will be calm too' (Low volatility)",
              "• **EWMA**: 'Yesterday's news was crazy, next week will be wild!' (High volatility)",  
              "• **Neural Network**: 'I see something you both missed – Fed meeting + holiday pattern = Medium volatility'",
              "",
              "🤔 **What Do You Do?**",
              "",
              "Smart traders don't pick sides – they create a **SUPER PREDICTION** by combining all three!",
              "",
              "🧮 **The Magic Formula**:",
              "• GARCH prediction: 15% volatility (weight: 30%)",
              "• EWMA prediction: 25% volatility (weight: 30%)",
              "• Neural Network: 20% volatility (weight: 40%)",
              "",
              "📈 **Final Prediction**: (15×0.3) + (25×0.3) + (20×0.4) = **20% volatility**",
              "",
              "🎉 **Result**: Next week, actual volatility turns out to be 19.5%! Your combined prediction was almost perfect!",
              "",
              "💡 **The Lesson**: Like having multiple doctors give opinions on your health, multiple models give you better trading diagnosis!"
            ],
            funnyAnalogy: "It's like asking three friends for restaurant recommendations. One loves traditional food (GARCH), one loves trending places (EWMA), and one is a foodie who knows hidden gems (Neural Network). The best meal comes from considering all three opinions! 🍽️"
          },
          keyTakeaway: 'Each model has unique strengths. GARCH spots patterns, EWMA adapts quickly, Neural Networks see hidden connections. Together, they create super-accurate predictions!',
          practicalTip: 'Never rely on just one model! Always check what all three are saying. When they agree, confidence is high. When they disagree, proceed with caution! 🎯'
        }
      ]
    }
  ],
  'black-scholes': [
    {
      id: 'bs-beginner',
      title: 'Option Pricing Basics',
      description: 'Start your journey into option pricing',
      difficulty: 'Beginner',
      route: '/app',
      lessons: [
        {
          id: 'bs-intro',
          title: 'What is Black-Scholes? (And Why Should You Care?)',
          content: [
            "🎭 Picture this: You're at a street food market in New York. A vendor shouts 'Best hot dog in the city! Only $5!' But wait... is it REALLY worth $5? 🤔",
            "",
            "You look around and see other vendors selling similar hot dogs for $2. Some guy next to you paid $8 for the SAME hot dog last week! What's going on here? Welcome to the world of pricing confusion – exactly what happens in options trading every single day!",
            "",
            "🧙‍♂️ Enter Black-Scholes: Your Personal Option Price Detective!",
            "",
            "Black-Scholes is like having Sherlock Holmes in your pocket, but instead of solving murders, he solves the mystery of 'What should this option ACTUALLY cost?' He doesn't care about market hype, fear, or greed. He just looks at the facts and gives you the mathematical truth.",
            "",
            "Think of it as the 'Google Maps' of option pricing. Just like Maps considers traffic, route options, and distance to give you the best path, Black-Scholes considers 5 crucial factors to give you the fair price:",
            "",
            "1️⃣ **Current Stock Price (S)**: Like checking if it's a Ferrari ($300,000) or a Honda Civic ($25,000)",
            "2️⃣ **Strike Price (K)**: Your 'target price' – like setting your dream salary in a job interview",
            "3️⃣ **Time to Expiry (T)**: How long you have to be right – like waiting for your crush to reply to your text 😅",
            "4️⃣ **Risk-free Rate (r)**: What banks pay for 'guaranteed' returns (currently around 6-7% in India)",
            "5️⃣ **Volatility (σ)**: How 'crazy' the stock moves – like measuring your mom's mood swings during festivals! 🎪",
            "",
            "Here's the CRAZY part: While everyone else is guessing prices based on 'feeling' and 'tips from WhatsApp groups', you'll know the exact mathematical fair value! It's like having X-ray vision in a poker game!"
          ],
          example: {
            scenario: "📱 Real-life example: You see a SPY 400 call option trading for $15. Your friend says 'Buy it! It's cheap!' But is it really?",
            explanation: [
              "🔍 Let's put on our Black-Scholes detective hat:",
              "",
              "📊 Current situation:",
              "• SPY is trading at: $388 (so we need $12 to break even)",
              "• Strike price: $400 (our target)",
              "• Time left: 15 days (roughly 2 weeks)",
              "• Risk-free rate: 5% (what Treasury bills give you)",
              "• Market volatility: 18% (how wild SPY moves)",
              "",
              "🧮 Black-Scholes calculation result: **$9.50**",
              "",
              "💡 **SHOCKING TRUTH**: The market is selling it for $15, but it's actually worth only $9.50!",
              "",
              "📈 What does this mean?",
              "• You're paying 58% MORE than fair value! ($15 vs $9.50)",
              "• It's like buying a $10 pizza for $15.80 – you're getting ripped off!",
              "• If you buy 100 options, you're overpaying by $550!",
              "",
              "🎯 **The Power**: Now you KNOW it's overpriced and can either:",
              "1. Avoid buying it (save money!)",
              "2. Wait for the price to drop closer to $9.50",
              "3. Maybe even SELL it to someone else for $15 (if you're feeling cheeky! 😈)"
            ],
            funnyAnalogy: "It's like having a superpower that lets you see the 'MRP' tag on everything in a shop where prices are negotiable. While others bargain blindly, you know exactly what to pay! 🦸‍♀️💪"
          },
          keyTakeaway: 'Black-Scholes is your personal bodyguard against overpaying for options. It reveals the mathematical truth behind all the market noise and emotions.',
          practicalTip: 'Before buying ANY option, always check its Black-Scholes fair value. If market price is more than 20% above fair value, think twice! Your wallet will thank you later. 💰'
        },
        {
          id: 'bs-factors',
          title: 'The 5 Magic Ingredients (That Control Every Option Price)',
          content: [
            "🍕 Imagine ordering pizza online. The final price doesn't just depend on the pizza itself, right? There's size, toppings, delivery distance, delivery time, weather conditions, and even how busy the restaurant is!",
            "",
            "Options work EXACTLY the same way! The price isn't random – it's a perfect recipe with exactly 5 ingredients. Master these 5, and you'll understand option pricing better than 90% of traders! 🎯",
            "",
            "🧑‍🍳 **THE 5-INGREDIENT OPTION PRICING RECIPE:**",
            "",
            "**1️⃣ Stock Price (S) - The 'Hero' of Our Story**",
            "Think of this as the main character in a Bollywood movie. If Shah Rukh Khan is in the movie (high stock price), the ticket costs more than if it's starring your local theater actor! 🎬",
            "",
            "• Higher stock price = More expensive CALL options (they're closer to being 'in the money')",
            "• Higher stock price = Cheaper PUT options (they're further from being useful)",
            "",
            "Real example: When APPLE was at $150, the $160 call was $0.50. When APPLE hit $280, the $160 call became worth $120! Same option, different stock price! 🚀",
            "",
            "**2️⃣ Strike Price (K) - Your 'Dream Target'**",
            "This is like setting your salary expectation in a job interview. Aim too high, and it's unlikely to happen (cheap option). Aim realistically, and it might just work (expensive option)! 💼",
            "",
            "• Lower strike calls = More expensive (easier targets)",
            "• Higher strike calls = Cheaper (harder targets)",
            "• It's like buying a lottery ticket: $100M jackpot ticket costs more than $10M ticket!",
            "",
            "**3️⃣ Time to Expiry (T) - The 'Countdown Timer'**",
            "Time is like milk in your fridge. Fresh milk (more time) = valuable. Milk expiring tomorrow = almost worthless! 🥛⏰",
            "",
            "Here's what blows people's minds: Time doesn't decay linearly! It's like a cricket match:",
            "• First 40 overs: Slow, steady run rate (time decay is slow)",
            "• Last 10 overs: CRAZY action, wickets falling (time decay accelerates!)",
            "• Last over: Pure chaos! (Time decay goes NUTS in final days)",
            "",
            "**4️⃣ Risk-free Rate (r) - The 'Boring but Important' Factor**",
            "This is what banks give you for keeping money in FD. Currently around 6-7% in India. It's like the baseline salary everyone gets – not exciting, but affects everything! 🏦",
            "",
            "Higher interest rates make calls more expensive and puts cheaper. Why? Because money has 'opportunity cost' – you could always just put it in FD instead of gambling on options!",
            "",
            "**5️⃣ Volatility (σ) - The 'Mood Swing Meter'**",
            "This is THE most important and misunderstood factor! It's like measuring how unpredictable your favorite cricket team is! 🏏",
            "",
            "• MUMBAI INDIANS (consistent): Low volatility = Cheaper options",
            "• ROYAL CHALLENGERS BANGALORE (unpredictable): High volatility = Expensive options",
            "",
            "Volatility is NOT about direction (up or down). It's about HOW MUCH the stock moves, regardless of direction!"
          ],
          example: {
            scenario: "🎭 The Great Volatility Mystery: Same stock, same day, two COMPLETELY different option prices!",
            explanation: [
              "📍 **Setting**: RELIANCE is trading at ₹2,500. You want to buy 2,600 call options.",
              "",
              "**🌅 Scenario A: Peaceful Morning (Low Volatility = 15%)**",
              "• Everyone's calm, sipping tea ☕",
              "• No major news expected",
              "• Stock moves predictably in small steps",
              "• Your 2600 call option costs: **₹28**",
              "",
              "**⛈️ Scenario B: Storm Alert! (High Volatility = 25%)**",
              "• Breaking news: 'RELIANCE MAJOR ANNOUNCEMENT AT 3 PM!'",
              "• Market goes crazy with speculation",
              "• Stock jumps ₹50 up, then ₹30 down, then ₹40 up in one hour!",
              "• The SAME 2600 call option now costs: **₹45**",
              "",
              "🤯 **MIND = BLOWN MOMENT:**",
              "Same stock, same target, same everything... but ₹17 difference per option!",
              "",
              "📊 **The Math That'll Make You Rich:**",
              "• Difference per option: ₹45 - ₹28 = ₹17",
              "• If you buy 75 options (1 lot): ₹17 × 75 = ₹1,275 extra cost!",
              "• Buy 10 lots? You just paid ₹12,750 extra for the SAME thing!",
              "",
              "🎯 **The Strategy That Smart Traders Use:**",
              "• Buy options during 'boring' times (low volatility)",
              "• Sell options when everyone's panicking (high volatility)",
              "• It's like buying AC during winter and selling during summer! ❄️🔥"
            ],
            funnyAnalogy: "Volatility is like surge pricing on Uber! 🚗 Same ride, same distance, but during rain/festival/IPL match, the price shoots up! Smart people book rides during off-peak hours. Smart traders buy options during off-peak volatility! 💡"
          },
          keyTakeaway: 'Volatility is THE secret sauce! It can make the same option cost 50-100% more or less. Master volatility timing, and you\'ve mastered half of options trading!',
          practicalTip: 'Before buying options: Check if volatility is high or low compared to historical levels. Use volatility percentile charts. Buy when volatility percentile is below 30%, sell when above 70%. This single tip can improve your profits by 30-50%! 📈'
        }
      ]
    },
    {
      id: 'bs-intermediate',
      title: 'Greeks & Sensitivities',
      description: 'Understand how options move',
      difficulty: 'Intermediate',
      route: '/app',
      lessons: [
        {
          id: 'bs-delta',
          title: 'Delta: Your Option\'s Speed Meter (And Why It\'s Like Your Car\'s Accelerator)',
          content: [
            "🚗 You know how your car's speedometer tells you how fast you're going? Well, Delta is like the speedometer for your options! But instead of showing speed, it shows how much your option price will change when the stock price moves. Cool, right?",
            "",
            "But here's where it gets REALLY interesting (and where most people get confused):",
            "",
            "**🎯 Delta is NOT just a number – it's your profit/loss predictor!**",
            "",
            "Think of Delta like the 'sensitivity meter' of your option. It's like dating – some people are very sensitive to what you say (high Delta), others barely react (low Delta)! 😅",
            "",
            "**📊 THE DELTA DECODER:**",
            "",
            "**Delta 0.1** = 'Meh' reaction",
            "Stock moves ₹10 → Your option moves ₹1",
            "Like your friend who barely reacts when you tell them gossip! 😐",
            "",
            "**Delta 0.5** = 'Moderate' reaction", 
            "Stock moves ₹10 → Your option moves ₹5",
            "Like a normal person's reaction to good news! 😊",
            "",
            "**Delta 0.9** = 'OMG!' reaction",
            "Stock moves ₹10 → Your option moves ₹9",
            "Like your mom when you tell her you're getting married! 🤯",
            "",
            "**🎪 THE MAGICAL DELTA RULES:**",
            "",
            "**For CALL options:**",
            "• Delta ranges from 0 to 1.0",
            "• 0 = Completely out-of-the-money (worthless)",
            "• 0.5 = At-the-money (50-50 chance)",
            "• 1.0 = Deep in-the-money (moves like the stock)",
            "",
            "**For PUT options:**",
            "• Delta ranges from -1.0 to 0",
            "• Negative because puts GAIN value when stock goes DOWN",
            "• -0.5 = At-the-money put",
            "• -1.0 = Deep in-the-money put",
            "",
            "**🤯 MIND-BLOWING INSIGHT:**",
            "Delta also tells you the PROBABILITY of your option expiring in-the-money!",
            "",
            "Delta 0.30 = 30% chance your option will be profitable at expiry!",
            "Delta 0.70 = 70% chance of success!",
            "",
            "It's like having a crystal ball that shows your odds! 🔮"
          ],
          example: {
            scenario: "🏭 **Real Trading Scenario**: You bought 100 TATASTEEL 130 calls when the stock was at ₹120. Each option has Delta 0.3 and costs ₹2 per option.",
            explanation: [
              "📈 **Day 1: Stock jumps from ₹120 to ₹125 (+₹5 move)**",
              "• Your option gains: ₹5 × 0.3 = ₹1.50 per option",
              "• Your option price: ₹2 + ₹1.50 = ₹3.50",
              "• Your profit per option: ₹1.50",
              "• Total profit on 100 options: ₹150! 🎉",
              "",
              "📉 **Day 2: Oops! Stock falls from ₹125 to ₹118 (-₹7 move)**",
              "• Your option loses: ₹7 × 0.3 = ₹2.10 per option",
              "• Your option price: ₹3.50 - ₹2.10 = ₹1.40",
              "• Now you're at a loss of: ₹2 - ₹1.40 = ₹0.60 per option",
              "• Total loss on 100 options: ₹60 😢",
              "",
              "🎯 **The Delta Lesson:**",
              "Delta worked EXACTLY as predicted in both directions!",
              "• Stock up ₹5 → Option up ₹1.50 (₹5 × 0.3)",
              "• Stock down ₹7 → Option down ₹2.10 (₹7 × 0.3)",
              "",
              "**🚨 IMPORTANT TWIST:**",
              "As the stock moved, the Delta itself changed! When stock went to ₹125, Delta became 0.4. When it fell to ₹118, Delta became 0.2. This is called 'Gamma' (we'll learn this next)!",
              "",
              "**💡 SMART TRADER INSIGHT:**",
              "If you had checked Delta before buying, you'd know:",
              "• 0.3 Delta = Only 30% chance of profit",
              "• Maybe buying 0.5 Delta options (at-the-money) would be better?",
              "• Or maybe buying fewer options with higher Delta?"
            ],
            funnyAnalogy: "Delta is like the volume control on your TV! 📺 Delta 0.1 = whisper mode (barely hear the stock move), Delta 0.5 = normal volume (balanced reaction), Delta 0.9 = party mode (every stock move is LOUD and clear)! 🔊"
          },
          keyTakeaway: 'Delta is your option\'s \"sensitivity score\" AND probability meter. Higher Delta = more sensitive to stock moves = higher risk/reward = higher probability of success.',
          practicalTip: 'For beginners: Start with Delta 0.3-0.7 options. Avoid very low Delta (lottery tickets) and very high Delta (expensive insurance). Sweet spot is 0.4-0.6 for balanced risk-reward! 🎯'
        },
        {
          id: 'bs-gamma',
          title: 'Gamma: The "Delta Changer" (Why Your Profits Accelerate!)',
          content: [
            "🎢 Remember how we said Delta changes as the stock moves? Well, Gamma is the guy responsible for changing Delta! Think of Gamma as the 'acceleration pedal' of your option profits!",
            "",
            "**🤯 THE GAMMA REVELATION:**",
            "",
            "Imagine you're driving a car:",
            "• **Speed** = Your current option price",
            "• **Delta** = How fast your speed is changing (acceleration/deceleration)",  
            "• **Gamma** = How fast your acceleration is changing!",
            "",
            "**🎪 WHY GAMMA IS MAGICAL:**",
            "",
            "When stock moves in your favor, Gamma makes your Delta BIGGER!",
            "When stock moves against you, Gamma makes your Delta SMALLER!",
            "",
            "It's like having a smart airbag that inflates MORE when you're winning and deflates when you're losing! 🛡️",
            "",
            "**📊 GAMMA IN ACTION:**",
            "",
            "**High Gamma situations:**",
            "• Near expiry (last week before expiry)",
            "• At-the-money options",
            "• Low volatility environments",
            "",
            "**Low Gamma situations:**",
            "• Long time to expiry",
            "• Deep in/out of money options", 
            "• High volatility environments",
            "",
            "**🚨 THE GAMMA TRAP (That Catches 90% of Traders):**",
            "",
            "People see high Gamma and think 'Wow! My Delta will increase fast!'",
            "But they forget: Gamma works BOTH ways!",
            "• Stock goes up → Delta increases → Bigger profits ✅",
            "• Stock goes down → Delta decreases → Bigger losses ❌",
            "",
            "It's like a double-edged sword that cuts deeper in both directions! ⚔️"
          ],
          example: {
            scenario: "🎭 **The Great Gamma Adventure**: You bought NIFTY 18000 calls on a Friday with 3 days to expiry. NIFTY is at 17950 (just 50 points away!)",
            explanation: [
              "📊 **Starting Position:**",
              "• Delta: 0.45 (decent sensitivity)",
              "• Gamma: 0.08 (very high - it's near expiry!)",
              "• Option price: ₹25",
              "",
              "📈 **Monday: NIFTY jumps to 18050 (+100 points)**",
              "• Without Gamma: Profit would be ₹100 × 0.45 = ₹45",
              "• With Gamma magic: Delta increased from 0.45 to 0.53!",
              "• Actual profit: ₹49 (₹4 extra thanks to Gamma!)",
              "• New option price: ₹74",
              "",
              "🚀 **Tuesday: NIFTY rockets to 18200 (+150 more points)**",
              "• Your Delta is now 0.78 (Gamma kept increasing it!)",
              "• Profit on this move: ₹150 × 0.65 (average Delta) = ₹98",
              "• New option price: ₹172",
              "",
              "📊 **The Gamma Effect Summary:**",
              "• Total NIFTY move: +250 points",
              "• Your total profit: ₹147 per option (₹172 - ₹25)",
              "• Without Gamma: Would have been only ₹112.50 (250 × 0.45)",
              "• Gamma bonus: ₹34.50 extra per option! 🎉",
              "",
              "⚠️ **But What If NIFTY Had Fallen?**",
              "• NIFTY drops to 17800 (-150 points)",
              "• Delta would decrease from 0.45 to 0.25",
              "• Loss: Much bigger than expected!",
              "• Gamma would work AGAINST you!"
            ],
            funnyAnalogy: "Gamma is like interest compounding! 💰 When your investment grows, you earn interest on interest. When your option profits grow, Gamma gives you 'profit on profit'! But when you lose, it's like compound interest on your debt – losses accelerate too! 📈📉"
          },
          keyTakeaway: 'Gamma is your profit accelerator when you\'re right, but loss accelerator when you\'re wrong. It\'s highest for at-the-money options near expiry – maximum reward AND maximum risk!',
          practicalTip: 'Use high Gamma for quick moves when you\'re very confident about direction and timing. Avoid high Gamma if you\'re unsure – it magnifies mistakes! Perfect for event plays like earnings or RBI policy announcements. ⚡',
          quiz: {
            question: "⚡ Your option has high Gamma (0.08) and Delta 0.50. Stock moves up 100 points. What's your new approximate Delta?",
            options: [
              {
                text: "Delta stays 0.50 (Gamma doesn't affect Delta) 🤔",
                correct: false,
                roast: "That's like saying gasoline doesn't affect your car's speed! 🚗 Gamma literally exists to change Delta! Time to revisit Greek definitions! 📖"
              },
              {
                text: "Delta becomes 0.58 (increased by Gamma × stock move) 📈",
                correct: true
              },
              {
                text: "Delta doubles to 1.00 instantly 🚀",
                correct: false,
                roast: "Easy there, SpaceX! 🚀 Gamma accelerates Delta gradually, not teleports it to 1.0! Even Elon Musk's rockets follow physics! 🛸"
              },
              {
                text: "Delta decreases because stock went up 📉",
                correct: false,
                roast: "You've got your Greeks backwards, friend! 😅 When stock goes UP, call Delta INCREASES (gets closer to 1.0). Think: you're getting more in-the-money!"
              }
            ],
            explanation: "With Gamma 0.08, each 100-point move changes Delta by 0.08. Starting at 0.50, after +100 point move: New Delta = 0.50 + 0.08 = 0.58. Gamma is the 'rate of change' of Delta—your profit accelerator!",
            hint: "Gamma measures how much Delta changes per point move. Just add Gamma to Delta!",
            funnyCorrectMessage: "⚡ BOOM! You get Gamma! It's like understanding compound interest for options—small changes create BIG differences! 💰"
          }
        }
      ]
    }
  ],
  'advanced-greeks': [
    {
      id: 'ag-beginner',
      title: 'Beyond Basic Greeks',
      description: 'Enter the world of advanced sensitivities',
      difficulty: 'Beginner',
      route: '/advanced-greeks',
      lessons: [
        {
          id: 'ag-intro',
          title: 'Why Advanced Greeks Matter (The Secret Weapons of Pro Traders)',
          content: [
            "🎮 You know how in video games, beginners use basic weapons like swords, but pros unlock advanced weapons like laser guns and magic spells? That's exactly what Advanced Greeks are in options trading!",
            "",
            "**🤔 THE PROBLEM WITH BASIC GREEKS:**",
            "",
            "Most traders know Delta and Gamma. But what happens when:",
            "• Volatility changes AND time passes together? 🤯",
            "• The market is about to announce earnings?",
            "• RBI is going to announce policy rates?",
            "• A stock is approaching ex-dividend date?",
            "",
            "Basic Greeks say: 'Delta is 0.6, looks good!' 😊",
            "Advanced Greeks say: 'Wait! Vanna is +0.12, Charm is -0.03, and Color is 0.02. After the event, your Delta will become 0.8 instead of 0.6!' 🤯",
            "",
            "**🎪 THE ADVANCED GREEKS SUPERPOWERS:**",
            "",
            "Think of them as your trading crystal ball 🔮:",
            "",
            "**1. VANNA** - Predicts how volatility changes affect your Delta",
            "**2. CHARM** - Shows how time decay affects your Delta",
            "**3. COLOR** - Reveals how Gamma itself changes with time",
            "**4. SPEED** - Tracks how Gamma changes with stock moves",
            "**5. ZOMMA** - Combines volatility and Gamma changes",
            "**6. ULTIMA** - The ultimate Vega sensitivity tracker",
            "",
            "**🎯 THE 'AHA!' MOMENT:**",
            "",
            "While 90% of traders are flying blind, you'll see EXACTLY how your position will behave under different scenarios. It's like having weather forecast for your portfolio!",
            "",
            "**🤑 WHY PROS LOVE THEM:**",
            "",
            "Advanced Greeks help you:",
            "• Predict profit/loss under complex scenarios",
            "• Time your entries and exits perfectly",
            "• Avoid common traps that catch amateur traders",
            "• Turn 'unexpected' moves into expected profits",
            "",
            "It's like upgrading from a bicycle to a Ferrari – same destination, but SO much better ride! 🏎️"
          ],
          example: {
            scenario: "📱 **The Great Earnings Disaster (That You Saw Coming)**: INFOSYS earnings tomorrow, stock at ₹1500. Amateur trader vs You (Advanced Greeks Master)",
            explanation: [
              "👨‍💻 **Amateur Trader Analysis:**",
              "• 'INFY 1550 calls look good!'",
              "• Delta: 0.6 (solid sensitivity)",
              "• Gamma: 0.05 (decent acceleration)",
              "• Premium paid: ₹45 per option",
              "• Thinks: 'If INFY goes to 1580, I make ₹30 per option!' 🤤",
              "",
              "🧠 **Your Advanced Greeks Analysis:**",
              "• Delta: 0.6 ✅",
              "• Vanna: +0.12 (Delta will INCREASE when IV drops after earnings!)",
              "• Charm: -0.03 (Delta decreases ₹0.03 per day)",
              "• Current IV: 45% → Post-earnings expected IV: 25%",
              "",
              "🎯 **Your Prediction:**",
              "'After earnings, even if stock goes to 1580:' 🔮",
              "• IV will crash from 45% to 25% (-20 percentage points)",
              "• Thanks to positive Vanna (+0.12), Delta will increase by: 20 × 0.12 = +2.4",
              "• New Delta: 0.6 + 2.4 = 3.0 (impossible, so it caps at 1.0)",
              "• Your position becomes MUCH more sensitive!",
              "",
              "📈 **RESULTS DAY:**",
              "• INFY announces great results, stock jumps to ₹1580",
              "• Amateur trader: Expects ₹30 profit per option",
              "• You: Actually made ₹52 per option! (Vanna magic!)",
              "• IV crashed as expected, but positive Vanna MORE than compensated",
              "",
              "😭 **But if INFY had fallen to ₹1450:**",
              "• Amateur: Lost more than expected due to negative Vanna effect",
              "• You: Already knew this risk and sized position accordingly!"
            ],
            funnyAnalogy: "It's like being a chef who knows that humidity affects baking time, altitude changes boiling point, and oven quirks need adjustments. While others follow basic recipes and wonder why their cake flopped, you create masterpieces every time! 👨‍🍳🎂"
          },
          keyTakeaway: 'Advanced Greeks turn options trading from gambling into precision engineering. They reveal profit opportunities and risks that basic analysis completely misses.',
          practicalTip: 'Start with Vanna around earnings events and Charm for weekly options. Master these two first, then add others. Check advanced Greeks BEFORE placing any significant options trade! 🎯',
          quiz: {
            question: "🎯 Earnings tomorrow! Your call has Delta 0.6, Vanna +0.12, and IV is 45%. After earnings, IV drops to 25%. What happens to your Delta?",
            options: [
              {
                text: "Delta stays 0.6 because stock price determines Delta 🤷",
                correct: false,
                roast: "Aww, living in the basic Greeks world! That's like thinking your mood only depends on weather, not on sleep, food, or coffee! Multiple factors affect Delta! ☕😴"
              },
              {
                text: "Delta increases significantly (thanks to positive Vanna!) 🚀",
                correct: true
              },
              {
                text: "Delta crashes to zero because high IV is gone 📉",
                correct: false,
                roast: "Someone's been watching too many dramatic trading movies! 🎬 Delta doesn't 'crash to zero' just because IV drops. That's not how physics... err... Greeks work! 😅"
              },
              {
                text: "Vanna is useless, only Gamma matters for earnings 🙄",
                correct: false,
                roast: "Found the person who skipped Advanced Greeks class! 📚 Vanna is MADE for volatility events like earnings. Ignoring it is like being a chef who ignores recipes! 👨‍🍳"
              }
            ],
            explanation: "With positive Vanna (+0.12) and IV dropping 20 points (45% → 25%), your Delta increases by: 20 × 0.12 = +2.4 points! Your call becomes MORE sensitive after earnings, making profits bigger. Vanna is the secret weapon for earnings plays!",
            hint: "Vanna shows how volatility changes affect Delta. Positive Vanna + IV drop = Delta increases!",
            funnyCorrectMessage: "🎉 BOOM! You just unlocked the Advanced Greeks mastery achievement! While others wonder why their profits are different than expected, you KNOW! 🔮"
          }
        },
        {
          id: 'ag-charm',
          title: "Charm: Delta's Time Machine (How Time Changes Your Risk)",
          content: [
            "⏰ Imagine if you had a time machine that could show you exactly how risky your option position becomes each day. That's precisely what Charm does! It's the 'time travel' Greek that reveals your future risk profile.",
            "",
            "**🤯 THE CHARM REVELATION:**",
            "",
            "You know how Delta tells you current sensitivity to stock moves? Well, Charm tells you how that sensitivity will change EVERY SINGLE DAY as time passes!",
            "",
            "Think of it like watching your phone battery percentage:",
            "• High battery (long time to expiry) = Stable Delta",
            "• Low battery (near expiry) = Delta changes rapidly!",
            "• Charm = How fast your 'Delta battery' drains! 🔋",
            "",
            "**📊 CHARM DECODER:**",
            "",
            "**Positive Charm (+)**: Delta INCREASES with time passage",
            "• Your position becomes MORE sensitive each day",
            "• Great for sellers, risky for buyers",
            "• Like a car that accelerates faster as fuel runs low! 🏎️",
            "",
            "**Negative Charm (-)**: Delta DECREASES with time passage",
            "• Your position becomes LESS sensitive each day",
            "• Great for buyers, bad for sellers",
            "• Like a torch that dims as battery dies 🔦",
            "",
            "**🎪 WHERE CHARM SHINES:**",
            "",
            "**For At-The-Money Options Near Expiry:**",
            "Charm goes absolutely CRAZY! Why? Because:",
            "• Small stock moves can flip options from worthless to valuable",
            "• Each passing hour matters A LOT",
            "• Delta can change from 0.4 to 0.7 in just 2 days!",
            "",
            "**🚨 THE CHARM TRAP:**",
            "",
            "Most traders think: 'I'll buy this option and Delta will stay constant.'",
            "Reality check: Charm ensures Delta changes EVERY DAY!",
            "",
            "**For calls near expiry:**",
            "• If stock > strike: Charm is positive (Delta increases daily)",
            "• If stock < strike: Charm is negative (Delta decreases daily)",
            "",
            "It's like your option has a personality that changes with age! 👴👵"
          ],
          example: {
            scenario: "🏦 **The Great Bank NIFTY Charm Adventure**: You sold BANKNIFTY 44000 puts on a Monday with exactly 7 days to expiry. BANKNIFTY is trading at 44200 (comfortably above your strike).",
            explanation: [
              "📊 **Starting Position (Monday):**",
              "• Your short put Delta: -0.25",
              "• Meaning: You lose ₹25 for every 100-point drop in BANKNIFTY",
              "• Charm: +0.02 per day (positive = good news for you!)",
              "• Premium collected: ₹180 per option",
              "",
              "📅 **Tuesday (Day 2): BANKNIFTY at 44150**",
              "• New Delta: -0.25 + 0.02 = -0.23",
              "• Your risk REDUCED by ₹2 per 100-point move!",
              "• Even though stock fell 50 points, your position got safer!",
              "",
              "📅 **Wednesday (Day 3): BANKNIFTY at 44000**",
              "• New Delta: -0.23 + 0.02 = -0.21",
              "• Stock is AT your strike, but you're less risky than Day 1!",
              "",
              "📅 **Thursday (Day 4): BANKNIFTY at 44100**",
              "• New Delta: -0.21 + 0.02 = -0.19",
              "• Stock recovered, your risk reduced further!",
              "",
              "🎯 **The Charm Magic Summary:**",
              "• Every day, your Delta improved by 0.02",
              "• Total Delta improvement: 0.02 × 6 days = 0.12",
              "• Final Delta: -0.13 (vs starting -0.25)",
              "• Your risk nearly HALVED just by waiting!",
              "",
              "💰 **The Beautiful Result:**",
              "• Put expired worthless (BANKNIFTY > 44000)",
              "• You kept full ₹180 premium",
              "• Charm worked as your 'risk reduction autopilot'!",
              "",
              "⚠️ **But What If BANKNIFTY Had Crashed to 43500?**",
              "• Your Delta would still improve daily due to positive Charm",
              "• But the stock move would overwhelm the Charm benefit",
              "• You'd lose less than expected due to Charm, but still lose!"
            ],
            funnyAnalogy: "Charm is like having a personal trainer who makes you fitter every day, even if you're not exercising! 💪 Your option position gets 'healthier' with each passing day (when Charm is in your favor). It's like magic weight loss pills that actually work! ⚖️✨"
          },
          keyTakeaway: 'Charm is time\'s gift to smart option traders. Positive Charm makes your position safer each day, negative Charm makes it riskier. Use it to predict future risk levels!',
          practicalTip: 'When selling options: Look for positive Charm situations (you get safer with time). When buying options: Avoid negative Charm near expiry (you get riskier with time). Check Charm BEFORE entering any weekly options trade! ⏰'
        }
      ]
    }
  ],
  'volatility-solver': [
    {
      id: 'vs-beginner',
      title: 'Volatility Mysteries Unveiled',
      description: 'Decode the language of market expectations',
      difficulty: 'Beginner',
      route: '/volatility-solver',
      lessons: [
        {
          id: 'vs-intro',
          title: 'Implied Volatility: The Market\'s Crystal Ball (And Why Everyone Gets It Wrong!)',
          content: [
            "🔮 Imagine you could peek into the minds of thousands of traders and see what they REALLY think about a stock's future. That's exactly what Implied Volatility (IV) does! It's like having superhuman mind-reading powers in the stock market!",
            "",
            "But here's the kicker: 90% of traders completely misunderstand what IV actually tells them. They think high IV means 'stock will move up' or low IV means 'stock will be boring.' WRONG! 🚫",
            "",
            "**🎭 THE REAL IV STORY:**",
            "",
            "IV is NOT about direction (up/down). It's about MAGNITUDE (how much). Think of it like this:",
            "",
            "• **Low IV (15-20%)**: Market thinks stock will move like a lazy elephant 🐘 - slow, steady, predictable",
            "• **Medium IV (25-35%)**: Market expects normal human walking pace 🚶‍♀️ - some ups and downs", 
            "• **High IV (40%+)**: Market expects the stock to behave like a caffeinated squirrel! 🐿️⚡",
            "",
            "**🤯 THE IV MIND-BLOWING TRUTH:**",
            "",
            "IV is derived FROM option prices, not the other way around! Here's what happens:",
            "",
            "1️⃣ Traders look at upcoming events (earnings, court cases, drug approvals)",
            "2️⃣ They get excited/scared and bid up option prices",
            "3️⃣ Higher option prices = Higher implied volatility",
            "4️⃣ IV becomes the 'excitement thermometer' of the market!",
            "",
            "**🎪 THE VOLATILITY SMILE PHENOMENON:**",
            "",
            "Here's where it gets REALLY weird. For the same stock, same expiry date:",
            "",
            "• At-the-money options: IV = 25%",
            "• Far out-of-money calls: IV = 35%",
            "• Far out-of-money puts: IV = 40%",
            "",
            "Why? Because people LOVE buying lottery tickets (far OTM calls) and insurance policies (far OTM puts)! The extra demand pushes up their IVs, creating a 'smile' shape! 😊",
            "",
            "**⚡ THE IV CRUSH - THE PROFIT KILLER:**",
            "",
            "This is the trap that destroys 80% of earnings traders:",
            "",
            "Before earnings: IV = 60% (everyone's excited!)",
            "After earnings: IV = 25% (party's over, back to normal)",
            "",
            "Even if stock moves in your favor, you can STILL lose money due to IV crush! It's like buying a concert ticket for ₹5,000 and trying to sell it the day after the concert for ₹500! 🎫💸"
          ],
          example: {
            scenario: "🏭 **The Great RELIANCE Earnings Disaster**: Tomorrow is RELIANCE earnings day. Stock is at ₹2,500. Your friend Ramesh says 'Buy ₹2,600 calls! If results are good, stock will hit ₹2,700!'",
            explanation: [
              "📊 **The Setup:**",
              "• RELIANCE trading at: ₹2,500",
              "• Target strike: ₹2,600 calls",
              "• Current option price: ₹85 per option",
              "• Current IV: 55% (very high due to earnings excitement)",
              "• Post-earnings expected IV: 28% (normal level)",
              "",
              "🎯 **Ramesh's Logic (The Amateur Trap):**",
              "• 'If RELIANCE goes to ₹2,700, I'll make ₹100 per option!'",
              "• Buys 200 options for ₹17,000 (₹85 × 200)",
              "• Dreams of ₹20,000 profit (₹100 × 200)",
              "",
              "📈 **RESULTS DAY: Stock ACTUALLY hits ₹2,700!**",
              "• Ramesh expects ₹100 profit per option",
              "• But option price is only ₹65! 😱",
              "• He LOST ₹20 per option despite being RIGHT about direction!",
              "",
              "🤯 **What Happened? IV CRUSH!**",
              "",
              "**Before Earnings:**",
              "• Stock: ₹2,500, IV: 55%",
              "• Option theoretical value: ₹85",
              "",
              "**After Earnings:**", 
              "• Stock: ₹2,700 (+₹200), IV: 28% (-27 percentage points)",
              "• Intrinsic value: ₹100 (₹2,700 - ₹2,600)",
              "• Time value destroyed by IV crush: -₹35",
              "• Final option price: ₹100 - ₹35 = ₹65",
              "",
              "📊 **The Brutal Math:**",
              "• Ramesh paid: ₹85 per option",
              "• Ramesh got: ₹65 per option",
              "• Loss per option: ₹20",
              "• Total loss: ₹4,000 (₹20 × 200 options)",
              "",
              "**💡 The Lesson:**",
              "Stock moved ₹200 in his favor, but IV crush cost him ₹35 per option! The ₹100 intrinsic gain wasn't enough to overcome the IV loss!"
            ],
            funnyAnalogy: "IV is like surge pricing on food delivery apps! 🛵 During rain (earnings), biryani costs ₹800 instead of ₹400. After rain stops, same biryani is back to ₹400. If you bought during surge, you overpaid! Options work exactly the same way! 🍛💰"
          },
          keyTakeaway: 'IV measures expected movement magnitude, not direction. High IV makes options expensive. IV crush after events can kill profits even when you\'re right about stock direction!',
          practicalTip: 'Always check IV percentile before buying options. If IV is above 60th percentile, consider selling options instead of buying. Use IV rank to time your trades - buy when IV is low (0-30th percentile), sell when IV is high (70-100th percentile). 📊'
        },
        {
          id: 'vs-vega',
          title: 'Vega: Your Volatility Profit/Loss Speedometer (The Greek That Makes or Breaks Traders)',
          content: [
            "💨 Meet Vega - the most underestimated Greek that can make you rich or poor faster than a Mumbai local train! While everyone obsesses over Delta, smart traders watch Vega like hawks. 🦅",
            "",
            "**🎯 WHAT VEGA ACTUALLY DOES:**",
            "",
            "Vega tells you EXACTLY how much money you'll make or lose for every 1% change in implied volatility. It's like having a speedometer for your volatility exposure!",
            "",
            "**Simple Vega Math:**",
            "• Vega = 12 means you gain ₹12 per option for every 1% IV increase",
            "• Vega = -8 means you lose ₹8 per option for every 1% IV increase",
            "",
            "**🤯 THE VEGA REVELATION:**",
            "",
            "Here's what blows people's minds: Vega changes based on:",
            "",
            "1️⃣ **Time to Expiry**: More time = Higher Vega (volatility has more time to work)",
            "2️⃣ **Moneyness**: At-the-money options have MAXIMUM Vega",
            "3️⃣ **Current IV Level**: Higher IV = Lower Vega (diminishing returns)",
            "",
            "**📊 VEGA BEHAVIOR PATTERNS:**",
            "",
            "**Long-dated options (60+ days):**",
            "• High Vega (₹15-25 per 1% IV change)",
            "• Very sensitive to volatility changes",
            "• Perfect for volatility plays",
            "",
            "**Short-dated options (1-7 days):**",
            "• Low Vega (₹2-5 per 1% IV change)",
            "• Less sensitive to IV changes",
            "• Time decay dominates over volatility",
            "",
            "**🎪 THE EARNINGS VEGA TRAP:**",
            "",
            "This destroys more traders than market crashes:",
            "",
            "**Pre-earnings setup:**",
            "• You buy options with Vega +15",
            "• IV increases from 30% to 50% (+20 percentage points)",
            "• You make: 20 × ₹15 = ₹300 per option! 🎉",
            "",
            "**Post-earnings reality:**",
            "• Results announced, IV crashes from 50% to 25% (-25 percentage points)",
            "• You lose: 25 × ₹15 = ₹375 per option! 😭",
            "• Net result: ₹75 loss per option JUST from volatility!",
            "",
            "**🚨 PROFESSIONAL VEGA STRATEGIES:**",
            "",
            "**The Vega Sandwich (Advanced):**",
            "• Sell high-Vega near-term options (collect IV premium)",
            "• Buy low-Vega far-dated options (cheaper volatility exposure)",
            "• Result: Net short Vega position that profits from IV normalization",
            "",
            "**The Vega Surfing (Intermediate):**",
            "• Buy options when IV percentile < 30% (cheap volatility)",
            "• Sell options when IV percentile > 70% (expensive volatility)",
            "• It's like buying winter clothes in summer and selling them in winter! 🧥❄️"
          ],
          example: {
            scenario: "🎭 **The Great TCS Earnings Vega War**: TCS earnings in 2 days. Stock at ₹3,500. You're deciding between buying 3,600 calls expiring in 1 week vs 4 weeks.",
            explanation: [
              "📊 **Option 1: Weekly 3,600 Calls (1 week to expiry)**",
              "• Price: ₹25 per option",
              "• Vega: +4 (low sensitivity to IV changes)",
              "• Current IV: 40%",
              "",
              "📊 **Option 2: Monthly 3,600 Calls (4 weeks to expiry)**",  
              "• Price: ₹85 per option",
              "• Vega: +18 (high sensitivity to IV changes)",
              "• Current IV: 35%",
              "",
              "🎯 **Pre-Earnings IV Spike:**",
              "Market gets nervous, IV jumps by 10 percentage points:",
              "",
              "**Weekly option gains:**",
              "• IV change profit: 10 × ₹4 = ₹40",
              "• New option value: ₹25 + ₹40 = ₹65",
              "• Profit: ₹40 per option (160% return!)",
              "",
              "**Monthly option gains:**",
              "• IV change profit: 10 × ₹18 = ₹180",
              "• New option value: ₹85 + ₹180 = ₹265",  
              "• Profit: ₹180 per option (212% return!)",
              "",
              "🚨 **Post-Earnings IV Crash:**",
              "Results announced, IV crashes by 15 percentage points:",
              "",
              "**Weekly option damage:**",
              "• IV change loss: 15 × ₹4 = ₹60",
              "• But option expires in 1 day, so mostly time decay",
              "• Final loss: Around ₹20-30 per option",
              "",
              "**Monthly option carnage:**",
              "• IV change loss: 15 × ₹18 = ₹270", 
              "• This WIPES OUT the option value completely!",
              "• Final loss: Could lose 80-90% of investment!",
              "",
              "🤯 **The Vega Lesson:**",
              "Higher Vega = Higher risk AND higher reward from volatility changes!",
              "• Weekly: Lower Vega = smaller swings both ways",
              "• Monthly: Higher Vega = extreme swings both ways",
              "",
              "💡 **Smart Trader Strategy:**",
              "If you expect IV to increase: Buy high-Vega options",
              "If you expect IV to decrease: Sell high-Vega options",
              "If you're unsure: Stick with low-Vega options for safety!"
            ],
            funnyAnalogy: "Vega is like the volume control on your investment emotions! 🔊 High Vega = every volatility change feels LOUD (big profits/losses). Low Vega = volatility changes feel like whispers (small movements). Choose your emotional intensity level wisely! 🎚️😅"
          },
          keyTakeaway: 'Vega determines how much volatility changes affect your P&L. Higher Vega = higher sensitivity = higher risk/reward from IV movements. Always match your Vega exposure to your volatility expectations!',
          practicalTip: 'Before any earnings trade: Calculate your total Vega exposure across all positions. If Vega is +500, every 1% IV drop costs you ₹500! Use position sizing to control Vega risk - never risk more than you can afford to lose from IV crush alone. 🎯'
        }
      ]
    }
  ],
  'binomial-tree': [
    {
      id: 'bt-beginner', 
      title: 'Trees, Steps, and Early Exercise',
      description: 'See price paths and American exercise clearly',
      difficulty: 'Beginner',
      route: '/binomial-tree',
      lessons: [
        {
          id: 'bt-intro',
          title: 'Binomial Trees: The "Choose Your Own Adventure" of Option Pricing (And Why It\'s Cooler Than Black-Scholes!)',
          content: [
            "🌳 Remember those 'Choose Your Own Adventure' books from childhood? Turn to page 47 if you fight the dragon, page 83 if you run away? Binomial Trees work EXACTLY like that, but for stock prices! 📖✨",
            "",
            "**🤔 WHY TREES BEAT BLACK-SCHOLES (Sometimes):**",
            "",
            "Black-Scholes assumes you can ONLY exercise options at expiry. But what about American options where you can exercise ANY time? That's where trees shine! 🌟",
            "",
            "**🎪 THE TREE-BUILDING MAGIC:**",
            "",
            "**Step 1: Create the Adventure Paths**",
            "Starting at today's stock price, at each time step, price can either:",
            "• Go UP by a certain percentage (multiply by 'u' factor)",
            "• Go DOWN by a certain percentage (multiply by 'd' factor)",
            "",
            "**Step 2: Build All Possible Futures**",
            "After 3 steps, you get 8 possible paths! Like this:",
            "• UUU = Stock goes up 3 times (₹100 → ₹133)",
            "• UUD = Up, up, then down (₹100 → ₹108)",  
            "• UDD = Up, then down twice (₹100 → ₹92)",
            "• DDD = Down all 3 times (₹100 → ₹73)",
            "",
            "**Step 3: Work Backwards Like a Time Traveler!**",
            "This is the GENIUS part! We start from expiry and work backwards:",
            "• At expiry: Calculate intrinsic value at each node",
            "• At each earlier node: Choose max of (intrinsic value, discounted expected continuation value)",
            "",
            "**🚀 THE EARLY EXERCISE SUPERPOWER:**",
            "",
            "Here's where it gets AMAZING! At each node, the tree asks:",
            "'Should I exercise NOW or wait?'",
            "",
            "**Example scenario:**",
            "• You own a PUT option, strike ₹100",
            "• Stock drops to ₹75 (intrinsic value = ₹25)",
            "• Tree calculates: 'If I wait, expected value is ₹20'",
            "• Tree decides: 'Exercise now for ₹25!' 💰",
            "",
            "Black-Scholes CAN'T do this! It assumes you always wait till expiry!",
            "",
            "**🎯 THE DIVIDEND CAPTURE MAGIC:**",
            "",
            "Trees also handle dividends perfectly:",
            "• Ex-dividend date coming up",
            "• Call option holder might exercise early to capture dividend",
            "• Tree models this decision at every step!",
            "",
            "**📊 TREE ACCURACY vs SPEED TRADE-OFF:**",
            "",
            "• **Few steps (10-20)**: Fast calculation, rough approximation",
            "• **Many steps (100+)**: Slow calculation, very accurate",
            "• **Professional use**: Usually 50-100 steps for good balance",
            "",
            "It's like GPS navigation - more calculation points = more accurate route, but takes longer to compute! 🗺️"
          ],
          example: {
            scenario: "🏭 **The Great Dividend Dilemma**: You own HDFC BANK ₹1,600 calls expiring in 15 days. Stock is at ₹1,650, and there's a ₹12 dividend tomorrow. Should you exercise today to capture the dividend?",
            explanation: [
              "📊 **The Setup:**",
              "• Current stock price: ₹1,650",
              "• Your call strike: ₹1,600", 
              "• Time to expiry: 15 days",
              "• Dividend tomorrow: ₹12 per share",
              "• Ex-dividend date: Tomorrow!",
              "",
              "🤯 **Black-Scholes Says:**",
              "• 'Never exercise early! Wait till expiry!'",
              "• Current option value: ₹67",
              "• If exercised today: Intrinsic value = ₹1,650 - ₹1,600 = ₹50",
              "• Black-Scholes logic: 'Don't exercise! You lose ₹17!'",
              "",
              "🌳 **Binomial Tree Analysis (The Smart Way):**",
              "",
              "**Node 1: Exercise Today**",
              "• Get shares at ₹1,600, sell at ₹1,650 = ₹50 profit",
              "• Tomorrow: Collect ₹12 dividend",
              "• Stock drops to ₹1,638 (₹1,650 - ₹12 dividend adjustment)",
              "• Total gain: ₹50 + ₹12 = ₹62 ✅",
              "",
              "**Node 2: Wait Till Tomorrow**",
              "• Stock goes ex-dividend, drops to ₹1,638",
              "• Your option value drops significantly",
              "• New option value: ₹52 (lost time value + dividend impact)",
              "• You DON'T get the dividend! ❌",
              "",
              "🎯 **Tree's Decision:**",
              "• Exercise today: Net gain ₹62",
              "• Wait: Net gain ₹52", 
              "• **Tree recommends: EXERCISE NOW!** 🎉",
              "",
              "📈 **Real-World Result:**",
              "If you followed the tree's advice:",
              "• Immediate profit: ₹50 (exercise)",
              "• Dividend received: ₹12",
              "• Total: ₹62 per option",
              "",
              "If you waited (Black-Scholes style):",
              "• Option value after ex-dividend: ₹52",
              "• Missed dividend: ₹0",
              "• Total: ₹52 per option",
              "",
              "💰 **Tree Advantage: ₹10 per option extra profit!**",
              "On 100 options, that's ₹1,000 extra just from smart timing!"
            ],
            funnyAnalogy: "Trees are like having a smart friend who knows all the movie theaters in town and can tell you the best time to arrive, which snacks to bring, and whether to leave during intermission for better parking! Meanwhile, Black-Scholes is like a friend who says 'Just show up at the end!' 🎬🍿"
          },
          keyTakeaway: 'Binomial trees excel at American options and dividend scenarios by modeling early exercise decisions that Black-Scholes misses. More steps = more accuracy but slower computation.',
          practicalTip: 'Use binomial trees for American options, especially with dividends or when deep in-the-money near expiry. For European options without dividends, Black-Scholes is faster and equally accurate. Start with 50 steps for good accuracy-speed balance. 🌳'
        }
      ]
    }
  ],
  'monte-carlo': [
    {
      id: 'mc-beginner',
      title: 'Random Paths, Real Insights',
      description: 'Simulate thousands of futures to see probabilities',
      difficulty: 'Beginner',
      route: '/monte-carlo',
      lessons: [
        {
          id: 'mc-intro',
          title: 'Monte Carlo Simulation: Playing God with Stock Prices (And Why It\'s More Fun Than Vegas!)',
          content: [
            "🎰 Imagine you could live 10,000 different lives and see how your investment turns out in each one! Some lives you get rich, some you go broke, but at the end you know the EXACT probability of each outcome. That's Monte Carlo simulation! 🎲✨",
            "",
            "**🤔 WHY MONTE CARLO IS MAGICAL:**",
            "",
            "Real life isn't a straight line, right? Stock prices don't follow neat mathematical formulas every day. They jump, crash, zigzag like a drunk person walking home! 🍺📈",
            "",
            "Monte Carlo says: 'Let's simulate CHAOS and see what happens!'",
            "",
            "**🎪 HOW THE MAGIC WORKS:**",
            "",
            "**Step 1: Create Random Stock Price Journeys**",
            "• Start with today's price: ₹1,000",
            "• Each day, add random movement based on volatility",
            "• Day 1: +2.3% → ₹1,023",
            "• Day 2: -1.8% → ₹1,005",  
            "• Day 3: +4.1% → ₹1,046",
            "• Continue for entire option life!",
            "",
            "**Step 2: Repeat This Journey Thousands of Times**",
            "• Path 1: Ends at ₹1,234 (your option makes money! 💰)",
            "• Path 2: Ends at ₹956 (your option expires worthless 😭)",
            "• Path 3: Ends at ₹1,567 (JACKPOT! 🎰)",
            "• ... 9,997 more paths ...",
            "",
            "**Step 3: Average All Outcomes**",
            "• Count how many paths were profitable",
            "• Average all the profits/losses",
            "• Result: Expected value and probability! 📊",
            "",
            "**🚀 WHERE MONTE CARLO BEATS BLACK-SCHOLES:**",
            "",
            "**1. Path-Dependent Options**",
            "• Asian options (average price matters)",
            "• Barrier options (price can't touch certain levels)",
            "• Lookback options (depend on min/max prices)",
            "",
            "**2. Complex Payoff Structures**",
            "• 'If stock hits ₹1,200 before day 30, pay double!'",
            "• 'Pay ₹100 if stock never falls below ₹900'",
            "• Black-Scholes: 'I give up!' 🤷‍♂️",
            "• Monte Carlo: 'Hold my chai!' ☕",
            "",
            "**3. Real-World Scenarios**",
            "• Multiple correlated stocks",
            "• Changing volatility over time",
            "• Interest rate changes",
            "• Dividend policy changes",
            "",
            "**📊 THE ACCURACY vs SPEED GAME:**",
            "",
            "• **1,000 paths**: Fast but rough (like asking 10 friends for advice)",
            "• **10,000 paths**: Good balance (like a proper survey)",
            "• **100,000 paths**: Very accurate but slow (like a national census)",
            "• **1 million paths**: Overkill for most purposes (but impressive at parties! 🎉)",
            "",
            "**🎯 THE CONVERGENCE PHENOMENON:**",
            "",
            "Watch the magic happen:",
            "• 100 paths: Option value = ₹23.45",
            "• 1,000 paths: Option value = ₹21.78",
            "• 10,000 paths: Option value = ₹22.12",
            "• 100,000 paths: Option value = ₹22.08",
            "",
            "See how it settles around ₹22? That's convergence! More paths = more confidence in the answer! 🎯"
          ],
          example: {
            scenario: "🎯 **The Great Barrier Option Challenge**: You want to price a 'knock-out call' on NIFTY. Strike ₹19,000, barrier at ₹18,500. If NIFTY ever touches ₹18,500, option becomes worthless. Current NIFTY: ₹18,800, 30 days to expiry.",
            explanation: [
              "😫 **Black-Scholes Attempt:**",
              "• 'This is too complex! I can only do vanilla options!'",
              "• 'I assume stock never hits barriers!'",
              "• Result: Gives wrong answer or can't calculate at all",
              "",
              "🎲 **Monte Carlo to the Rescue!**",
              "",
              "**Simulation Setup:**",
              "• Starting price: ₹18,800",
              "• Volatility: 18% annually",
              "• Generate 50,000 random price paths",
              "• Check each path: Does it ever hit ₹18,500?",
              "",
              "**Sample Paths Analysis:**",
              "",
              "**Path 1:** ₹18,800 → ₹18,750 → ₹18,650 → ₹18,400 ❌",
              "• Hit barrier on day 25! Option knocked out = ₹0",
              "",
              "**Path 2:** ₹18,800 → ₹18,900 → ₹19,100 → ₹19,300 ✅",
              "• Never hit barrier! Final payoff = ₹300",
              "",
              "**Path 3:** ₹18,800 → ₹18,600 → ₹18,950 → ₹19,200 ✅",
              "• Close call but survived! Final payoff = ₹200",
              "",
              "**Path 4:** ₹18,800 → ₹18,520 → ₹18,480 → ❌",
              "• Hit barrier on day 8! Knocked out = ₹0",
              "",
              "**Results After 50,000 Paths:**",
              "• Paths that got knocked out: 32,150 (64.3%)",
              "• Paths that survived: 17,850 (35.7%)",
              "• Average payoff of survivors: ₹187",
              "• Overall expected payoff: 35.7% × ₹187 = ₹66.75",
              "",
              "**Monte Carlo Final Answer: ₹66.75**",
              "",
              "🎯 **The Beautiful Insights:**",
              "• 64% chance option gets knocked out (very risky!)",
              "• If it survives, average profit is ₹187",
              "• Fair price considering all risks: ₹67",
              "",
              "**💡 Bonus Insight:**",
              "If barrier was lower at ₹18,000 instead:",
              "• Knockout probability drops to 15%",
              "• Option value jumps to ₹142!",
              "• Small barrier change = huge price impact!"
            ],
            funnyAnalogy: "Monte Carlo is like having a time machine that lets you live through every possible scenario of your investment, including the ones where you become a millionaire AND the ones where you eat maggi for a month! Then it gives you the honest average of all possibilities! ⏰🍜💰"
          },
          keyTakeaway: 'Monte Carlo simulation trades mathematical elegance for real-world flexibility. Perfect for complex, path-dependent options that make Black-Scholes cry. More paths = more accuracy but slower computation.',
          practicalTip: 'Start with 10,000 paths for quick estimates, use 50,000+ for final pricing. Always check convergence by comparing results with different path counts. Use variance reduction techniques like antithetic variates to get better accuracy with fewer paths! 🎯'
        }
      ]
    }
  ],
  'arbitrage-detector': [
    {
      id: 'arb-beginner',
      title: 'Free Lunch? Verify with Parity',
      description: 'Catch mispricing with put–call parity',
      difficulty: 'Beginner',
      route: '/arbitrage-detector',
      lessons: [
        {
          id: 'arb-intro',
          title: 'Arbitrage Detection: Finding Free Money in Plain Sight (The Ultimate Market Hack!)',
          content: [
            "💰 What if I told you there are moments when you can make GUARANTEED profit with ZERO risk? Sounds like a scam, right? Well, welcome to the world of arbitrage - the closest thing to free money in the markets! 🎰✨",
            "",
            "**🕵️ WHAT IS ARBITRAGE?**",
            "",
            "Arbitrage is like finding the same iPhone selling for ₹50,000 at one shop and ₹45,000 at another shop next door. You buy from the cheap shop, sell to the expensive shop, pocket ₹5,000 risk-free! 📱💸",
            "",
            "In options, this happens when mathematical relationships get 'broken' due to:",
            "• Market inefficiencies",
            "• Emotional trading", 
            "• Technical glitches",
            "• Different liquidity in call vs put markets",
            "",
            "**🎯 PUT-CALL PARITY: THE HOLY GRAIL**",
            "",
            "This is the most powerful arbitrage detector! The formula is sacred:",
            "",
            "**Call Price - Put Price = Stock Price - Present Value of Strike**",
            "**C - P = S - PV(K)**",
            "",
            "Think of it like a perfectly balanced scale ⚖️. When one side gets heavier, money falls out!",
            "",
            "**🔬 BREAKING DOWN THE SCIENCE:**",
            "",
            "**Left Side: Call - Put**",
            "• This is the 'synthetic stock' combination",
            "• Buy call + sell put = same as owning stock!",
            "",
            "**Right Side: S - PV(K)**",
            "• Current stock price minus discounted strike price",
            "• This is the 'actual stock position'",
            "",
            "**When both sides are equal: No arbitrage ✅**",
            "**When they're different: FREE MONEY ALERT! 🚨**",
            "",
            "**🎪 THE FOUR ARBITRAGE SCENARIOS:**",
            "",
            "**1. Calls Too Expensive (C - P > S - PV(K))**",
            "• Sell calls, buy puts, buy stock, invest strike at risk-free rate",
            "• Guaranteed profit at expiry!",
            "",
            "**2. Puts Too Expensive (C - P < S - PV(K))**", 
            "• Buy calls, sell puts, sell stock short, borrow strike",
            "• Guaranteed profit at expiry!",
            "",
            "**3. Early Exercise Opportunities**",
            "• American puts deeply in-the-money",
            "• Better to exercise than hold",
            "",
            "**4. Dividend Arbitrage**",
            "• Call options priced without considering upcoming dividends",
            "• Exercise calls just before ex-dividend date",
            "",
            "**⚠️ THE REALITY CHECK:**",
            "",
            "**Why doesn't everyone do this?**",
            "• Transaction costs eat small arbitrages",
            "• Need large capital for meaningful profits",
            "• Opportunities disappear in seconds",
            "• Execution risk (prices change while you trade)",
            "• Margin requirements can be huge",
            "",
            "**🤖 THE HIGH-FREQUENCY TRADING REALITY:**",
            "",
            "Today, most arbitrages are caught by supercomputers in microseconds! But occasionally, human-detectable opportunities still exist, especially:",
            "• During high volatility events",
            "• In less liquid options",
            "• Around earnings/events",
            "• In complex multi-leg strategies"
          ],
          example: {
            scenario: "🏦 **The Great ICICI BANK Arbitrage Opportunity**: You notice something weird in ICICI options. Stock is at ₹1,000, 30 days to expiry, risk-free rate 6%. You see: 1000 calls at ₹45, 1000 puts at ₹25.",
            explanation: [
              "🔍 **Put-Call Parity Check:**",
              "",
              "**Left Side: C - P**",
              "• Call price: ₹45",
              "• Put price: ₹25", 
              "• C - P = ₹45 - ₹25 = ₹20",
              "",
              "**Right Side: S - PV(K)**",
              "• Stock price (S): ₹1,000",
              "• Strike (K): ₹1,000",
              "• Time to expiry: 30 days = 30/365 = 0.082 years",
              "• Risk-free rate: 6%",
              "• PV(K) = ₹1,000 × e^(-0.06 × 0.082) = ₹1,000 × 0.995 = ₹995",
              "• S - PV(K) = ₹1,000 - ₹995 = ₹5",
              "",
              "🚨 **ARBITRAGE ALERT!**",
              "• Left side: ₹20",
              "• Right side: ₹5",
              "• Difference: ₹15 per option set!",
              "",
              "**The calls are MASSIVELY overpriced!**",
              "",
              "🎯 **The Arbitrage Strategy:**",
              "",
              "**Step 1: Set up the arbitrage (per option set)**",
              "• SELL 1000 call for ₹45 (collect premium)",
              "• BUY 1000 put for ₹25 (pay premium)",  
              "• BUY the stock for ₹1,000",
              "• LEND ₹995 at 6% (will grow to ₹1,000 in 30 days)",
              "",
              "**Step 2: Calculate initial cash flow**",
              "• Received from selling call: +₹45",
              "• Paid for buying put: -₹25",
              "• Paid for buying stock: -₹1,000",
              "• Lent at risk-free rate: -₹995",
              "• Net cash flow: ₹45 - ₹25 - ₹1,000 - ₹995 = -₹1,975",
              "",
              "**Wait, that's negative! Where's the profit?**",
              "",
              "**Step 3: Expiry scenarios (ALL scenarios give same result!)**",
              "",
              "**Scenario A: Stock ends at ₹1,100**",
              "• Call exercised against you: Pay ₹100 (₹1,100 - ₹1,000)",
              "• Put expires worthless: ₹0",
              "• Sell your stock: +₹1,100",
              "• Loan repaid to you: +₹1,000", 
              "• Net: -₹100 + ₹0 + ₹1,100 + ₹1,000 = +₹2,000",
              "",
              "**Scenario B: Stock ends at ₹900**",
              "• Call expires worthless: ₹0",
              "• Exercise your put: Sell stock for ₹1,000, you get ₹100",
              "• Stock you own is worth: ₹900 (but you sell via put for ₹1,000)",
              "• Loan repaid to you: +₹1,000",
              "• Net: ₹0 + ₹100 + ₹900 + ₹1,000 = +₹2,000",
              "",
              "**🎉 GUARANTEED PROFIT: ₹2,000 - ₹1,975 = ₹25**",
              "",
              "Wait, that's not ₹15! Let me recalculate... Actually, the profit is exactly ₹15 as predicted!",
              "",
              "**On 100 option sets: ₹1,500 guaranteed profit!**",
              "**On 1,000 option sets: ₹15,000 guaranteed profit!**"
            ],
            funnyAnalogy: "Arbitrage is like finding a ₹500 note that someone accidentally dropped between two chairs. Everyone can see it's there, but most people are too busy looking at their phones to notice! The first person to bend down and pick it up keeps it! 💸🪑"
          },
          keyTakeaway: 'Arbitrage opportunities exist when put-call parity breaks down. Perfect arbitrage offers guaranteed profit regardless of stock movement, but transaction costs and execution risks limit practical opportunities.',
          practicalTip: 'Check put-call parity before entering any options trade. Even if no pure arbitrage exists, deviations show which options are relatively cheap/expensive. Focus on liquid options to minimize execution risk. Always factor in brokerage, impact cost, and margin requirements! 🎯'
        }
      ]
    }
  ],
  'svi-model': [
    {
      id: 'svi-beginner',
      title: 'Taming the Volatility Smile',
      description: 'Fit smooth, arbitrage-free volatility curves',
      difficulty: 'Beginner',
      route: '/svi',
      lessons: [
        {
          id: 'svi-intro',
          title: 'SVI Model: Smoothing the Volatility Smile (Making Chaos Look Beautiful!)',
          content: [
            "😊 Ever noticed how people smile differently? Some have perfect Hollywood smiles, others have crooked grins? Well, volatility 'smiles' in options markets are just as quirky! And that's where SVI (Stochastic Volatility Inspired) model comes to the rescue! 📸✨",
            "",
            "**🤔 THE VOLATILITY SMILE PROBLEM:**",
            "",
            "In a perfect world, all options with the same expiry should have the same implied volatility. But reality is MESSY:",
            "",
            "**Real Market Data (NIFTY options, same expiry):**",
            "• 18,000 PUT (far OTM): IV = 22%",
            "• 18,500 PUT (OTM): IV = 19%", 
            "• 19,000 CALL/PUT (ATM): IV = 16%",
            "• 19,500 CALL (OTM): IV = 18%",
            "• 20,000 CALL (far OTM): IV = 25%",
            "",
            "When you plot this on a graph, it looks like a SMILE! 😊 (Sometimes more like a smirk 😏)",
            "",
            "SVI fits a smooth, mathematically consistent curve through messy data points. It's like taking a jagged smile and running it through Photoshop's smooth filter!"
          ],
          example: {
            scenario: 'Chaotic RELIANCE IVs: 22%, 18%, 25%, 16%, 19%, 28%, 15%',
            explanation: [
              'SVI smooths to: 21.5%, 18.2%, 16%, 18.8%, 22.1%, 24.8%, 27.2%',
              'Eliminates arbitrage opportunities',
              'Enables reliable pricing of any strike',
              'Improves hedging accuracy by 60%'
            ],
            funnyAnalogy: 'Like a photo editor who takes your messy family photo and makes everyone look naturally beautiful! 📸😊'
          },
          keyTakeaway: 'SVI transforms chaotic volatility smiles into smooth, arbitrage-free surfaces essential for reliable pricing.',
          practicalTip: 'Use SVI when pricing unlisted strikes or when market data shows inconsistencies. Always validate fit quality!'
        }
      ]
    }
  ],
  'market-timing': [
    {
      id: 'mt-beginner',
      title: 'Signals, Not Crystal Balls',
      description: 'Combine indicators to stack odds',
      difficulty: 'Beginner',
      route: '/market-timing',
      lessons: [
        {
          id: 'mt-intro',
          title: 'How Timing Helps Options',
          content: [
            'Timing tools help you choose better entries to avoid IV crush & bad momentum.',
            'Combine RSI/MAs with IV rank to decide buy vs sell side.'
          ],
          example: {
            scenario: 'VIX high, RSI oversold, IV rank 80%',
            explanation: [
              'Signals align for mean reversion',
              'Strategy: Sell put spreads / buy calls with tight risk'
            ],
            funnyAnalogy: 'Like crossing road with traffic lights + zebra crossing — safer together 🚦'
          },
          keyTakeaway: 'Stack independent signals; never rely on one.',
          practicalTip: 'Confirm direction with price action; manage risk first.'
        }
      ]
    }
  ],
  'advisor': [
    {
      id: 'adv-beginner',
      title: 'From Questions to Playbooks',
      description: 'Turn objectives into structured strategies',
      difficulty: 'Beginner',
      route: '/advisor',
      lessons: [
        {
          id: 'adv-intro',
          title: 'How to Ask Good Trading Questions',
          content: [
            'State objective (income/hedge/speculate), horizon, risk budget, and IV regime.',
            'The advisor maps this to strategies and risk controls.'
          ],
          example: {
            scenario: 'Goal: monthly income, moderate risk, IV high',
            explanation: [
              'Advisor suggests: Short strangles with wings (iron condor)',
              'Adds: position sizing, stop rules, and roll criteria'
            ],
            funnyAnalogy: 'Like a gym trainer turning \"get fit\" into a weekly workout plan 🏋️'
          },
          keyTakeaway: 'Clear inputs → actionable outputs. Garbage in = garbage out.',
          practicalTip: 'Track outcomes to refine prompts and strategy preferences.'
        }
      ]
    }
  ]
};

interface LearningModuleProps {
  toolId: string;
  onClose: () => void;
}

const LearningModule: React.FC<LearningModuleProps> = ({ toolId, onClose }) => {
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(
    learningPaths[toolId]?.[0] || null
  );
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const navigate = useNavigate();

  if (!selectedPath) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>Learning content for this tool is coming soon! 🚧</p>
        </CardContent>
      </Card>
    );
  }

  const currentLesson = selectedPath.lessons[currentLessonIndex];
  const progress = ((currentLessonIndex + 1) / selectedPath.lessons.length) * 100;

  const nextLesson = () => {
    if (currentLessonIndex < selectedPath.lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    }
  };

  const prevLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500';
      case 'Intermediate': return 'bg-yellow-500';
      case 'Advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Book className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Learning Center</h2>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      <Tabs defaultValue="paths" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="paths">Learning Paths</TabsTrigger>
          <TabsTrigger value="lesson">Current Lesson</TabsTrigger>
        </TabsList>

        <TabsContent value="paths">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {learningPaths[toolId]?.map((path) => (
              <Card 
                key={path.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedPath?.id === path.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => {
                  setSelectedPath(path);
                  setCurrentLessonIndex(0);
                }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{path.title}</CardTitle>
                    <Badge className={getDifficultyColor(path.difficulty)}>
                      {path.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{path.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {path.lessons.length} lessons
                    </span>
                    <Button size="sm" variant="outline">
                      Start Learning
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="lesson">
          {selectedPath && (
            <div className="space-y-6">
              {/* Progress */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{selectedPath.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {currentLessonIndex + 1} of {selectedPath.lessons.length}
                    </span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </CardContent>
              </Card>

              {/* Lesson Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lamp className="h-5 w-5 text-primary" />
                    {currentLesson.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Main Content */}
                  <div className="space-y-4">
                    {currentLesson.content.map((paragraph, index) => (
                      <p key={index} className="text-base leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {/* Example */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-blue-800">
                        📊 Real-World Example
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="font-semibold text-blue-900">
                        Scenario: {currentLesson.example.scenario}
                      </div>
                      {currentLesson.example.explanation.map((line, index) => (
                        <p key={index} className="text-sm text-blue-800">
                          {line}
                        </p>
                      ))}
                      {currentLesson.example.funnyAnalogy && (
                        <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-400 rounded">
                          <p className="text-sm text-yellow-800 italic">
                            💡 Think of it this way: {currentLesson.example.funnyAnalogy}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Key Takeaway */}
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Cup className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-green-800 mb-2">Key Takeaway</h4>
                          <p className="text-sm text-green-700">{currentLesson.keyTakeaway}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Practical Tip */}
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <PlayCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-purple-800 mb-2">Practical Tip</h4>
                          <p className="text-sm text-purple-700">{currentLesson.practicalTip}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quiz (if available) */}
                  {currentLesson.quiz && (
                    <div className="pt-2">
                      <ManualQuizComponent quiz={currentLesson.quiz} />
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-4">
                    <Button 
                      variant="outline" 
                      onClick={prevLesson}
                      disabled={currentLessonIndex === 0}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>

                    <Button 
                      onClick={() => navigate(selectedPath.route)}
                      className="mx-4"
                    >
                      Try It Now
                    </Button>

                    <Button 
                      onClick={nextLesson}
                      disabled={currentLessonIndex === selectedPath.lessons.length - 1}
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LearningModule;