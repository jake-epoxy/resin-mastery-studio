import { useState, useMemo } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { TrendingUp, DollarSign, Calendar, Briefcase, ArrowRight } from "lucide-react";

const ROICalculator = () => {
    const ref = useScrollReveal();

    const [jobsPerMonth, setJobsPerMonth] = useState(4);
    const [avgSquareFeet, setAvgSquareFeet] = useState(400);
    const [pricePerSqFt, setPricePerSqFt] = useState(8);
    const [materialCostPercent, setMaterialCostPercent] = useState(30);

    const stats = useMemo(() => {
        const revenuePerJob = avgSquareFeet * pricePerSqFt;
        const monthlyRevenue = revenuePerJob * jobsPerMonth;
        const yearlyRevenue = monthlyRevenue * 12;
        const materialCost = yearlyRevenue * (materialCostPercent / 100);
        const yearlyProfit = yearlyRevenue - materialCost;
        const monthlyProfit = yearlyProfit / 12;
        const trainingCost = 1650;
        const roiMultiplier = Math.round(yearlyProfit / trainingCost);
        const paybackDays = Math.max(1, Math.round((trainingCost / (monthlyProfit / 30))));

        return {
            revenuePerJob,
            monthlyRevenue,
            yearlyRevenue,
            yearlyProfit,
            monthlyProfit,
            roiMultiplier,
            paybackDays,
        };
    }, [jobsPerMonth, avgSquareFeet, pricePerSqFt, materialCostPercent]);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

    return (
        <section id="roi-calculator" className="py-32 px-6 relative" ref={ref}>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#78c8ff]/[0.02] to-transparent pointer-events-none" />

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase mb-4 animate-scroll-fade">
                        Your Earning Potential
                    </p>
                    <h2
                        className="text-4xl md:text-5xl font-bold font-display text-primary text-glow leading-tight animate-scroll-scale"
                        style={{ transitionDelay: "0.1s" }}
                    >
                        Epoxy Installer ROI Calculator
                    </h2>
                    <p className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto animate-scroll-reveal" style={{ transitionDelay: "0.2s" }}>
                        See exactly how much you could earn after completing Resin Academics training.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Sliders */}
                    <div
                        className="animate-scroll-reveal-left rounded-2xl border border-white/10 bg-card p-8"
                        style={{ transitionDelay: "0.3s" }}
                    >
                        <h3 className="text-lg font-display font-semibold text-white mb-8 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-[#78c8ff]" />
                            Adjust Your Numbers
                        </h3>

                        <div className="space-y-8">
                            {/* Jobs per Month */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm text-zinc-400">Jobs Per Month</label>
                                    <span className="text-white font-bold text-lg bg-white/5 px-3 py-1 rounded-lg border border-white/10 min-w-[60px] text-center">
                                        {jobsPerMonth}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={1}
                                    max={15}
                                    value={jobsPerMonth}
                                    onChange={(e) => setJobsPerMonth(Number(e.target.value))}
                                    className="w-full accent-[#78c8ff] h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#78c8ff] [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(120,200,255,0.5)] [&::-webkit-slider-thumb]:cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-zinc-600 mt-1">
                                    <span>1</span>
                                    <span>15</span>
                                </div>
                            </div>

                            {/* Avg Sq Ft */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm text-zinc-400">Avg. Square Feet Per Job</label>
                                    <span className="text-white font-bold text-lg bg-white/5 px-3 py-1 rounded-lg border border-white/10 min-w-[80px] text-center">
                                        {avgSquareFeet} ft²
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={100}
                                    max={2000}
                                    step={50}
                                    value={avgSquareFeet}
                                    onChange={(e) => setAvgSquareFeet(Number(e.target.value))}
                                    className="w-full accent-[#78c8ff] h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#78c8ff] [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(120,200,255,0.5)] [&::-webkit-slider-thumb]:cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-zinc-600 mt-1">
                                    <span>100 ft²</span>
                                    <span>2,000 ft²</span>
                                </div>
                            </div>

                            {/* Price Per Sq Ft */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm text-zinc-400">Price Per Sq Ft You Charge</label>
                                    <span className="text-white font-bold text-lg bg-white/5 px-3 py-1 rounded-lg border border-white/10 min-w-[60px] text-center">
                                        ${pricePerSqFt}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={3}
                                    max={20}
                                    value={pricePerSqFt}
                                    onChange={(e) => setPricePerSqFt(Number(e.target.value))}
                                    className="w-full accent-[#78c8ff] h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#78c8ff] [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(120,200,255,0.5)] [&::-webkit-slider-thumb]:cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-zinc-600 mt-1">
                                    <span>$3</span>
                                    <span>$20</span>
                                </div>
                            </div>

                            {/* Material Cost % */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm text-zinc-400">Material & Overhead Cost</label>
                                    <span className="text-white font-bold text-lg bg-white/5 px-3 py-1 rounded-lg border border-white/10 min-w-[60px] text-center">
                                        {materialCostPercent}%
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={10}
                                    max={60}
                                    value={materialCostPercent}
                                    onChange={(e) => setMaterialCostPercent(Number(e.target.value))}
                                    className="w-full accent-[#78c8ff] h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#78c8ff] [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(120,200,255,0.5)] [&::-webkit-slider-thumb]:cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-zinc-600 mt-1">
                                    <span>10%</span>
                                    <span>60%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Results */}
                    <div
                        className="animate-scroll-reveal-right flex flex-col gap-4"
                        style={{ transitionDelay: "0.4s" }}
                    >
                        {/* Revenue Per Job */}
                        <div className="rounded-2xl border border-white/10 bg-card p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                <DollarSign className="w-6 h-6 text-zinc-400" />
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 uppercase tracking-wider">Revenue Per Job</p>
                                <p className="text-2xl font-bold text-white">{formatCurrency(stats.revenuePerJob)}</p>
                            </div>
                        </div>

                        {/* Monthly Profit */}
                        <div className="rounded-2xl border border-white/10 bg-card p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                <Calendar className="w-6 h-6 text-zinc-400" />
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 uppercase tracking-wider">Monthly Take‑Home</p>
                                <p className="text-2xl font-bold text-white">{formatCurrency(stats.monthlyProfit)}</p>
                            </div>
                        </div>

                        {/* Yearly Profit — Hero Card */}
                        <div className="rounded-2xl border border-[#78c8ff]/30 bg-gradient-to-br from-[#78c8ff]/10 to-transparent p-6 flex items-center gap-4 shadow-[0_0_40px_rgba(120,200,255,0.08)]">
                            <div className="w-14 h-14 rounded-xl bg-[#78c8ff]/15 border border-[#78c8ff]/25 flex items-center justify-center shrink-0">
                                <TrendingUp className="w-7 h-7 text-[#78c8ff]" />
                            </div>
                            <div>
                                <p className="text-xs text-[#78c8ff] uppercase tracking-wider font-semibold">Yearly Income</p>
                                <p className="text-3xl md:text-4xl font-bold text-white">{formatCurrency(stats.yearlyProfit)}</p>
                            </div>
                        </div>

                        {/* ROI Stats Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-2xl border border-white/10 bg-card p-5 text-center">
                                <p className="text-3xl font-bold text-[#78c8ff]">{stats.roiMultiplier}x</p>
                                <p className="text-xs text-zinc-500 mt-1">Return on Training</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-card p-5 text-center">
                                <p className="text-3xl font-bold text-[#78c8ff]">{stats.paybackDays} days</p>
                                <p className="text-xs text-zinc-500 mt-1">To Pay Off Training</p>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="mt-2">
                            <a
                                href="#upcoming-class"
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.querySelector("#upcoming-class")?.scrollIntoView({ behavior: "smooth" });
                                }}
                                className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#78c8ff] text-black font-display font-bold text-base rounded-xl hover:bg-[#5ab8ff] hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-[0_0_30px_rgba(120,200,255,0.2)] hover:shadow-[0_0_50px_rgba(120,200,255,0.4)]"
                            >
                                Start Earning — Reserve Your Spot
                                <ArrowRight className="w-4 h-4" />
                            </a>
                            <p className="text-center text-zinc-600 text-xs mt-3">
                                Based on {jobsPerMonth} jobs/mo × {avgSquareFeet} ft² @ ${pricePerSqFt}/ft² with {materialCostPercent}% costs
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ROICalculator;
