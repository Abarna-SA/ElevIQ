import type { SummarySection } from './AIAdvisorModal';

// ─── Helper ──────────────────────────────────────────────
function fmt(value: number): string {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} Lakh`;
    return `₹${value.toLocaleString('en-IN')}`;
}

// ─── EMI ─────────────────────────────────────────────────
export function generateEMISummary(
    principal: number, rate: number, tenureMonths: number, emi: number, totalInterest: number
): SummarySection[] {
    const totalPayment = emi * tenureMonths;
    const interestRatio = ((totalInterest / principal) * 100).toFixed(0);
    const years = Math.round(tenureMonths / 12);
    const monthlyExtra = Math.round(emi * 0.1);
    return [
        {
            icon: '📊',
            title: 'Your Loan Summary',
            content: `You're taking a ${fmt(principal)} loan at ${rate}% interest for ${years} years. Your monthly EMI will be ${fmt(emi)}. Over the full tenure, you'll pay ${fmt(totalInterest)} as interest — that's ${interestRatio}% of your principal amount. Total outflow will be ${fmt(totalPayment)}.`,
        },
        {
            icon: '💡',
            title: 'Key Insights',
            content: rate > 9
                ? `Your interest rate of ${rate}% is above the current market average. Consider negotiating with your lender or exploring balance transfer options. Even a 0.5% reduction could save you ${fmt(totalInterest * 0.06)} over the loan tenure. ${tenureMonths > 180 ? `Also, reducing your tenure to 15 years would significantly cut your total interest outflow.` : ''}`
                : `Your interest rate of ${rate}% is competitive. ${tenureMonths > 180 ? `However, your ${years}-year tenure means you'll pay significant interest. Reducing to 15 years increases your EMI but saves substantially on total interest.` : `With a ${years}-year tenure, your EMI-to-interest ratio looks healthy.`}`,
        },
        {
            icon: '⚡',
            title: 'Quick Recommendation',
            content: `Consider prepaying ${fmt(monthlyExtra)} extra per month (just 10% of your EMI). This small addition could help you close the loan approximately 2-3 years earlier and save a significant chunk of interest. Keep your total EMI under 30% of your monthly income for optimal financial health.`,
        },
    ];
}

// ─── SIP ─────────────────────────────────────────────────
export function generateSIPSummary(
    monthly: number, rate: number, years: number, invested: number, returns: number, total: number
): SummarySection[] {
    const multiple = (total / invested).toFixed(1);
    return [
        {
            icon: '📊',
            title: 'Investment Summary',
            content: `By investing ${fmt(monthly)} every month for ${years} years at an expected ${rate}% annual return, your total investment of ${fmt(invested)} could grow to ${fmt(total)}. That's a wealth gain of ${fmt(returns)} — your money grows ${multiple}x through the power of compounding.`,
        },
        {
            icon: '💡',
            title: 'Key Insights',
            content: `${Number(multiple) > 3 ? `Your ${multiple}x growth multiple is excellent — compounding really works over ${years} years! ` : ''}Consider a step-up SIP where you increase your monthly investment by 10% each year. This mirrors your salary growth and could significantly boost your final corpus. ${monthly * 12 < 150000 ? `You also have room to invest more under Section 80C for tax savings.` : ''}`,
        },
        {
            icon: '⚡',
            title: 'Quick Recommendation',
            content: `Starting just 2 years earlier with the same ${fmt(monthly)}/month would give you significantly more due to extra compounding time. If you're already investing, consider diversifying across large-cap, mid-cap, and flexi-cap funds for balanced risk-adjusted returns.`,
        },
    ];
}

// ─── FIRE ────────────────────────────────────────────────
export function generateFIRESummary(
    monthlyIncome: number, monthlyExpenses: number, savingsRate: number, fireNumber: number, yearsToFire: number
): SummarySection[] {
    return [
        {
            icon: '📊',
            title: 'FIRE Analysis',
            content: `Based on your monthly income of ${fmt(monthlyIncome)} and expenses of ${fmt(monthlyExpenses)}, your savings rate is ${savingsRate.toFixed(0)}%. To achieve financial independence, you need a corpus of approximately ${fmt(fireNumber)} using the 4% withdrawal rule.`,
        },
        {
            icon: '💡',
            title: 'Key Insights',
            content: `${savingsRate > 50 ? `Your ${savingsRate.toFixed(0)}% savings rate is exceptional! You're on an aggressive FIRE path.` : savingsRate > 30 ? `Your ${savingsRate.toFixed(0)}% savings rate is solid. You're on track for FIRE.` : `Your ${savingsRate.toFixed(0)}% savings rate could be improved. Aim for at least 30% to accelerate your FIRE journey.`} Every 1% increase in your savings rate can shave months off your FIRE timeline. Focus on reducing your largest expense categories first.`,
        },
        {
            icon: '⚡',
            title: 'Quick Recommendation',
            content: `You're approximately ${yearsToFire > 0 ? `${yearsToFire} years` : 'already close to'} from FIRE. Consider building multiple income streams — dividend stocks, rental income, or a side business — to accelerate your timeline and add financial resilience.`,
        },
    ];
}

// ─── Tax ─────────────────────────────────────────────────
export function generateTaxSummary(
    income: number, oldTax: number, newTax: number, savings: number
): SummarySection[] {
    const betterRegime = oldTax < newTax ? 'Old' : 'New';
    const taxSaved = Math.abs(oldTax - newTax);
    return [
        {
            icon: '📊',
            title: 'Tax Comparison',
            content: `For your annual income of ${fmt(income)}, your tax liability is ${fmt(oldTax)} under the Old Regime and ${fmt(newTax)} under the New Regime. The ${betterRegime} Regime saves you ${fmt(taxSaved)} in taxes.`,
        },
        {
            icon: '💡',
            title: 'Key Insights',
            content: `${betterRegime === 'Old' ? `The Old Regime works better for you because your deductions (80C, HRA, etc.) are significant enough to offset the lower tax slabs of the New Regime. Make sure you're fully utilizing your ₹1.5L 80C limit.` : `The New Regime is more beneficial despite no deductions, thanks to the higher basic exemption limit and rebate under Section 87A. You save ${fmt(taxSaved)} compared to the Old Regime.`}`,
        },
        {
            icon: '⚡',
            title: 'Quick Recommendation',
            content: `${savings > 0 ? `You're saving ${fmt(savings)} through deductions. ` : ''}Consider maximizing your NPS contribution for an additional ₹50,000 deduction under 80CCD(1B). Also explore home loan interest deduction (up to ₹2L under Section 24) if applicable.`,
        },
    ];
}

// ─── Generic (for smaller calculators) ───────────────────
export function generateGenericSummary(
    calculatorName: string,
    context: { label: string; value: string }[],
    highlights: { summaryText: string; insightText: string; recommendationText: string }
): SummarySection[] {
    return [
        {
            icon: '📊',
            title: `${calculatorName.replace(' Calculator', '')} Summary`,
            content: highlights.summaryText,
        },
        {
            icon: '💡',
            title: 'Key Insights',
            content: highlights.insightText,
        },
        {
            icon: '⚡',
            title: 'Quick Recommendation',
            content: highlights.recommendationText,
        },
    ];
}
