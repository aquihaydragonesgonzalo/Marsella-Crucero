import React from 'react';
import { Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity } from '../types';

interface BudgetProps {
    itinerary: Activity[];
}

const COLORS = ['#1e3a8a', '#be123c', '#d97706', '#64748b'];

const Budget: React.FC<BudgetProps> = ({ itinerary }) => {
    const totalBudget = itinerary.reduce((acc, curr) => acc + (curr.priceEUR || 0), 0);
    const paidActivities = itinerary.filter(a => a.priceEUR > 0);
    const chartData = paidActivities.map(act => ({ name: act.title, value: act.priceEUR }));

    return (
        <div className="pb-24 px-4 pt-6 max-w-lg mx-auto h-full overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-900 flex items-center uppercase tracking-tight"><Wallet className="mr-2" /> Gastos</h2>
            </div>
            <div className="bg-gradient-to-br from-blue-800 to-blue-950 rounded-[2rem] p-6 text-white shadow-xl mb-8 border-2 border-white/10 relative overflow-hidden">
                <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-amber-400/20 rounded-full blur-2xl"></div>
                <p className="text-blue-100 text-xs mb-1 uppercase tracking-widest font-black opacity-80">Presupuesto Escala</p>
                <div className="text-4xl font-black">€{totalBudget}</div>
            </div>
            {paidActivities.length > 0 ? (
                <>
                <div className="bg-white rounded-3xl shadow-sm border border-blue-50 mb-8 overflow-hidden">
                    {paidActivities.map((act, index) => (
                    <div key={act.id} className="flex justify-between items-center p-5 border-b border-slate-50 last:border-0">
                        <div className="flex items-center">
                        <div className="w-2.5 h-2.5 rounded-full mr-3" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <div><p className="text-sm font-bold text-slate-800">{act.title}</p></div>
                        </div>
                        <div className="font-black text-blue-900">€{act.priceEUR}</div>
                    </div>
                    ))}
                </div>
                <div className="h-64 w-full mb-8 bg-white rounded-3xl border border-blue-50 shadow-sm p-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontFamily: 'inherit', fontWeight: 'bold' }}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                </>
            ) : (
                <div className="p-12 text-center bg-blue-50 rounded-[2.5rem] border-2 border-dashed border-blue-200 mb-8"><Wallet className="mx-auto text-blue-200 mb-4" size={32} /><p className="text-blue-400 font-bold uppercase tracking-widest text-xs">Sin gastos previstos</p></div>
            )}
        </div>
    );
};

export default Budget;