import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  LayoutDashboard, Package, Users, ReceiptEuro, TrendingUp, Plus, Edit2, Trash2, Download, Upload, CheckCircle2, XCircle, Copy, MessageSquare, BarChart3, LineChart as LineChartIcon
} from 'lucide-react';

// --- Konstansok ---
const MONTHS = [
  "Január", "Február", "Március", "Április", "Május", "Június", 
  "Július", "Augusztus", "Szeptember", "Október", "November", "December"
];

const INITIAL_STATE = {
  products: [],
  subscribers: [],
  costs: [],
};

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(INITIAL_STATE);
  
  // Szerkesztési állapotok
  const [editingProduct, setEditingProduct] = useState(null);
  const [chartType, setChartType] = useState('bar'); // 'bar' vagy 'line'
  
  // Grafikon szűrők
  const [revenueFilters, setRevenueFilters] = useState({
    subscription: true,
    implementation: true,
    custom: true
  });

  // --- Segédfüggvények ---
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  const calculateFinancials = useMemo(() => {
    const monthlyData = MONTHS.map((name, index) => {
      const monthIdx = index + 1;
      
      let revSub = 0;
      let revImpl = 0;
      let revCustom = 0;
      
      data.subscribers.forEach(sub => {
        if (monthIdx >= sub.startMonth) {
          revSub += Number(sub.monthlyFee || 0);
        }
        if (monthIdx === Number(sub.startMonth)) {
          revImpl += Number(sub.implementationFee || 0);
        }
        if (sub.customDev && sub.customDev[monthIdx]) {
          revCustom += Number(sub.customDev[monthIdx] || 0);
        }
      });

      let costTotal = 0;
      data.costs.forEach(cost => {
        const start = Number(cost.startMonth);
        const end = Number(cost.endMonth || 12);
        
        if (cost.type === 'recurring') {
          // Csak akkor számoljuk, ha a hónap a tartományon belül van
          if (monthIdx >= start && monthIdx <= end) {
            costTotal += Number(cost.amount || 0);
          }
        } else {
          // Egyszeri költség csak a kezdő hónapban
          if (monthIdx === start) {
            costTotal += Number(cost.amount || 0);
          }
        }
      });

      const totalRev = 
        (revenueFilters.subscription ? revSub : 0) + 
        (revenueFilters.implementation ? revImpl : 0) + 
        (revenueFilters.custom ? revCustom : 0);

      return {
        month: name,
        monthIdx,
        revSub,
        revImpl,
        revCustom,
        totalRevenue: totalRev,
        totalCost: costTotal,
        profit: totalRev - costTotal
      };
    });

    let cumRev = 0;
    let cumProfit = 0;
    return monthlyData.map(d => {
      cumRev += d.totalRevenue;
      cumProfit += d.profit;
      return { ...d, cumulativeRevenue: cumRev, cumulativeProfit: cumProfit };
    });
  }, [data, revenueFilters]);

  const totals = useMemo(() => {
    const last = calculateFinancials[calculateFinancials.length - 1];
    const totalCosts = calculateFinancials.reduce((sum, m) => sum + m.totalCost, 0);
    const totalRev = calculateFinancials.reduce((sum, m) => sum + m.totalRevenue, 0);
    
    return {
      revenue: totalRev,
      costs: totalCosts,
      profit: totalRev - totalCosts,
      cumProfit: last?.cumulativeProfit || 0
    };
  }, [calculateFinancials]);

  // --- Akciók ---

  const addProduct = (e) => {
    e.preventDefault();
    const name = e.target.productName.value;
    const newProduct = { id: crypto.randomUUID(), name };
    setData(prev => ({ ...prev, products: [...prev.products, newProduct] }));
    e.target.reset();
    setEditingProduct(null);
  };

  const addSubscriberInline = (productId) => {
    const newSub = {
      id: crypto.randomUUID(),
      productId,
      name: 'Új Előfizető',
      startMonth: 1,
      implementationFee: 0,
      monthlyFee: 0,
      customDev: {},
      customDevComments: {}
    };
    setData(prev => ({ ...prev, subscribers: [...prev.subscribers, newSub] }));
  };

  const duplicateSubscriber = (subId) => {
    const subToDup = data.subscribers.find(s => s.id === subId);
    if (!subToDup) return;
    const newSub = { 
      ...subToDup, 
      id: crypto.randomUUID(), 
      name: `${subToDup.name} (Másolat)`,
      customDev: { ...subToDup.customDev },
      customDevComments: { ...subToDup.customDevComments }
    };
    setData(prev => ({ ...prev, subscribers: [...prev.subscribers, newSub] }));
  };

  const updateSubscriberField = (subId, field, value) => {
    setData(prev => ({
      ...prev,
      subscribers: prev.subscribers.map(s => s.id === subId ? { ...s, [field]: value } : s)
    }));
  };

  const updateCustomDev = (subId, monthIdx, value) => {
    setData(prev => ({
      ...prev,
      subscribers: prev.subscribers.map(s => {
        if (s.id === subId) {
          return { ...s, customDev: { ...s.customDev, [monthIdx]: Number(value) } };
        }
        return s;
      })
    }));
  };

  const updateCustomDevComment = (subId, monthIdx, comment) => {
    setData(prev => ({
      ...prev,
      subscribers: prev.subscribers.map(s => {
        if (s.id === subId) {
          const comments = s.customDevComments || {};
          return { ...s, customDevComments: { ...comments, [monthIdx]: comment } };
        }
        return s;
      })
    }));
  };

  const addCost = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newCost = {
      id: crypto.randomUUID(),
      name: formData.get('name'),
      type: formData.get('type'),
      amount: Number(formData.get('amount')),
      startMonth: Number(formData.get('startMonth')),
      endMonth: 12
    };
    setData(prev => ({ ...prev, costs: [...prev.costs, newCost] }));
    e.target.reset();
  };

  const updateCostField = (costId, field, value) => {
    setData(prev => ({
      ...prev,
      costs: prev.costs.map(c => c.id === costId ? { ...c, [field]: value } : c)
    }));
  };

  const duplicateCost = (costId) => {
    const costToDup = data.costs.find(c => c.id === costId);
    if (!costToDup) return;
    const newCost = { 
      ...costToDup, 
      id: crypto.randomUUID(), 
      name: `${costToDup.name} (Másolat)`
    };
    setData(prev => ({ ...prev, costs: [...prev.costs, newCost] }));
  };

  const deleteItem = (type, id) => {
    setData(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item.id !== id),
      subscribers: type === 'products' ? prev.subscribers.filter(s => s.productId !== id) : prev.subscribers
    }));
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `penzugyi_terv_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const importedData = JSON.parse(evt.target.result);
        setData(importedData);
      } catch (err) {
        alert("Hiba az importálás során: Érvénytelen fájlformátum.");
      }
    };
    reader.readAsText(file);
  };

  // --- Komponensek ---

  const SidebarItem = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        activeTab === id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 p-6 flex flex-col space-y-8">
        <div className="flex items-center space-x-3 px-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <TrendingUp size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">FinPlan <span className="text-blue-500">Pro</span></h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          <SidebarItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem id="products" icon={Package} label="Termékek & Ügyfelek" />
          <SidebarItem id="costs" icon={ReceiptEuro} label="Költségek" />
          <SidebarItem id="io" icon={Upload} label="Import / Export" />
        </nav>

        <div className="pt-6 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center">© 2024 Digitális Tervező</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold">Pénzügyi Áttekintés</h2>
                <p className="text-gray-400">Éves összesített mutatók és elemzések</p>
              </div>
              <div className="flex space-x-4">
                {/* Chart Type Toggle */}
                <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800">
                  <button 
                    onClick={() => setChartType('bar')}
                    className={`p-1.5 rounded ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}
                    title="Oszlopdiagram"
                  >
                    <BarChart3 size={18} />
                  </button>
                  <button 
                    onClick={() => setChartType('line')}
                    className={`p-1.5 rounded ${chartType === 'line' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}
                    title="Vonaldiagram"
                  >
                    <LineChartIcon size={18} />
                  </button>
                </div>

                {/* Filters */}
                <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800">
                  <label className="flex items-center px-3 py-1 space-x-2 cursor-pointer border-r border-gray-800">
                    <input type="checkbox" checked={revenueFilters.subscription} onChange={() => setRevenueFilters(p => ({...p, subscription: !p.subscription}))} className="rounded text-blue-600 focus:ring-blue-600 bg-gray-800 border-gray-700" />
                    <span className="text-xs font-medium">Előfizetés</span>
                  </label>
                  <label className="flex items-center px-3 py-1 space-x-2 cursor-pointer border-r border-gray-800">
                    <input type="checkbox" checked={revenueFilters.implementation} onChange={() => setRevenueFilters(p => ({...p, implementation: !p.implementation}))} className="rounded text-blue-600 focus:ring-blue-600 bg-gray-800 border-gray-700" />
                    <span className="text-xs font-medium">Impl.</span>
                  </label>
                  <label className="flex items-center px-3 py-1 space-x-2 cursor-pointer">
                    <input type="checkbox" checked={revenueFilters.custom} onChange={() => setRevenueFilters(p => ({...p, custom: !p.custom}))} className="rounded text-blue-600 focus:ring-blue-600 bg-gray-800 border-gray-700" />
                    <span className="text-xs font-medium">Egyedi</span>
                  </label>
                </div>
              </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Összes Bevétel', value: totals.revenue, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { label: 'Összes Költség', value: totals.costs, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                { label: 'Éves Profit', value: totals.profit, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { label: 'Kumulált Profit', value: totals.cumProfit, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              ].map((kpi, i) => (
                <div key={i} className={`p-6 rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm ${kpi.bg}`}>
                  <p className="text-sm text-gray-400 font-medium mb-1">{kpi.label}</p>
                  <p className={`text-2xl font-bold ${kpi.color}`}>{formatCurrency(kpi.value)}</p>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-6">Havi Bevétel vs. Költség</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' ? (
                      <BarChart data={calculateFinancials}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                          formatter={(value) => formatCurrency(value)}
                        />
                        <Legend verticalAlign="top" height={36}/>
                        <Bar name="Bevétel" dataKey="totalRevenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar name="Költség" dataKey="totalCost" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : (
                      <LineChart data={calculateFinancials}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                          formatter={(value) => formatCurrency(value)}
                        />
                        <Legend verticalAlign="top" height={36}/>
                        <Line type="monotone" name="Bevétel" dataKey="totalRevenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                        <Line type="monotone" name="Költség" dataKey="totalCost" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-6">Kumulatív Profit Alakulása</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={calculateFinancials}>
                      <defs>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                      <Area type="monotone" name="Kum. Profit" dataKey="cumulativeProfit" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-8 max-w-6xl mx-auto">
            <header className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold">Termékek és Előfizetők</h2>
                <p className="text-gray-400">Digitális termékek bevételeinek modellezése</p>
              </div>
              <button 
                onClick={() => setEditingProduct({ name: '' })}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-all shadow-lg"
              >
                <Plus size={18} />
                <span>Új termék</span>
              </button>
            </header>

            <div className="space-y-12">
              {data.products.length === 0 && (
                <div className="bg-gray-900 border-2 border-dashed border-gray-800 rounded-3xl p-12 text-center">
                  <Package size={48} className="mx-auto text-gray-700 mb-4" />
                  <p className="text-gray-500">Még nincsenek létrehozott termékek.</p>
                </div>
              )}

              {data.products.map(product => (
                <div key={product.id} className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
                  <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/20">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-500/20 p-2 rounded-lg">
                        <Package size={22} className="text-blue-400" />
                      </div>
                      <h3 className="text-2xl font-bold">{product.name}</h3>
                    </div>
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => addSubscriberInline(product.id)}
                        className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-sm font-semibold px-4 py-2 rounded-xl flex items-center space-x-2 transition-all"
                      >
                        <Plus size={16} />
                        <span>Új előfizető hozzáadása</span>
                      </button>
                      <button 
                        onClick={() => deleteItem('products', product.id)}
                        className="text-gray-500 hover:text-rose-400 p-2 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="p-8 space-y-8">
                    {data.subscribers.filter(s => s.productId === product.id).map(sub => (
                      <div key={sub.id} className="bg-gray-950/50 border border-gray-800 rounded-2xl p-6 animate-in slide-in-from-left-4 duration-300">
                        {/* Előfizető fejléc / alap adatok */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                          <div className="lg:col-span-3 space-y-4">
                            <div>
                              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 block">Előfizető neve</label>
                              <input 
                                value={sub.name}
                                onChange={(e) => updateSubscriberField(sub.id, 'name', e.target.value)}
                                className="w-full bg-transparent border-b border-gray-800 focus:border-blue-500 py-1 font-bold text-lg text-blue-400 outline-none transition-colors"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Kezdés</label>
                                <select 
                                  value={sub.startMonth}
                                  onChange={(e) => updateSubscriberField(sub.id, 'startMonth', Number(e.target.value))}
                                  className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                                >
                                  {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                                </select>
                              </div>
                              <div className="flex items-end justify-end space-x-2 pb-1">
                                <button 
                                  onClick={() => duplicateSubscriber(sub.id)}
                                  className="p-1.5 bg-gray-900 text-gray-400 hover:text-blue-400 rounded transition-colors"
                                  title="Másolás"
                                >
                                  <Copy size={16} />
                                </button>
                                <button 
                                  onClick={() => deleteItem('subscribers', sub.id)}
                                  className="p-1.5 bg-gray-900 text-gray-400 hover:text-rose-400 rounded transition-colors"
                                  title="Törlés"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="lg:col-span-3 grid grid-cols-1 gap-4">
                            <div>
                              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 block">Implementációs díj (€)</label>
                              <input 
                                type="number"
                                value={sub.implementationFee}
                                onChange={(e) => updateSubscriberField(sub.id, 'implementationFee', Number(e.target.value))}
                                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 font-mono font-semibold outline-none focus:ring-1 focus:ring-blue-600 transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 block">Havi előfizetési díj (€)</label>
                              <input 
                                type="number"
                                value={sub.monthlyFee}
                                onChange={(e) => updateSubscriberField(sub.id, 'monthlyFee', Number(e.target.value))}
                                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 font-mono font-semibold outline-none focus:ring-1 focus:ring-blue-600 transition-all"
                              />
                            </div>
                          </div>

                          <div className="lg:col-span-6">
                            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2 block">Egyedi fejlesztések és megjegyzések</label>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                              {MONTHS.map((m, idx) => (
                                <div key={idx} className="group relative">
                                  <div className="text-[9px] text-gray-600 font-bold mb-1 truncate px-1">{m}</div>
                                  <div className="space-y-1">
                                    <input 
                                      type="number" 
                                      placeholder="€"
                                      value={sub.customDev[idx + 1] || ''}
                                      onChange={(e) => updateCustomDev(sub.id, idx + 1, e.target.value)}
                                      className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-[11px] font-mono focus:border-blue-500 outline-none transition-all"
                                    />
                                    <div className="relative">
                                      <input 
                                        type="text"
                                        placeholder="Megj..."
                                        value={sub.customDevComments?.[idx + 1] || ''}
                                        onChange={(e) => updateCustomDevComment(sub.id, idx + 1, e.target.value)}
                                        className="w-full bg-gray-900/50 border border-gray-800/50 rounded px-1.5 py-0.5 text-[9px] focus:border-blue-500/50 outline-none italic text-gray-500"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {data.subscribers.filter(s => s.productId === product.id).length === 0 && (
                      <div className="text-center py-8 bg-gray-950/20 border border-dashed border-gray-800 rounded-2xl">
                        <Users size={32} className="mx-auto text-gray-800 mb-2" />
                        <p className="text-gray-600 text-sm">Nincsenek előfizetők rögzítve ennél a terméknél.</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'costs' && (
          <div className="space-y-8 max-w-6xl mx-auto">
            <header>
              <h2 className="text-3xl font-bold">Globális Költségek</h2>
              <p className="text-gray-400">Üzemeltetési és bérköltségek rögzítése és ütemezése</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 h-fit sticky top-8">
                <h3 className="text-lg font-semibold mb-6 flex items-center space-x-2">
                  <Plus size={20} className="text-blue-400" />
                  <span>Új költségtétel</span>
                </h3>
                <form onSubmit={addCost} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Megnevezés</label>
                    <input name="name" required className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Pl: AWS Szerver" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Típus</label>
                      <select name="type" className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-600">
                        <option value="recurring">Havi rendszeres</option>
                        <option value="one-time">Egyszeri</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Összeg (€)</label>
                      <input name="amount" type="number" required className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-600" placeholder="0" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Mettől</label>
                      <select name="startMonth" className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-600">
                        {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Meddig</label>
                      <select defaultValue="12" className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 outline-none opacity-50 cursor-not-allowed">
                        <option value="12">Decemberig</option>
                      </select>
                      <p className="text-[10px] text-gray-600 mt-1">Szerkesztés a táblázatban</p>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg mt-4">
                    Hozzáadás
                  </button>
                </form>
              </div>

              <div className="lg:col-span-3 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-800/50 text-gray-400 text-[10px] uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold">Megnevezés</th>
                      <th className="px-6 py-4 font-semibold w-32">Típus</th>
                      <th className="px-6 py-4 font-semibold w-40">Összeg (€)</th>
                      <th className="px-6 py-4 font-semibold w-32">Mettől</th>
                      <th className="px-6 py-4 font-semibold w-32">Meddig</th>
                      <th className="px-6 py-4 w-24"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {data.costs.map(cost => (
                      <tr key={cost.id} className="hover:bg-gray-800/20 transition-colors group">
                        <td className="px-6 py-3">
                          <input 
                            value={cost.name} 
                            onChange={(e) => updateCostField(cost.id, 'name', e.target.value)}
                            className="bg-transparent border-b border-transparent hover:border-gray-700 focus:border-blue-500 py-1 outline-none w-full transition-colors font-medium"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <select 
                            value={cost.type}
                            onChange={(e) => updateCostField(cost.id, 'type', e.target.value)}
                            className="bg-gray-950 border border-gray-800 rounded px-2 py-1 text-xs outline-none w-full"
                          >
                            <option value="recurring">Havi</option>
                            <option value="one-time">Egyszeri</option>
                          </select>
                        </td>
                        <td className="px-6 py-3">
                          <input 
                            type="number"
                            value={cost.amount} 
                            onChange={(e) => updateCostField(cost.id, 'amount', Number(e.target.value))}
                            className="bg-transparent border-b border-transparent hover:border-gray-700 focus:border-blue-500 py-1 font-mono font-semibold outline-none w-full text-right"
                          />
                        </td>
                        <td className="px-6 py-3 text-sm">
                          <select 
                            value={cost.startMonth}
                            onChange={(e) => updateCostField(cost.id, 'startMonth', Number(e.target.value))}
                            className="bg-transparent outline-none text-gray-300 w-full"
                          >
                            {MONTHS.map((m, i) => <option key={i} value={i+1} className="bg-gray-900">{m}</option>)}
                          </select>
                        </td>
                        <td className="px-6 py-3 text-sm">
                          <select 
                            value={cost.endMonth || 12}
                            disabled={cost.type === 'one-time'}
                            onChange={(e) => updateCostField(cost.id, 'endMonth', Number(e.target.value))}
                            className={`bg-transparent outline-none text-gray-300 w-full ${cost.type === 'one-time' ? 'opacity-20 cursor-not-allowed' : ''}`}
                          >
                            {MONTHS.map((m, i) => <option key={i} value={i+1} className="bg-gray-900">{m}</option>)}
                          </select>
                        </td>
                        <td className="px-6 py-3 text-right flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => duplicateCost(cost.id)}
                            className="text-gray-600 hover:text-blue-400 p-1 transition-colors"
                            title="Duplikálás"
                          >
                            <Copy size={16} />
                          </button>
                          <button 
                            onClick={() => deleteItem('costs', cost.id)} 
                            className="text-gray-600 hover:text-rose-400 p-1 transition-colors"
                            title="Törlés"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {data.costs.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-600 italic">Még nincsenek rögzített költségek.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'io' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <header className="text-center">
              <h2 className="text-3xl font-bold mb-2">Adatok Kezelése</h2>
              <p className="text-gray-400">Mentse el tervét vagy töltsön be egy korábbi verziót</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 flex flex-col items-center text-center space-y-4 hover:border-blue-500/50 transition-colors">
                <div className="bg-blue-500/10 p-4 rounded-full text-blue-400">
                  <Download size={32} />
                </div>
                <h3 className="text-xl font-bold">Exportálás</h3>
                <p className="text-gray-500 text-sm">Mentse el az összes terméket, előfizetőt és költséget egy JSON fájlba.</p>
                <button 
                  onClick={handleExport}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Fájl letöltése
                </button>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 flex flex-col items-center text-center space-y-4 hover:border-emerald-500/50 transition-colors">
                <div className="bg-emerald-500/10 p-4 rounded-full text-emerald-400">
                  <Upload size={32} />
                </div>
                <h3 className="text-xl font-bold">Importálás</h3>
                <p className="text-gray-500 text-sm">Töltsön be egy korábban mentett pénzügyi tervet a rendszerbe.</p>
                <label className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-all cursor-pointer">
                  Fájl kiválasztása
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-amber-200 text-sm">
              <p className="flex items-center space-x-2">
                <CheckCircle2 size={16} />
                <span>Figyelem: Az importálás felülírja a jelenlegi munkamenet összes adatát!</span>
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold mb-6">Új termék létrehozása</h3>
            <form onSubmit={addProduct}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Termék neve</label>
                  <input name="productName" autoFocus required className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Pl: SaaS CRM rendszer" />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 font-bold transition-all">Mégse</button>
                  <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-600/20">Létrehozás</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;