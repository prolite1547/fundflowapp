package com.iamicdev.fundflowapp.util;

import java.util.List;
import java.util.Random;

public class FinancialAdviceProvider {

    private static final Random RANDOM = new Random();

    private static final List<String> EXCELLENT_MESSAGES = List.of(
        "You're a financial rockstar! Your budget is airtight and your savings are soaring.",
        "Master of coin! Your money management skills are genuinely top-tier.",
        "Flawless execution! Your future self is already thanking you for these outstanding habits.",
        "Incredible discipline! You're building a massive safety net while living within your means.",
        "You're setting the gold standard for financial wellness. Keep riding this wave!",
        "Stellar performance this month! Your ratio of savings to expenses is exactly where it needs to be.",
        "You've truly mastered the art of money flow. Your emergency fund and budgets are perfectly aligned.",
        "Exceptional! Your financial fortress is getting stronger every single day.",
        "You're in the elite tier of financial planners. Don't change a thing about your current habits!",
        "Brilliant money management! Watch your wealth compound as you stick to this winning formula."
    );

    private static final List<String> GOOD_MESSAGES = List.of(
        "Solid progress! You're on the right track, just keep a close eye on those minor impulse buys.",
        "Looking good! A few strategic cuts to your lifestyle inflation could push you into Excellent territory.",
        "You have a great foundation. Focus on maximizing your savings rate to level up your financial health.",
        "Steady and stable! You're doing well, but don't let your emergency fund growth stagnate.",
        "Nice work balancing the books. If you can squeeze out just 5% more savings, you'll be golden.",
        "You're handling your finances responsibly. Try challenging yourself to a 'no-spend' weekend to boost your score!",
        "Great job staying mostly within budget. Fine-tuning your categories could yield massive long-term results.",
        "You're in a comfortable spot, but don't get complacent. Keep looking for ways to optimize your wealth.",
        "A respectable performance! A bit more aggressive saving could turn your good habits into great wealth.",
        "You've grasped the fundamentals perfectly. Now it's time to tighten the screws and accelerate your savings."
    );

    private static final List<String> NEEDS_ATTENTION_MESSAGES = List.of(
        "Warning: Minor leaks detected! Your expenses are creeping up. Time to review where your money is going.",
        "Your budget is feeling a bit squeezed right now. Try to unleash your inner frugal ninja this week!",
        "Caution: You're drifting off course. Reign in your discretionary spending before it affects your savings.",
        "Your financial health is slipping. Take a hard look at your recent transactions and cut the unnecessary weight.",
        "You're spending a bit too close to your income ceiling. Give your bank account some room to breathe!",
        "Heads up! Your savings rate is lower than recommended. See if you can pause a subscription or two.",
        "Your emergency fund needs some love. Prioritize saving over spending for the next few weeks.",
        "You're losing momentum. Revisit your budget limits—they only work if you actively stick to them!",
        "Red flags are popping up. It's time to get brutally honest about your 'wants' versus your 'needs'.",
        "Your discipline is wavering. Regain control of your cash flow today to prevent debt tomorrow."
    );

    private static final List<String> CRITICAL_MESSAGES = List.of(
        "Code Red! Your expenses are critically high. Immediate intervention is required to stabilize your finances.",
        "Financial gravity is pulling you down. You must aggressively cut costs and build a safety net right now.",
        "Alert! You are burning through cash dangerously fast. Freeze all non-essential spending instantly.",
        "Your financial foundation is cracking. Stop borrowing from your future and implement a strict survival budget.",
        "Emergency: Your outflow is overwhelming your inflow. You need a drastic intervention to reverse this trend.",
        "This is a financial crisis point. Prioritize only absolute necessities—rent, food, and utilities.",
        "You're in the danger zone! Living on the edge leaves you vulnerable. Action is required immediately.",
        "Wake up call! Your current spending habits are completely unsustainable. Radically rethink your budget today.",
        "Your financial health is on life support. You must inject massive savings and halt the bleeding on expenses.",
        "Warning! You are actively depleting your resources. Shift your mindset to extreme cost-cutting immediately."
    );

    public static String getRandomMessage(String status) {
        return switch (status) {
            case "Excellent" -> EXCELLENT_MESSAGES.get(RANDOM.nextInt(EXCELLENT_MESSAGES.size()));
            case "Good" -> GOOD_MESSAGES.get(RANDOM.nextInt(GOOD_MESSAGES.size()));
            case "Needs Attention" -> NEEDS_ATTENTION_MESSAGES.get(RANDOM.nextInt(NEEDS_ATTENTION_MESSAGES.size()));
            case "Critical" -> CRITICAL_MESSAGES.get(RANDOM.nextInt(CRITICAL_MESSAGES.size()));
            default -> "Keep tracking your finances to improve your score!";
        };
    }
}
