/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  PiggyBank, 
  Target, 
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Plus,
  Trash2,
  BrainCircuit,
  LogOut,
  Send,
  MessageSquare
} from 'lucide-react';
import { FinancialData, Expense, Debt } from './types';
import { formatCurrency, cn } from './lib/utils';
import { getFinancialAdvice } from './services/geminiService';
import ReactMarkdown from 'react-markdown';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Auth } from './components/Auth';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [data, setData] = useState<FinancialData | null>(null);

  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (showAccountModal && session?.user) {
      setNewName(session.user.user_metadata?.full_name || '');
    }
  }, [showAccountModal, session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadData();
    } else {
      setData(null);
      setShowOnboarding(true);
    }
  }, [session]);

  const loadData = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('financial_profiles')
        .select('data')
        .maybeSingle();

      if (profile && profile.data) {
        setData(profile.data);
        setShowOnboarding(false);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveData = async (newData: FinancialData) => {
    if (!session?.user) return;
    try {
      await supabase
        .from('financial_profiles')
        .upsert({ 
          user_id: session.user.id, 
          data: newData,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  useEffect(() => {
    if (data && session?.user) {
      saveData(data);
    }
  }, [data, session]);

  const handleRefreshAdvice = async () => {
    if (!data || loading) return;
    setLoading(true);
    try {
      const feedback = await getFinancialAdvice(data);
      setAdvice(feedback || '');
    } catch (error) {
       console.error("Advice Error:", error);
       setAdvice("Falha ao recalcular a estratégia. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateData = (newData: FinancialData) => {
    setData(newData);
    setIsEditing(false);
  };

  const handleReset = async () => {
    if (confirm('Tem certeza que deseja resetar todos os dados?')) {
      if (session?.user) {
        await supabase.from('financial_profiles').delete().eq('user_id', session.user.id);
      }
      setData(null);
      setShowOnboarding(true);
      setAdvice('');
      setIsEditing(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-sans selection:bg-[#fff] selection:text-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-[#050505]/80 backdrop-blur-md border-b border-white/10 z-50 flex items-center justify-between px-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border border-white/20 flex items-center justify-center text-xs font-serif italic rounded-full text-white">
            {session?.user.user_metadata?.full_name?.[0] || session?.user.email?.[0].toUpperCase() || 'F'}
          </div>
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.3em] opacity-40 leading-none mb-1">
              {session?.user.user_metadata?.full_name || session?.user.email}
            </h2>
            <h1 className="font-serif text-2xl italic tracking-tight">Performances</h1>
          </div>
        </div>
        
        {data && (
          <div className="flex items-center gap-8">
            <div className="hidden md:block text-right">
              <p className="text-[10px] uppercase opacity-30 leading-none mb-1">Status do Plano</p>
              <p className="text-[10px] font-bold tracking-widest text-[#10b981]">ATIVO • SISTEMA {data.riskProfile.toUpperCase()}</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 hover:opacity-100 transition-opacity flex items-center gap-2 border border-white/10 px-4 py-2 rounded-sm"
              >
                <Plus className={cn("w-3 h-3 transition-transform", isEditing && "rotate-45")} />
                {isEditing ? "Fechar" : "Ajustar Rota"}
              </button>
              <button 
                onClick={handleLogout}
                className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30 hover:opacity-100 transition-opacity flex items-center gap-2 border border-white/10 px-4 py-2 rounded-sm"
              >
                <LogOut className="w-3 h-3" />
                Sair
              </button>
              <button 
                onClick={() => setShowAccountModal(true)}
                className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 hover:opacity-100 transition-opacity flex items-center gap-2 border border-white/10 px-4 py-2 rounded-sm"
              >
                Conta
              </button>
            </div>
          </div>
        )}
      </nav>

      <AnimatePresence>
        {showAccountModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            onClick={() => setShowAccountModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0d0d0d] border border-white/10 p-10 max-w-md w-full rounded-sm"
              onClick={e => e.stopPropagation()}
            >
            <h2 className="text-2xl font-serif italic text-white mb-6">Sua Conta</h2>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-30 mb-1 block">Nome Completo</label>
                <input 
                  type="text"
                  className="w-full bg-white/5 border border-white/10 p-4 text-sm focus:outline-none focus:border-white/30 text-white"
                  value={newName || (session?.user.user_metadata?.full_name || '')}
                  onChange={e => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-30 mb-1 block">E-mail</label>
                <p className="text-white font-medium opacity-50 px-4">{session?.user.email}</p>
              </div>
              <div className="pt-6 border-t border-white/5 space-y-4">
                <button 
                  onClick={async () => {
                    const { error } = await supabase.auth.updateUser({
                      data: { full_name: newName }
                    });
                    if (error) alert(error.message);
                    else {
                      alert('Perfil atualizado com sucesso!');
                      // Refresh session to show new name
                      const { data: { session: newSession } } = await supabase.auth.getSession();
                      setSession(newSession);
                    }
                  }}
                  className="w-full text-center text-[10px] uppercase tracking-widest font-bold bg-[#10b981] text-white py-4 hover:bg-[#059669] transition-colors"
                >
                  Salvar Alterações
                </button>
                <button 
                  onClick={async () => {
                      if (session?.user.email) {
                        await supabase.auth.resetPasswordForEmail(session.user.email, {
                          redirectTo: `${window.location.origin}/reset-password`,
                        });
                        alert('E-mail de redefinição de senha enviado!');
                      }
                    }}
                    className="w-full text-center text-[10px] uppercase tracking-widest font-bold border border-white/10 py-4 hover:bg-white/5 transition-colors"
                  >
                    Solicitar Troca de Senha
                  </button>
                  <button 
                    onClick={() => setShowAccountModal(false)}
                    className="w-full text-center text-[10px] uppercase tracking-widest font-bold bg-white text-black py-4"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-32 pb-12 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {showOnboarding ? (
            <Onboarding key="onboarding" onComplete={(newData) => {
              setData(newData);
              setShowOnboarding(false);
            }} />
          ) : (
            <Dashboard 
              key="dashboard"
              data={data!}
              advice={advice}
              loading={loading}
              isEditing={isEditing}
              onRefresh={handleRefreshAdvice}
              onUpdateData={handleUpdateData}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <footer className="py-12 border-t border-[#141414]/5 text-center px-6">
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-30">
          Estrategista de Alocação de Capital v1.0 • Fortuna Financial
        </p>
      </footer>
    </div>
  );
}

function Onboarding({ onComplete }: { onComplete: (data: FinancialData) => void }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FinancialData>>({
    monthlyIncome: 0,
    expenses: [],
    debts: [],
    savings: 0,
    reserves: [],
    goal: '',
    riskProfile: 'moderado'
  });

  const [currentExpense, setCurrentExpense] = useState<{ category: string; amount: number; type: 'fixa' | 'variavel' | 'pontual' }>({ 
    category: '', 
    amount: 0, 
    type: 'variavel' 
  });
  const [currentDebt, setCurrentDebt] = useState({ name: '', totalAmount: 0, monthlyPayment: 0, interestRate: 0 });
  const [currentReserve, setCurrentReserve] = useState({ name: '', amount: 0 });

  const nextStep = () => setStep(s => s + 1);

  const handleSubmit = () => {
    onComplete(formData as FinancialData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-xl mx-auto bg-[#0d0d0d] p-10 rounded-sm border border-white/5"
    >
      <div className="mb-12">
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-30 mb-2 block">Mapeamento • Passo {step}/5</span>
        <h2 className="text-4xl font-serif italic text-white tracking-tight">
          {step === 1 && "Qual sua renda líquida mensal?"}
          {step === 2 && "Despesas Mensais (Fluxo de Caixa)?"}
          {step === 3 && "Passivos e Dívidas (A Quitar)?"}
          {step === 4 && "Qual sua liquidez imediata?"}
          {step === 5 && "Visão de futuro e apetite?"}
        </h2>
      </div>

      <div className="space-y-8">
        {step === 1 && (
          <div className="relative border-b border-white/10 pb-4">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl opacity-20 font-serif italic">R$</span>
            <input 
              type="number"
              autoFocus
              className="w-full text-5xl p-4 pl-12 focus:outline-none bg-transparent font-light tracking-tighter"
              placeholder="0,00"
              value={formData.monthlyIncome || ''}
              onChange={e => setFormData({ ...formData, monthlyIncome: Number(e.target.value) })}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 bg-white/5 p-3 rounded-sm border border-white/5">
              <div className="flex gap-2">
                <input 
                  className="flex-1 p-3 bg-transparent focus:outline-none text-sm"
                  placeholder="Identificação (ex: IPVA)"
                  value={currentExpense.category}
                  onChange={e => setCurrentExpense({ ...currentExpense, category: e.target.value })}
                />
                <input 
                  type="number"
                  className="w-24 p-3 bg-transparent border-l border-white/10 focus:outline-none text-sm"
                  placeholder="R$"
                  value={currentExpense.amount || ''}
                  onChange={e => setCurrentExpense({ ...currentExpense, amount: Number(e.target.value) })}
                />
                <button 
                  onClick={() => {
                    if (currentExpense.category && currentExpense.amount) {
                      setFormData({ ...formData, expenses: [...(formData.expenses || []), { ...currentExpense, id: Date.now().toString() }] });
                      setCurrentExpense({ category: '', amount: 0, type: 'variavel' });
                    }
                  }}
                  className="p-3 bg-white text-black text-xs font-bold uppercase tracking-tighter"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2 border-t border-white/5 pt-2">
                {(['fixa', 'variavel', 'pontual'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setCurrentExpense({ ...currentExpense, type: t })}
                    className={cn(
                      "text-[8px] uppercase tracking-widest px-3 py-1 rounded-full border transition-all",
                      currentExpense.type === t ? "bg-white text-black border-white" : "text-white/40 border-white/10"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto space-y-px">
              {formData.expenses?.map(exp => (
                <div key={exp.id} className="flex justify-between items-center bg-white/2 p-4 border border-white/5">
                  <div>
                    <span className="font-light text-sm opacity-80">{exp.category}</span>
                    <span className="text-[8px] uppercase tracking-tighter opacity-30 ml-2">{exp.type}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium tracking-tight text-sm">{formatCurrency(exp.amount)}</span>
                    <button onClick={() => setFormData({ ...formData, expenses: formData.expenses?.filter(e => e.id !== exp.id) })}>
                      <Trash2 className="w-4 h-4 text-red-500 opacity-30 hover:opacity-100" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-[10px] uppercase opacity-40 mb-4">Registre tudo o que você deve e pretende quitar (cartões, empréstimos, financiamentos).</p>
            <div className="grid grid-cols-2 gap-px bg-white/5 p-px border border-white/10">
              <input 
                className="col-span-2 p-3 bg-[#0d0d0d] focus:outline-none text-sm"
                placeholder="Credor (ex: Cartão Nu)"
                value={currentDebt.name}
                onChange={e => setCurrentDebt({ ...currentDebt, name: e.target.value })}
              />
              <input 
                type="number"
                className="p-3 bg-[#0d0d0d] focus:outline-none text-sm"
                placeholder="Saldo Devedor"
                value={currentDebt.totalAmount || ''}
                onChange={e => setCurrentDebt({ ...currentDebt, totalAmount: Number(e.target.value) })}
              />
              <input 
                type="number"
                className="p-3 bg-[#0d0d0d] focus:outline-none text-sm"
                placeholder="Valor Parcela"
                value={currentDebt.monthlyPayment || ''}
                onChange={e => setCurrentDebt({ ...currentDebt, monthlyPayment: Number(e.target.value) })}
              />
              <input 
                type="number"
                className="p-3 bg-[#0d0d0d] focus:outline-none text-sm col-span-2"
                placeholder="Taxa (%)"
                value={currentDebt.interestRate || ''}
                onChange={e => setCurrentDebt({ ...currentDebt, interestRate: Number(e.target.value) })}
              />
              <button 
                onClick={() => {
                  if (currentDebt.name && currentDebt.totalAmount) {
                    setFormData({ ...formData, debts: [...(formData.debts || []), { ...currentDebt, id: Date.now().toString() }] });
                    setCurrentDebt({ name: '', totalAmount: 0, monthlyPayment: 0, interestRate: 0 });
                  }
                }}
                className="col-span-2 p-4 bg-white text-black font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Registrar Passivo
              </button>
            </div>
            <div className="max-h-56 overflow-y-auto space-y-px">
              {formData.debts?.map(debt => (
                <div key={debt.id} className="flex justify-between items-center bg-white/2 p-4 border border-white/5">
                  <div>
                    <span className="font-light text-sm block opacity-80">{debt.name}</span>
                    <span className="text-[10px] opacity-30 uppercase tracking-tighter">{debt.interestRate}% am</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium tracking-tight text-sm text-[#f87171]">{formatCurrency(debt.totalAmount)}</span>
                    <button onClick={() => setFormData({ ...formData, debts: formData.debts?.filter(d => d.id !== debt.id) })}>
                      <Trash2 className="w-4 h-4 text-red-500 opacity-30 hover:opacity-100" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="flex gap-2 bg-white/5 p-2 rounded-sm border border-white/5">
              <input 
                className="flex-1 p-3 bg-transparent focus:outline-none text-sm"
                placeholder="Fundo (ex: Emergência)"
                value={currentReserve.name}
                onChange={e => setCurrentReserve({ ...currentReserve, name: e.target.value })}
              />
              <input 
                type="number"
                className="w-32 p-3 bg-transparent border-l border-white/10 focus:outline-none text-sm"
                placeholder="R$"
                value={currentReserve.amount || ''}
                onChange={e => setCurrentReserve({ ...currentReserve, amount: Number(e.target.value) })}
              />
              <button 
                onClick={() => {
                  if (currentReserve.name && currentReserve.amount) {
                    const newReserves = [...(formData.reserves || []), { ...currentReserve, id: Date.now().toString() }];
                    const newTotal = newReserves.reduce((acc, curr) => acc + curr.amount, 0);
                    setFormData({ ...formData, reserves: newReserves, savings: newTotal });
                    setCurrentReserve({ name: '', amount: 0 });
                  }
                }}
                className="p-3 bg-white text-black text-xs font-bold uppercase tracking-tighter"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-56 overflow-y-auto space-y-px">
              <div className="bg-white/5 p-4 border border-white/10 flex justify-between items-baseline mb-4">
                <span className="text-[10px] uppercase tracking-widest opacity-30">Total em Reservas</span>
                <span className="text-2xl font-light tracking-tighter">{formatCurrency(formData.savings || 0)}</span>
              </div>
              {formData.reserves?.map(res => (
                <div key={res.id} className="flex justify-between items-center bg-white/2 p-4 border border-white/5">
                  <span className="font-light text-sm opacity-80">{res.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-medium tracking-tight text-sm text-[#10b981]">{formatCurrency(res.amount)}</span>
                    <button onClick={() => {
                      const newReserves = formData.reserves?.filter(r => r.id !== res.id) || [];
                      const newTotal = newReserves.reduce((acc, curr) => acc + curr.amount, 0);
                      setFormData({ ...formData, reserves: newReserves, savings: newTotal });
                    }}>
                      <Trash2 className="w-4 h-4 text-red-500 opacity-30 hover:opacity-100" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-8">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-30 mb-3 block">Diretriz Estratégica</label>
              <select 
                className="w-full p-4 bg-white/5 rounded-sm border border-white/10 focus:outline-none text-sm font-light appearance-none"
                value={formData.goal}
                onChange={e => setFormData({ ...formData, goal: e.target.value })}
              >
                <option value="" className="bg-[#050505]">Definir Visão</option>
                <option value="Sair das dívidas rápido" className="bg-[#050505]">Libertação: Quitação Agressiva</option>
                <option value="Conforto e pagamento gradual" className="bg-[#050505]">Equilíbrio: Gestão de Fluxo</option>
                <option value="Investir e construir patrimônio" className="bg-[#050505]">Acúmulo: Expansão de Capital</option>
                <option value="Comprar um bem específico" className="bg-[#050505]">Alvo: Aquisição Estruturada</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-30 mb-3 block">Apetite de Risco</label>
              <div className="grid grid-cols-3 gap-px bg-white/10 border border-white/10 overflow-hidden rounded-sm">
                {(['conservador', 'moderado', 'agressivo'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setFormData({ ...formData, riskProfile: p })}
                    className={cn(
                      "p-4 text-[10px] uppercase tracking-widest transition-all",
                      formData.riskProfile === p 
                        ? "bg-white text-black font-bold" 
                        : "bg-[#0d0d0d] text-white opacity-40 hover:opacity-100"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between gap-6 pt-10">
          {step > 1 && (
            <button 
              onClick={() => setStep(s => s - 1)}
              className="text-[10px] uppercase tracking-widest font-bold opacity-30 hover:opacity-100 transition-opacity"
            >
              Retroceder
            </button>
          )}
          <button 
            onClick={step === 5 ? handleSubmit : nextStep}
            className="flex-1 bg-white text-black text-[10px] uppercase tracking-[0.3em] font-bold py-5 flex items-center justify-center gap-3 transition-transform active:scale-[0.98]"
          >
            {step === 5 ? "Configurar IA" : "Avançar"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Dashboard({ 
  data, 
  advice, 
  loading, 
  isEditing,
  onRefresh,
  onUpdateData
}: { 
  data: FinancialData; 
  advice: string; 
  loading: boolean;
  isEditing: boolean;
  onRefresh: () => void;
  onUpdateData: (newData: FinancialData) => void;
}) {
  const [activeTab, setActiveTab] = useState<'report' | 'chat'>('report');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', content: string }[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const totalExpenses = data.expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalDebtPayments = data.debts.reduce((acc, curr) => acc + curr.monthlyPayment, 0);
  const totalOut = totalExpenses + totalDebtPayments;
  const saldo = data.monthlyIncome - totalOut;

  const [editFormData, setEditFormData] = useState<FinancialData>(data);
  const [currentExpense, setCurrentExpense] = useState<{ category: string; amount: number; type: 'fixa' | 'variavel' | 'pontual' }>({ 
    category: '', 
    amount: 0, 
    type: 'variavel' 
  });
  const [currentReserve, setCurrentReserve] = useState({ name: '', amount: 0 });
  const [currentDebt, setCurrentDebt] = useState({ 
    name: '', 
    totalAmount: 0, 
    monthlyPayment: 0, 
    interestRate: 0 
  });

  useEffect(() => {
    setEditFormData(data);
  }, [data]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const messageToSend = userInput;
    const newMsg = { role: 'user' as const, content: messageToSend };
    setChatMessages(prev => [...prev, newMsg]);
    setUserInput('');
    setIsTyping(true);

    const history = chatMessages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

    try {
      const response = await getFinancialAdvice(data, messageToSend, history);
      setChatMessages(prev => [...prev, { role: 'model', content: response || "Sem resposta do estrategista." }]);
    } catch (err) {
      console.error("Chat Error:", err);
      setChatMessages(prev => [...prev, { role: 'model', content: "Erro na comunicação com a IA. Tente novamente." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-px bg-white/10 p-px rounded-sm border border-white/10"
    >
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#0a0a0a] border-b border-white/10 overflow-hidden"
          >
            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-30 mb-2 block font-bold">Renda Mensal Líquida</label>
                  <input 
                    type="number"
                    className="w-full bg-white/5 border border-white/10 p-4 text-2xl font-light tracking-tighter focus:outline-none focus:border-white/30 text-white"
                    value={editFormData.monthlyIncome}
                    onChange={e => setEditFormData({ ...editFormData, monthlyIncome: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-30 mb-2 block font-bold">Reserva Total (Auditada)</label>
                  <div className="bg-white/5 border border-white/10 p-4 text-2xl font-light tracking-tighter text-white/50">
                    {formatCurrency(editFormData.savings)}
                  </div>
                  <p className="text-[8px] uppercase opacity-20 mt-1">Calculado a partir dos baldes abaixo</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-30 mb-2 block font-bold">Gerenciar Baldes de Reserva</label>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                    {editFormData.reserves?.map(res => (
                      <div key={res.id} className="flex justify-between items-center bg-white/5 p-3 border border-white/5 text-[10px]">
                        <span className="opacity-60">{res.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{formatCurrency(res.amount)}</span>
                          <button onClick={() => {
                            const newReserves = editFormData.reserves.filter(r => r.id !== res.id);
                            const newTotal = newReserves.reduce((acc, curr) => acc + curr.amount, 0);
                            setEditFormData({ ...editFormData, reserves: newReserves, savings: newTotal });
                          }}>
                            <Trash2 className="w-3 h-3 text-red-500 opacity-30 hover:opacity-100" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-1 p-1 border border-white/5 bg-white/2">
                      <input 
                        className="flex-1 bg-transparent text-[10px] focus:outline-none text-white px-2" 
                        placeholder="Novo Balde"
                        value={currentReserve.name}
                        onChange={e => setCurrentReserve({ ...currentReserve, name: e.target.value })}
                      />
                      <input 
                        type="number" 
                        className="w-16 bg-transparent text-[10px] focus:outline-none text-right text-white" 
                        placeholder="R$"
                        value={currentReserve.amount || ''}
                        onChange={e => setCurrentReserve({ ...currentReserve, amount: Number(e.target.value) })}
                      />
                      <button 
                        onClick={() => {
                          if (currentReserve.name && currentReserve.amount) {
                            const newReserves = [...(editFormData.reserves || []), { ...currentReserve, id: Date.now().toString() }];
                            const newTotal = newReserves.reduce((acc, curr) => acc + curr.amount, 0);
                            setEditFormData({ ...editFormData, reserves: newReserves, savings: newTotal });
                            setCurrentReserve({ name: '', amount: 0 });
                          }
                        }}
                        className="bg-white text-black p-1"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-30 mb-3 block font-bold">Diretriz Estratégica (Objetivo)</label>
                  <select 
                    className="w-full p-4 bg-white/5 border border-white/10 focus:outline-none text-sm font-light appearance-none rounded-none text-white"
                    value={editFormData.goal}
                    onChange={e => setEditFormData({ ...editFormData, goal: e.target.value })}
                  >
                    <option value="" className="bg-[#050505]">Definir Visão</option>
                    <option value="Sair das dívidas rápido" className="bg-[#050505]">Libertação: Quitação Agressiva</option>
                    <option value="Conforto e pagamento gradual" className="bg-[#050505]">Equilíbrio: Gestão de Fluxo</option>
                    <option value="Investir e construir patrimônio" className="bg-[#050505]">Acúmulo: Expansão de Capital</option>
                    <option value="Comprar um bem específico" className="bg-[#050505]">Alvo: Aquisição Estruturada</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-30 mb-3 block font-bold">Perfil de Risco (Exposição)</label>
                  <div className="grid grid-cols-3 gap-px bg-white/10 border border-white/10 overflow-hidden rounded-sm">
                    {(['conservador', 'moderado', 'agressivo'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setEditFormData({ ...editFormData, riskProfile: p })}
                        className={cn(
                          "p-4 text-[10px] uppercase tracking-widest transition-all",
                          editFormData.riskProfile === p 
                            ? "bg-white text-black font-bold" 
                            : "bg-[#0d0d0d] text-white opacity-40 hover:opacity-100"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-30 mb-2 block font-bold">Ajustar Despesas (Recorrentes/Pontuais)</label>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {editFormData.expenses.map(exp => (
                      <div key={exp.id} className="flex justify-between items-center bg-white/5 p-3 border border-white/5 text-sm">
                        <div>
                          <span className="opacity-60">{exp.category}</span>
                          <span className="text-[8px] uppercase opacity-20 ml-2">{exp.type}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn("font-medium", exp.type === 'pontual' && "text-blue-400")}>{formatCurrency(exp.amount)}</span>
                          <button onClick={() => setEditFormData({ ...editFormData, expenses: editFormData.expenses.filter(e => e.id !== exp.id) })}>
                            <Trash2 className="w-3 h-3 text-red-500 opacity-30 hover:opacity-100" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex flex-col gap-2 p-3 border border-white/5 bg-white/2">
                      <div className="flex gap-2">
                        <input 
                          className="flex-1 bg-transparent text-xs focus:outline-none text-white border-b border-white/5 pb-1" 
                          placeholder="Nova Despesa"
                          value={currentExpense.category}
                          onChange={e => setCurrentExpense({ ...currentExpense, category: e.target.value })}
                        />
                        <input 
                          type="number" 
                          className="w-16 bg-transparent text-xs focus:outline-none text-right text-white border-b border-white/5 pb-1" 
                          placeholder="R$"
                          value={currentExpense.amount || ''}
                          onChange={e => setCurrentExpense({ ...currentExpense, amount: Number(e.target.value) })}
                        />
                        <button 
                          onClick={() => {
                            if (currentExpense.category && currentExpense.amount) {
                              setEditFormData({ ...editFormData, expenses: [...editFormData.expenses, { ...currentExpense, id: Date.now().toString() }] });
                              setCurrentExpense({ category: '', amount: 0, type: 'variavel' });
                            }
                          }}
                          className="bg-white text-black p-1"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        {(['fixa', 'variavel', 'pontual'] as const).map(t => (
                          <button 
                            key={t}
                            onClick={() => setCurrentExpense({ ...currentExpense, type: t })}
                            className={cn(
                              "text-[8px] uppercase tracking-widest px-2 py-1 border transition-all",
                              currentExpense.type === t ? "bg-white text-black border-white" : "border-white/10 text-white/30"
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-30 mb-2 block font-bold text-red-400">Gerenciar Passivos (Dívidas/Financiamentos)</label>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {(editFormData.debts || []).map(debt => (
                      <div key={debt.id} className="flex justify-between items-center bg-red-500/5 p-3 border border-red-500/10 text-sm">
                        <div>
                          <span className="opacity-60">{debt.name}</span>
                          <span className="text-[8px] uppercase opacity-20 ml-2">{debt.interestRate}% am</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{formatCurrency(debt.totalAmount)}</span>
                          <button 
                            type="button"
                            onClick={() => setEditFormData({ ...editFormData, debts: (editFormData.debts || []).filter(d => d.id !== debt.id) })}
                          >
                            <Trash2 className="w-3 h-3 text-red-500 opacity-30 hover:opacity-100" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex flex-col gap-2 p-3 border border-red-500/10 bg-red-500/2">
                      <div className="flex gap-2">
                        <input 
                          className="flex-1 bg-transparent text-xs focus:outline-none text-white border-b border-white/5 pb-1" 
                          placeholder="Nome da Dívida"
                          value={currentDebt.name}
                          onChange={e => setCurrentDebt({ ...currentDebt, name: e.target.value })}
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            if (!currentDebt.name.trim()) {
                              alert("Por favor, digite um nome para a dívida.");
                              return;
                            }
                            if (currentDebt.totalAmount <= 0) {
                              alert("O valor total deve ser maior que zero.");
                              return;
                            }
                            
                            setEditFormData({ 
                              ...editFormData, 
                              debts: [...(editFormData.debts || []), { ...currentDebt, id: Date.now().toString() }] 
                            });
                            setCurrentDebt({ name: '', totalAmount: 0, monthlyPayment: 0, interestRate: 0 });
                          }}
                          className="bg-red-500 text-white p-1"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase opacity-40">Total</label>
                          <input 
                            type="number" 
                            className="w-full bg-transparent text-[10px] focus:outline-none text-white border-b border-white/5" 
                            placeholder="Saldo"
                            value={currentDebt.totalAmount || ''}
                            onChange={e => setCurrentDebt({ ...currentDebt, totalAmount: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase opacity-40">Parcela</label>
                          <input 
                            type="number" 
                            className="w-full bg-transparent text-[10px] focus:outline-none text-white border-b border-white/5" 
                            placeholder="R$"
                            value={currentDebt.monthlyPayment || ''}
                            onChange={e => setCurrentDebt({ ...currentDebt, monthlyPayment: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase opacity-40">Juros</label>
                          <input 
                            type="number" 
                            className="w-full bg-transparent text-[10px] focus:outline-none text-white border-b border-white/5" 
                            placeholder="%"
                            value={currentDebt.interestRate || ''}
                            onChange={e => setCurrentDebt({ ...currentDebt, interestRate: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => onUpdateData(editFormData)}
                    className="w-full bg-[#10b981] text-white py-4 font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-[#059669] transition-colors"
                  >
                    Confirmar Novo Planejamento
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Section / Summary Bar Look */}
      <div className="grid grid-cols-1 md:grid-cols-3 bg-[#050505]">
        <div className="p-10 border-r border-white/10">
          <p className="text-[11px] uppercase tracking-[0.2em] opacity-40 mb-3 flex items-center gap-2">
            <Wallet className="w-3 h-3" /> Renda Total
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-light tracking-tighter text-white">
              {formatCurrency(data.monthlyIncome).split(',')[0]}
              <span className="text-xl opacity-30">,{formatCurrency(data.monthlyIncome).split(',')[1]}</span>
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-widest opacity-20 mt-2">Visão: {data.goal}</p>
        </div>
        <div className="p-10 border-r border-white/10 bg-[#0a0a0a]">
          <p className="text-[11px] uppercase tracking-[0.2em] opacity-40 mb-3 flex items-center gap-2">
            <CreditCard className="w-3 h-3 text-[#f87171]" /> Gastos e Passivos (Saídas)
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-light tracking-tighter text-[#f87171]">
              {formatCurrency(totalOut).split(',')[0]}
              <span className="text-xl opacity-30">,{formatCurrency(totalOut).split(',')[1]}</span>
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-widest opacity-20 mt-2">{data.expenses.length} categorias de despesas • {data.debts.length} dívidas a quitar</p>
        </div>
        <div className="p-10 bg-[#050505]">
          <p className="text-[11px] uppercase tracking-[0.2em] opacity-40 mb-3 flex items-center gap-2">
            <PiggyBank className="w-3 h-3 text-[#10b981]" /> Saldo Disponível
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-light tracking-tighter text-[#10b981]">
              {formatCurrency(saldo).split(',')[0]}
              <span className="text-xl opacity-30">,{formatCurrency(saldo).split(',')[1]}</span>
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-widest opacity-20 mt-2">Pronto para alocação</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 bg-[#050505]">
        {/* Left Section: Details */}
        <div className="lg:col-span-5 p-10 border-r border-white/10 space-y-12">
          <div>
            <h3 className="text-xs uppercase tracking-[0.3em] opacity-40 mb-8 border-b border-white/5 pb-4">Plano de Gastos Detalhado</h3>
            <table className="w-full text-sm font-light">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.2em] opacity-20 border-b border-white/5">
                  <th className="pb-4 font-normal">Categoria</th>
                  <th className="pb-4 font-normal">Aporte</th>
                  <th className="pb-4 font-normal text-right">Impacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.expenses.map(exp => (
                  <tr key={exp.id} className="group">
                    <td className="py-5 opacity-80 group-hover:opacity-100 transition-opacity">
                      {exp.category}
                      {exp.type === 'pontual' && <span className="ml-2 text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">Pontual</span>}
                    </td>
                    <td className="py-5 font-medium">{formatCurrency(exp.amount)}</td>
                    <td className="py-5 text-right opacity-40 text-[10px] uppercase">
                      {exp.type === 'fixa' ? 'Essencial' : exp.type === 'pontual' ? 'Único' : 'Flexível'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-8 p-6 surface-dark rounded-sm">
              <p className="text-xs italic font-serif opacity-70 leading-relaxed">
                "Mantemos uma margem operacional de <span className="text-white font-bold">{formatCurrency(saldo * 0.1)}</span> incorporada para variações mensais."
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-[0.3em] opacity-40 mb-8 border-b border-white/5 pb-4">Passivos & Dívidas em Aberto</h3>
            <table className="w-full text-sm font-light">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.2em] opacity-20 border-b border-white/5">
                  <th className="pb-4 font-normal">Dívida</th>
                  <th className="pb-4 font-normal">Total</th>
                  <th className="pb-4 font-normal text-right">Parcela</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.debts.map(debt => (
                  <tr key={debt.id} className="group">
                    <td className="py-5 opacity-80 group-hover:opacity-100 transition-opacity">
                      {debt.name}
                      <span className="ml-2 text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">{debt.interestRate}% am</span>
                    </td>
                    <td className="py-5 font-medium">{formatCurrency(debt.totalAmount)}</td>
                    <td className="py-5 text-right opacity-40 text-[10px] uppercase">
                      {formatCurrency(debt.monthlyPayment)}
                    </td>
                  </tr>
                ))}
                {data.debts.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-10 text-center opacity-20 text-[10px] uppercase tracking-widest">
                      Nenhum passivo registrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-6">
             <h3 className="text-xs uppercase tracking-[0.3em] opacity-40 mb-4 border-b border-white/5 pb-4">Visualização de Fluxo</h3>
             <div className="h-[200px]">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={[
                       ...data.expenses.map((e, idx) => ({ name: `${e.category} (${idx})`, value: e.amount })),
                       ...data.debts.map((d, idx) => ({ name: `${d.name} (${idx})`, value: d.monthlyPayment }))
                     ]}
                     innerRadius={50}
                     outerRadius={70}
                     paddingAngle={2}
                     dataKey="value"
                   >
                     {[
                       ...data.expenses.map((_, i) => <Cell key={`pie-exp-${i}`} fill={['#262626', '#404040', '#525252'][i % 3]} />),
                       ...data.debts.map((_, i) => <Cell key={`pie-debt-${i}`} fill={['#ef4444', '#b91c1c'][i % 2]} />)
                     ]}
                   </Pie>
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}
                     itemStyle={{ color: '#e5e5e5', fontSize: '12px' }}
                   />
                 </PieChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* Right Section: Strategy & Advice */}
        <div className="lg:col-span-7 flex flex-col">
          {/* Debt Strategy Section */}
          <div className="p-10 border-b border-white/10 bg-[#080808]">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xs uppercase tracking-[0.3em] opacity-40">Estratégia de Passivos</h3>
              <button 
                onClick={onRefresh}
                className="text-[10px] uppercase font-bold tracking-widest bg-white text-black px-6 py-2 hover:bg-white/90 transition-colors"
                disabled={loading}
              >
                {loading ? "Processando..." : "Recalcular Rota"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div>
                  <p className="text-[10px] uppercase opacity-30 mb-3">Prioridade do Mês</p>
                  {data.debts.length > 0 ? (
                    <div className="space-y-2">
                       <h4 className="text-2xl font-serif italic text-white">{data.debts[0].name}</h4>
                       <div className="flex items-baseline gap-3">
                         <span className="text-3xl font-light tracking-tighter">{formatCurrency(data.debts[0].totalAmount)}</span>
                         <span className="text-[10px] text-[#f87171] uppercase tracking-tighter">Juros: {data.debts[0].interestRate}% a.m</span>
                       </div>
                    </div>
                  ) : (
                    <p className="text-sm opacity-30 italic">Nenhum passivo pendente registrado.</p>
                  )}
               </div>
               <div className="p-6 border border-white/5 bg-white/2 rounded-sm backdrop-blur-sm">
                  <p className="text-[10px] uppercase opacity-30 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-[#10b981]" /> Impacto IA
                  </p>
                  <p className="text-xs leading-relaxed italic font-light opacity-80">
                    Acelerar em <span className="text-[#10b981] font-bold">15%</span> o aporte livre para o passivo de maior juro reduz seu tempo de exposição em <span className="text-[#10b981] font-bold">~3 meses</span>.
                  </p>
               </div>
            </div>
          </div>

          {/* AI Insights & Chat Section */}
          <div className="p-10 flex-grow bg-[#050505] flex flex-col min-h-[600px]">
             <div className="flex gap-8 mb-10 border-b border-white/5">
                <button 
                  onClick={() => setActiveTab('report')}
                  className={cn(
                    "text-xs uppercase tracking-[0.3em] pb-4 transition-all relative",
                    activeTab === 'report' ? "opacity-100 font-bold" : "opacity-30 hover:opacity-100"
                  )}
                >
                  Análise Estratégica
                  {activeTab === 'report' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />}
                </button>
                <button 
                  onClick={() => setActiveTab('chat')}
                  className={cn(
                    "text-xs uppercase tracking-[0.3em] pb-4 transition-all relative flex items-center gap-2",
                    activeTab === 'chat' ? "opacity-100 font-bold" : "opacity-30 hover:opacity-100"
                  )}
                >
                  <MessageSquare className="w-3 h-3" />
                  Estrategista AI
                  {activeTab === 'chat' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />}
                </button>
             </div>
             
             <div className="flex-grow flex flex-col overflow-hidden">
               {activeTab === 'report' ? (
                 <div className="overflow-y-auto pr-4 custom-scrollbar">
                   {loading ? (
                     <div className="space-y-6 animate-pulse">
                       <div className="h-4 bg-white/5 rounded w-3/4" />
                       <div className="h-4 bg-white/5 rounded w-1/2" />
                       <div className="h-40 bg-white/5 rounded w-full" />
                     </div>
                   ) : (
                     <div className="markdown-body text-[#e5e5e5] selection:bg-white selection:text-black">
                       <ReactMarkdown>{advice}</ReactMarkdown>
                     </div>
                   )}
                 </div>
               ) : (
                 <div className="flex flex-col h-full">
                     <div className="overflow-y-auto pr-4 custom-scrollbar">
                       {chatMessages.length === 0 && (
                         <div className="h-full flex flex-col items-center justify-center opacity-20 text-center px-10 py-20">
                            <BrainCircuit className="w-12 h-12 mb-4" />
                            <p className="text-sm italic font-serif">"Estou pronto para simular cenários. Pergunte-me sobre parcelamentos, novas aquisições ou ajustes prioritários."</p>
                         </div>
                       )}
                       {chatMessages.map((msg, i) => (
                         <div key={`chat-msg-${i}-${msg.role}`} className={cn(
                           "flex mb-6",
                           msg.role === 'user' ? "justify-end" : "justify-start"
                         )}>
                            <div className={cn(
                              "max-w-[85%] p-4 rounded-sm text-sm leading-relaxed",
                              msg.role === 'user' 
                                ? "bg-white text-black font-medium" 
                                : "bg-white/5 border border-white/10 text-white/90"
                            )}>
                               <div className="markdown-body prose-sm prose-invert">
                                 <ReactMarkdown>{msg.content}</ReactMarkdown>
                               </div>
                            </div>
                         </div>
                       ))}
                       {isTyping && (
                         <div className="flex justify-start mb-6">
                            <div className="bg-white/5 border border-white/10 p-4 rounded-sm">
                               <div className="flex gap-1">
                                  <div className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" />
                                  <div className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce [animation-delay:0.2s]" />
                                  <div className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce [animation-delay:0.4s]" />
                               </div>
                            </div>
                         </div>
                       )}
                    </div>
                    
                    <div className="relative mt-auto">
                       <input 
                         type="text"
                         className="w-full bg-white/5 border border-white/10 p-5 pr-14 focus:outline-none focus:border-white/30 text-white/90 text-sm placeholder:opacity-20"
                         placeholder="Ex: Vale a pena parcelar meu novo gasto pontual em 10x?"
                         value={userInput}
                         onChange={e => setUserInput(e.target.value)}
                         onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                       />
                       <button 
                         onClick={handleSendMessage}
                         disabled={isTyping || !userInput.trim()}
                         className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 transition-colors disabled:opacity-20"
                       >
                         <Send className="w-4 h-4 text-white" />
                       </button>
                    </div>
                 </div>
               )}
             </div>
          </div>

          {/* Bottom Allocation Bars / Reserves Breakdown */}
          <div className="p-10 bg-[#0a0a0a] border-t border-white/5">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[10px] uppercase tracking-widest opacity-30">Distribuição de Reservas</p>
                    <span className="text-[10px] font-bold opacity-50">{data.reserves?.length || 0} Baldes</span>
                  </div>
                  <div className="space-y-3">
                    {data.reserves?.map(res => (
                      <div key={res.id}>
                        <div className="flex justify-between items-center text-[10px] mb-1">
                          <span className="opacity-60">{res.name}</span>
                          <span>{((res.amount / (data.savings || 1)) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#10b981]" 
                            style={{ width: `${(res.amount / (data.savings || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {(!data.reserves || data.reserves.length === 0) && (
                      <div className="flex justify-between items-center text-xl font-light tracking-tight">
                        <p>{formatCurrency(data.savings)}</p>
                        <p className="text-[10px] opacity-20 uppercase">Fundo Geral</p>
                      </div>
                    )}
                  </div>
               </div>
               <div>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[10px] uppercase tracking-widest opacity-30">Allocation Yield</p>
                    <span className="text-[10px] font-bold opacity-50">Fluxo Disponível</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
                    <div 
                      className="h-full bg-white/20 transition-all duration-1000" 
                      style={{ width: saldo > 0 ? '40%' : '0%' }}
                    />
                  </div>
                  <p className="text-xl font-light tracking-tight">{formatCurrency(saldo > 0 ? saldo * 0.4 : 0)}</p>
                  <p className="text-[10px] opacity-20 uppercase mt-1">Sugestão de Aporte Oportunista</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
