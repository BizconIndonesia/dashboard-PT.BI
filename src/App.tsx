import React, { useState, useEffect, useRef, Component, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from './firebase';
import { 
  collection, 
  addDoc,
  setDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  getDocFromServer,
  getDocs,
  writeBatch,
  doc
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut,
  signInAnonymously,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { 
  BarChart3, 
  Fuel, 
  CloudRain, 
  MessageSquare, 
  LogOut, 
  LayoutDashboard,
  User as UserIcon,
  ChevronRight,
  TrendingUp,
  Droplets,
  HardHat,
  Truck,
  Activity,
  Plus,
  Paperclip,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText as FileIcon,
  X,
  FileText,
  Upload,
  Bell,
  Users,
  CheckCircle,
  AlertTriangle,
  Info,
  Download,
  Database,
  Search,
  Filter,
  RefreshCcw,
  Trash2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell,
  PieChart, Pie, ComposedChart
} from 'recharts';
import { RAW_DATA, getMonthNames, filterByMonth } from './data';
import { User, DailyRecord, ChatMessage } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Help functions ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    const path = 'test/connection';
    await getDocFromServer(doc(db, path));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

const downloadTemplate = () => {
  const csvContent = [
    'Date,OB_Plan,OB_Actual,OB_Fuel,CG_Plan,CG_Actual,CG_Fuel,Rain_Plan,Rain_Actual,Slippery_Plan,Slippery_Actual,Rainfall,Prod_T100,Prod_T50,Prod_T30,PA_Loader,PA_Hauler,PA_CG,PA_Grader,PA_Bulldozer,PA_Support',
    '26 Mar,17667.03,14015.08,6477.00,2347.70,0,0,4.81,0,1.83,0,0,342.49,203.43,173.64,100,86,100,100,80,100',
    '27 Mar,8833.51,11167.47,14300.00,1173.85,93.82,465.00,2.41,3.77,0.92,0.30,10.50,344.70,204.68,0,100,86,100,100,0,100'
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'daily_operation_template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- Components ---
class GlobalErrorBoundary extends Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if ((this as any).state.hasError) {
      let errorMessage = "Terjadi kesalahan sistem.";
      try {
        const parsed = JSON.parse((this as any).state.error.message);
        if (parsed.error && parsed.error.includes("insufficient permissions")) {
          errorMessage = "Akses Ditolak: Anda tidak memiliki izin untuk melihat data ini. Pastikan akun Anda sudah terdaftar di sistem.";
        }
      } catch (e) {
        errorMessage = (this as any).state.error.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-app-bg flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-card-bg border border-danger/30 rounded-2xl p-8 space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-text-primary">Sistem Mengalami Kendala</h2>
            <div className="p-4 bg-app-bg/50 rounded-xl border border-border-subtle text-left">
              <p className="text-xs font-mono text-danger/80 break-words line-clamp-4">{errorMessage}</p>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Jika masalah berlanjut, hubungi administrator IT Site PT.LHL.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full p-4 bg-accent text-white font-bold uppercase tracking-widest rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw size={16} /> Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

const Login = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      onLogin({
        uid: result.user.uid,
        name: result.user.displayName || 'Anonymous',
        email: result.user.email || undefined,
        position: 'Dashboard User',
        photoURL: result.user.photoURL || undefined
      });
    } catch (error) {
      console.error("Google login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name && position) {
      setIsLoading(true);
      try {
        const result = await signInAnonymously(auth);
        await updateProfile(result.user, { displayName: name });
        onLogin({ 
          uid: result.user.uid,
          name, 
          position 
        });
      } catch (error) {
        console.error("Anonymous login failed:", error);
        // If anonymous auth is disabled, fallback to mock but warn
        onLogin({ 
          uid: 'mock-' + name.toLowerCase().replace(/\s/g, '-'),
          name, 
          position 
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card-bg border border-border-subtle rounded-xl p-8"
      >
        <div className="mb-8 text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-accent" />
          <h1 className="text-3xl font-black tracking-tighter uppercase flex items-center justify-center">
            <span className="text-accent">BIZ</span>
            <span className="text-text-secondary">CON</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary mt-1">PT. BIZCON INDONESIA</p>
          <p className="text-[9px] uppercase tracking-widest text-text-secondary opacity-40 mt-2">Operations Control Dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-secondary mb-2 font-bold">Identitas (Nama)</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-app-bg border border-border-subtle rounded-lg text-text-primary outline-none focus:border-accent transition-colors"
              placeholder="Nama Lengkap"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-secondary mb-2 font-bold">Jabatan</label>
            <input 
              type="text" 
              required
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full p-3 bg-app-bg border border-border-subtle rounded-lg text-text-primary outline-none focus:border-accent transition-colors"
              placeholder="e.g. Supervisor"
            />
          </div>
          <button 
            type="submit"
            className="w-full p-4 bg-card-bg border border-border-subtle text-text-primary font-bold uppercase tracking-widest rounded-lg hover:bg-white/5 transition-all active:scale-[0.98] mb-4"
          >
            Akses Panel Sistem (Preview)
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-subtle"></div></div>
            <div className="relative flex justify-center text-[8px] uppercase tracking-widest bg-card-bg px-2 text-text-secondary">Atau</div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full p-4 bg-accent text-white font-bold uppercase tracking-widest rounded-lg hover:brightness-110 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <TrendingUp className="w-4 h-4" />
            )}
            Login dengan Google
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const StatCard = ({ title, value, subValue, icon: Icon, color = "bg-card-bg" }: any) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className={cn("p-6 border border-border-subtle rounded-xl shadow-sm", color)}
  >
    <div className="flex justify-between items-start mb-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">{title}</p>
      <Icon className="w-5 h-5 text-accent opacity-60" />
    </div>
    <div className="flex flex-col">
      <h3 className="text-3xl font-bold tracking-tight text-text-primary">{value}</h3>
      {subValue && <span className="text-[10px] uppercase font-bold mt-1 text-text-secondary opacity-60">{subValue}</span>}
    </div>
  </motion.div>
);

const ChartContainer = ({ title, children, className }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className={cn("bg-card-bg border border-border-subtle p-6 rounded-xl shadow-sm mb-6", className)}
  >
    <div className="flex justify-between items-center mb-6 pb-2 border-b border-border-subtle">
      <h3 className="text-xs font-bold tracking-widest uppercase text-text-secondary flex items-center gap-2">
        <Activity className="w-3 h-3 text-accent" /> {title}
      </h3>
    </div>
    <div className="h-[300px] w-full">
      {children}
    </div>
  </motion.div>
);

const PAChart = ({ data }: { data: DailyRecord[] }) => {
  const sums = data.reduce((acc, curr) => ({
    loader: acc.loader + (curr.pa?.loader || 0),
    loaderCount: acc.loaderCount + ((curr.pa?.loader || 0) > 0 ? 1 : 0),
    hauler: acc.hauler + (curr.pa?.hauler || 0),
    haulerCount: acc.haulerCount + ((curr.pa?.hauler || 0) > 0 ? 1 : 0),
    cg: acc.cg + (curr.pa?.cg || 0),
    cgCount: acc.cgCount + ((curr.pa?.cg || 0) > 0 ? 1 : 0),
    grader: acc.grader + (curr.pa?.grader || 0),
    graderCount: acc.graderCount + ((curr.pa?.grader || 0) > 0 ? 1 : 0),
    bulldozer: acc.bulldozer + (curr.pa?.bulldozer || 0),
    bulldozerCount: acc.bulldozerCount + ((curr.pa?.bulldozer || 0) > 0 ? 1 : 0),
    support: acc.support + (curr.pa?.support || 0),
    supportCount: acc.supportCount + ((curr.pa?.support || 0) > 0 ? 1 : 0),
  }), { 
    loader: 0, loaderCount: 0, 
    hauler: 0, haulerCount: 0, 
    cg: 0, cgCount: 0, 
    grader: 0, graderCount: 0, 
    bulldozer: 0, bulldozerCount: 0, 
    support: 0, supportCount: 0 
  });

  const averages = {
    loader: Math.round(sums.loader / (sums.loaderCount || 1)),
    hauler: Math.round(sums.hauler / (sums.haulerCount || 1)),
    cg: Math.round(sums.cg / (sums.cgCount || 1)),
    grader: Math.round(sums.grader / (sums.graderCount || 1)),
    bulldozer: Math.round(sums.bulldozer / (sums.bulldozerCount || 1)),
    support: Math.round(sums.support / (sums.supportCount || 1)),
  };

  const categories = [
    { name: 'Loader', actual: averages.loader, plan: 96 },
    { name: 'Hauler', actual: averages.hauler, plan: 96 },
    { name: 'CG', actual: averages.cg, plan: 96 },
    { name: 'Grader', actual: averages.grader, plan: 96 },
    { name: 'Bulldozer', actual: averages.bulldozer, plan: 96 },
    { name: 'Support', actual: averages.support, plan: 96 },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 h-full">
      {categories.map((cat) => (
        <div key={cat.name} className="flex flex-col items-center justify-center p-2 bg-app-bg/20 rounded-lg border border-border-subtle/50">
          <div className="h-24 w-24 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Actual', value: cat.actual },
                    { name: 'Remaining', value: Math.max(0, 100 - cat.actual) }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={40}
                  startAngle={90}
                  endAngle={450}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill={cat.actual >= cat.plan ? "#2ECC71" : "#E74C3C"} />
                  <Cell fill="#2D3748" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-black text-text-primary leading-none">{cat.actual}%</span>
              <span className="text-[7px] uppercase font-bold text-text-secondary opacity-50">Avg %</span>
            </div>
          </div>
          <div className="text-center mt-2">
            <p className="text-[10px] font-black uppercase text-accent leading-tight">{cat.name}</p>
            <p className="text-[8px] font-bold text-text-secondary uppercase opacity-60">Plan: {cat.plan}%</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const DashboardTable = ({ data }: { data: DailyRecord[] }) => (
  <div className="bg-card-bg border border-border-subtle rounded-xl overflow-hidden mt-8">
    <div className="p-4 border-b border-border-subtle bg-white/5 flex justify-between items-center">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-2">
        <Database className="w-3 h-3 text-accent" /> Data Record Detail
      </h3>
      <span className="text-[10px] text-text-secondary opacity-60 uppercase font-bold">{data.length} Records found</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[10px]">
        <thead>
          <tr className="bg-app-bg text-text-secondary uppercase tracking-wider font-black border-b border-border-subtle">
            <th className="p-3">Date</th>
            <th className="p-3">OB Plan</th>
            <th className="p-3">OB Actual</th>
            <th className="p-3">CG Actual</th>
            <th className="p-3">Rainfall</th>
            <th className="p-3">PA Avg</th>
            <th className="p-3">Fuel (Total)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle/30">
          {data.map((row, i) => {
            const paAvg = row.pa ? (row.pa.loader + row.pa.hauler + row.pa.cg + row.pa.grader + row.pa.bulldozer + row.pa.support) / 6 : 0;
            return (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                <td className="p-3 font-bold text-text-primary whitespace-nowrap">{row.date}</td>
                <td className="p-3 text-text-secondary">{(row.ob?.plan || 0).toLocaleString()}</td>
                <td className="p-3 text-accent font-bold">{(row.ob?.actual || 0).toLocaleString()}</td>
                <td className="p-3 text-text-primary">{(row.cg?.actual || 0).toLocaleString()}</td>
                <td className="p-3 text-info">{(row.weather?.rainfall || 0).toFixed(1)}mm</td>
                <td className={cn("p-3 font-bold", paAvg >= 90 ? "text-success" : "text-error")}>
                  {paAvg.toFixed(1)}%
                </td>
                <td className="p-3 text-text-secondary">{( (row.ob?.fuel || 0) + (row.cg?.fuel || 0) ).toLocaleString()} L</td>
              </tr>
            );
          })}
          {data.length === 0 && (
            <tr>
              <td colSpan={7} className="p-8 text-center text-text-secondary opacity-40 uppercase font-black italic">
                No data available for this selection
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const Dashboard = ({ data }: { data: DailyRecord[] }) => {
  const totals = data.reduce((acc, curr) => ({
    obPlan: acc.obPlan + (curr.ob?.plan || 0),
    obActual: acc.obActual + (curr.ob?.actual || 0),
    obFuel: acc.obFuel + (curr.ob?.fuel || 0),
    cgPlan: acc.cgPlan + (curr.cg?.plan || 0),
    cgActual: acc.cgActual + (curr.cg?.actual || 0),
    cgFuel: acc.cgFuel + (curr.cg?.fuel || 0),
    rainfall: acc.rainfall + (curr.weather?.rainfall || 0),
    rainActual: acc.rainActual + (curr.weather?.rainActual || 0),
    slipperyActual: acc.slipperyActual + (curr.weather?.slipperyActual || 0),
    pdty100: acc.pdty100 + (curr.productivity?.t100 || 0),
    pdty100Count: acc.pdty100Count + ((curr.productivity?.t100 || 0) > 0 ? 1 : 0),
    pdty50: acc.pdty50 + (curr.productivity?.t50 || 0),
    pdty50Count: acc.pdty50Count + ((curr.productivity?.t50 || 0) > 0 ? 1 : 0),
    pdty30: acc.pdty30 + (curr.productivity?.t30 || 0),
    pdty30Count: acc.pdty30Count + ((curr.productivity?.t30 || 0) > 0 ? 1 : 0),
    count: acc.count + 1
  }), { 
    obPlan: 0, obActual: 0, obFuel: 0, cgPlan: 0, cgActual: 0, cgFuel: 0, 
    rainfall: 0, rainActual: 0, slipperyActual: 0, 
    pdty100: 0, pdty100Count: 0, 
    pdty50: 0, pdty50Count: 0, 
    pdty30: 0, pdty30Count: 0, 
    count: 0 
  });

  const pdtyData = [
    { name: '100T Units', value: totals.pdty100 / (totals.pdty100Count || 1), color: '#F37021' },
    { name: '50T Units', value: totals.pdty50 / (totals.pdty50Count || 1), color: '#808285' },
    { name: '30T Units', value: totals.pdty30 / (totals.pdty30Count || 1), color: '#4A5568' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Production OB" 
          value={`${(totals.obActual / 1000).toFixed(1)}K`} 
          subValue={`Target Bcm: ${(totals.obPlan / 1000).toFixed(1)}K`}
          icon={TrendingUp}
        />
        <StatCard 
          title="Total Production CG" 
          value={`${(totals.cgActual / 1000).toFixed(1)}K`} 
          subValue={`Target MT: ${(totals.cgPlan / 1000).toFixed(1)}K`}
          icon={Activity}
        />
        <StatCard 
          title="Weather History" 
          value={`${totals.rainActual.toFixed(1)}h Rain`} 
          subValue={`Slippery: ${totals.slipperyActual.toFixed(1)}h | Rainfall: ${totals.rainfall.toFixed(1)}mm`}
          icon={CloudRain}
        />
        <StatCard 
          title="Fuel Usage Sum" 
          value={`${((totals.obFuel + totals.cgFuel) / 1000).toFixed(1)}K`} 
          subValue="Total Liters"
          icon={Fuel}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="PA % Unit Availability" className="min-h-[450px]">
          <PAChart data={data} />
        </ChartContainer>
        <div className="space-y-6">
          <ChartContainer title="Production Trend (OB vs CG)">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2D3748" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} />
                <YAxis stroke="#94A3B8" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1E26', borderColor: '#2D3748', borderRadius: '8px' }}
                  itemStyle={{ color: '#E0E6ED' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px' }}/>
                <Bar dataKey="cg.actual" fill="#808285" fillOpacity={0.6} name="CG Actual (MT)" radius={[2, 2, 0, 0]} />
                <Line type="monotone" dataKey="ob.actual" stroke="#F37021" strokeWidth={3} name="OB Actual (Bcm)" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartContainer title="Fuel Ratio Trend (Ltr/Bcm)">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.map(d => ({ ...d, ratio: (d.ob.fuel + d.cg.fuel) / (d.ob.actual || 1) }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2D3748" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} />
                <YAxis domain={['auto', 'auto']} stroke="#94A3B8" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1E26', borderColor: '#2D3748', borderRadius: '8px' }}
                  itemStyle={{ color: '#E0E6ED' }}
                  formatter={(value: number) => [`${value.toFixed(2)}`, 'Ratio']}
                />
                <Line type="stepAfter" dataKey="ratio" stroke="#F37021" strokeWidth={2} dot={{ fill: '#F37021', r: 4 }} name="Fuel Ratio" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      <ChartContainer title="Average Fleet Productivity (Bcm/Jam)" className="min-h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip 
              contentStyle={{ backgroundColor: '#1A1E26', borderColor: '#2D3748', borderRadius: '8px' }}
              itemStyle={{ color: '#E0E6ED' }}
              formatter={(value: number) => [`${value.toFixed(1)} Bcm/Jam`, 'Avg Productivity']}
            />
            <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ paddingLeft: '40px' }} />
            <Pie
              data={pdtyData}
              cx="40%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              label={({ name, value }) => `${name}: ${value.toFixed(1)}`}
            >
              {pdtyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            {/* Pseudo-3D Inner Ring */}
            <Pie
              data={pdtyData}
              cx="40%"
              cy="50%"
              innerRadius={75}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              opacity={0.3}
              legendType="none"
            >
              {pdtyData.map((entry, index) => (
                <Cell key={`inner-cell-${index}`} fill="#000" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>

      <DashboardTable data={data} />
    </div>
  );
};

const FuelLog = ({ data }: { data: DailyRecord[] }) => {
  const fuelData = data.map(d => ({
    date: d.date,
    total: d.ob.fuel + d.cg.fuel,
    ob: d.ob.fuel,
    cg: d.cg.fuel
  }));

  const totalFuel = fuelData.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="space-y-6">
      <StatCard 
        title="Consolidated Monthly Fuel" 
        value={`${(totalFuel/1000).toFixed(1)}K Liters`} 
        subValue="Overburden + Coal Getting"
        icon={Fuel}
        color="bg-card-bg"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Daily OB Fuel Consumption (L)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fuelData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2D3748" />
              <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} />
              <YAxis stroke="#94A3B8" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1A1E26', borderColor: '#2D3748' }} />
              <Bar dataKey="ob" name="OB Fuel (L)" fill="#F37021" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Daily CG Fuel Consumption (L)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fuelData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2D3748" />
              <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} />
              <YAxis stroke="#94A3B8" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1A1E26', borderColor: '#2D3748' }} />
              <Bar dataKey="cg" name="CG Fuel (L)" fill="#808285" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="bg-card-bg border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#11141B] text-text-secondary font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4 border-r border-border-subtle">Date</th>
              <th className="p-4 border-r border-border-subtle">OB Fuel (L)</th>
              <th className="p-4 border-r border-border-subtle">CG Fuel (L)</th>
              <th className="p-4">Daily Total</th>
            </tr>
          </thead>
          <tbody className="text-text-primary">
            {fuelData.map((d, i) => (
              <tr key={i} className="border-b border-border-subtle hover:bg-white/5 transition-colors">
                <td className="p-4 border-r border-border-subtle">{d.date}</td>
                <td className="p-4 border-r border-border-subtle font-mono">{d.ob.toLocaleString()}</td>
                <td className="p-4 border-r border-border-subtle font-mono">{d.cg.toLocaleString()}</td>
                <td className="p-4 font-bold font-mono text-accent">{d.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Chat = ({ user }: { user: User }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<{type: 'image' | 'video' | 'document', file: File}[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          user: {
            uid: data.userId,
            name: data.userName,
            position: data.userPosition,
          },
          text: data.text,
          timestamp: data.timestamp,
          attachments: data.attachments || []
        };
      });
      setMessages(msgs as any[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'messages');
    });

    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileClick = (type: 'image' | 'video' | 'document') => {
    setShowMenu(false);
    if (fileInputRef.current) {
      const accept = type === 'image' ? 'image/*' : type === 'video' ? 'video/*' : '*/*';
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      let type: 'image' | 'video' | 'document' = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      
      setAttachments([...attachments, { type, file }]);
    }
    if (e.target) e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;
    
    // In a real app, we would upload files to Storage first
    const messageAttachments = attachments.map(a => ({
      type: a.type,
      name: a.file.name,
      url: URL.createObjectURL(a.file) // Mock URL for demo
    }));

    const messageData = {
      userId: user.uid,
      userName: user.name,
      userPosition: user.position,
      text: input,
      timestamp: serverTimestamp(),
      attachments: messageAttachments
    };

    try {
      await addDoc(collection(db, 'messages'), messageData);
      setInput('');
      setAttachments([]);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    }
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return 'Sending...';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'video': return <VideoIcon className="w-4 h-4" />;
      default: return <FileIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col h-[700px] bg-card-bg border border-border-subtle rounded-xl shadow-sm overflow-hidden">
       <div className="p-4 bg-[#11141B] border-b border-border-subtle flex justify-between items-center">
        <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-accent" /> Site Discussion
        </h3>
        <p className="text-[10px] uppercase tracking-widest text-text-secondary opacity-40">Operations Channel</p>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-app-bg/30">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-20">
            <MessageSquare className="w-12 h-12 mb-2" />
            <p className="text-sm font-bold uppercase tracking-tighter">No active discussion</p>
          </div>
        )}
        {messages.map((m) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={m.id} 
            className="p-4 bg-card-bg border border-border-subtle rounded-lg shadow-sm max-w-[85%] mb-2"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-xs uppercase text-accent">{m.user.name}</span>
              <span className="text-[10px] uppercase font-bold text-text-secondary opacity-60 px-2 py-0.5 bg-app-bg rounded">{m.user.position}</span>
              <span className="text-[10px] text-text-secondary opacity-30 ml-auto">{formatTimestamp(m.timestamp)}</span>
            </div>
            {m.text && <p className="text-sm text-text-primary leading-relaxed mb-3">{m.text}</p>}
            
            {m.attachments && m.attachments.length > 0 && (
              <div className="space-y-2">
                {m.attachments.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-app-bg/50 border border-border-subtle rounded-lg group hover:border-accent/40 transition-colors">
                    <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center text-accent">
                      {getFileIcon(a.type)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[10px] font-bold text-text-primary truncate">{a.name}</p>
                      <p className="text-[8px] uppercase tracking-widest text-text-secondary opacity-60">{a.type}</p>
                    </div>
                    <button 
                      onClick={() => window.open(a.url)}
                      className="text-[9px] uppercase font-black text-accent px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {attachments.length > 0 && (
        <div className="p-3 bg-app-bg/80 border-t border-border-subtle flex gap-2 overflow-x-auto">
          {attachments.map((a, i) => (
            <div key={i} className="relative flex-none w-24 p-2 bg-card-bg border border-border-subtle rounded items-center justify-center text-center">
              <div className="w-8 h-8 mx-auto mb-1 rounded bg-accent/10 flex items-center justify-center text-accent">
                {getFileIcon(a.type)}
              </div>
              <p className="text-[8px] font-bold text-text-primary truncate">{a.file.name}</p>
              <button 
                onClick={() => removeAttachment(i)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 bg-card-bg border-t border-border-subtle relative">
        <form onSubmit={handleSend} className="flex gap-2">
          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className={cn(
                "p-3 rounded-lg border border-border-subtle transition-all",
                showMenu ? "bg-accent text-white" : "bg-app-bg text-text-secondary hover:text-text-primary"
              )}
            >
              <Paperclip size={18} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute bottom-full left-0 mb-2 w-48 bg-sidebar-bg border border-border-subtle rounded-xl shadow-2xl p-2 z-30"
                >
                  <p className="text-[8px] font-black uppercase tracking-widest text-text-secondary px-3 py-2 opacity-40">Lampirkan File</p>
                  <button 
                    type="button" 
                    onClick={() => handleFileClick('image')}
                    className="w-full flex items-center gap-3 p-3 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-all"
                  >
                    <ImageIcon size={14} className="text-accent" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Gambar</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleFileClick('video')}
                    className="w-full flex items-center gap-3 p-3 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-all"
                  >
                    <VideoIcon size={14} className="text-accent" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Video</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleFileClick('document')}
                    className="w-full flex items-center gap-3 p-3 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-all"
                  >
                    <FileIcon size={14} className="text-accent" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Dokumen</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tulis pesan..."
            className="flex-1 p-3 bg-app-bg border border-border-subtle rounded-lg text-sm text-text-primary outline-none focus:border-accent transition-colors"
          />
          <button className="bg-accent text-white px-6 py-2 rounded-lg font-bold uppercase text-[10px] tracking-widest hover:brightness-110 active:scale-95 transition-all">
            Send
          </button>
        </form>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
        />
      </div>
    </div>
  );
};

const UserList = () => {
  const users = [
    { name: "Jefri", position: "Project Manager", status: "Online", lastActive: "Just now", dept: "Operations" },
    { name: "Andi Saputra", position: "Site Supervisor", status: "Online", lastActive: "2m ago", dept: "Operations" },
    { name: "Siti Aminah", position: "Data Analyst", status: "Offline", lastActive: "1h ago", dept: "Technical" },
    { name: "Budi Santoso", position: "Logistic Lead", status: "Online", lastActive: "10m ago", dept: "Supply Chain" },
    { name: "Diana Putri", position: "Safety Officer", status: "Offline", lastActive: "5h ago", dept: "HSE" },
  ];

  return (
    <div className="bg-card-bg border border-border-subtle rounded-xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-border-subtle bg-[#11141B]">
        <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
          <Users className="w-4 h-4 text-accent" /> Dashboard Users
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-app-bg text-text-secondary uppercase tracking-widest border-b border-border-subtle">
              <th className="p-4 font-black">User</th>
              <th className="p-4 font-black">Department</th>
              <th className="p-4 font-black">Position</th>
              <th className="p-4 font-black">Last Active</th>
              <th className="p-4 font-black">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/30">
            {users.map((u, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors group">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent group-hover:scale-110 transition-transform">
                    {u.name[0]}
                  </div>
                  <span className="font-bold text-text-primary">{u.name}</span>
                </td>
                <td className="p-4 text-text-secondary">{u.dept}</td>
                <td className="p-4 text-text-secondary font-medium">{u.position}</td>
                <td className="p-4 text-text-secondary opacity-60 italic">{u.lastActive}</td>
                <td className="p-4">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                    u.status === 'Online' ? "bg-success/10 text-success border border-success/20" : "bg-text-secondary/10 text-text-secondary border border-border-subtle"
                  )}>
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const WeatherView = () => {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Coords for Lemo 1 (-0.9634, 114.8105)
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-0.9634&longitude=114.8105&current=temperature_2m,relative_humidity_2m,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability&timezone=Asia%2FJakarta');
        const data = await response.json();
        setWeather(data);
      } catch (error) {
        console.error("Weather Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 300000); // 5 mins
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
    </div>
  );

  const getWeatherDesc = (code: number) => {
    const codes: any = {
      0: 'Clear Sky',
      1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Depositing Rime Fog',
      51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
      61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
      71: 'Slight Snow', 73: 'Moderate Snow', 75: 'Heavy Snow',
      95: 'Thunderstorm', 96: 'Storm with Hail', 99: 'Severe Storm'
    };
    return codes[code] || 'Unsettled';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card-bg border border-border-subtle rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <CloudRain size={120} />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <CloudRain size={20} className="text-accent" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary">Current Condition</h3>
                <p className="text-xl font-black text-text-primary">Lemo 1, Muara Teweh</p>
              </div>
            </div>
            
            <div className="flex items-end gap-6 py-4">
              <span className="text-8xl font-black tracking-tighter text-text-primary">
                {Math.round(weather?.current?.temperature_2m)}°
              </span>
              <div className="pb-4 space-y-1">
                <p className="text-2xl font-bold text-accent italic uppercase">{getWeatherDesc(weather?.current?.weather_code)}</p>
                <div className="flex items-center gap-4 text-text-secondary text-xs uppercase font-bold tracking-widest opacity-60">
                  <span className="flex items-center gap-1"><Droplets size={12} /> Humidity: {weather?.current?.relative_humidity_2m}%</span>
                  <span className="flex items-center gap-1"><Activity size={12} /> Wind: {weather?.current?.wind_speed_10m} km/h</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border-subtle grid grid-cols-4 gap-4">
              {weather?.hourly?.time.slice(0, 4).map((time: string, i: number) => (
                <div key={i} className="text-center p-4 bg-app-bg/40 rounded-2xl border border-border-subtle/50">
                  <p className="text-[10px] font-black uppercase text-text-secondary mb-2">
                    {new Date(time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}
                  </p>
                  <p className="text-lg font-black text-text-primary">{Math.round(weather.hourly.temperature_2m[i])}°</p>
                  <p className="text-[9px] font-bold text-accent uppercase opacity-60">{weather.hourly.precipitation_probability[i]}% Rain</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card-bg border border-border-subtle rounded-3xl p-6 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-6">Operations Alert</h3>
              <div className="space-y-4">
                {(weather?.current?.precipitation || 0) > 0 ? (
                  <div className="p-4 bg-danger/10 border border-danger/20 rounded-2xl">
                    <p className="text-xs font-black text-danger uppercase mb-1 flex items-center gap-2">
                      <CloudRain size={14} /> Active Rainfall
                    </p>
                    <p className="text-[10px] font-bold text-danger/80 leading-relaxed uppercase opacity-80 italic">
                      Caution: Rainfall detected ({weather.current.precipitation}mm). Monitor road condition for slippery.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-success/10 border border-success/20 rounded-2xl">
                    <p className="text-xs font-black text-success uppercase mb-1 flex items-center gap-2">
                      <CloudRain size={14} /> Clear Conditions
                    </p>
                    <p className="text-[10px] font-bold text-success/80 leading-relaxed uppercase opacity-80 italic">
                      Optimal for site operations. No rainfall currently detected in Lemo 1 area.
                    </p>
                  </div>
                )}
                <div className="p-4 bg-accent/10 border border-accent/20 rounded-2xl">
                  <p className="text-xs font-black text-accent uppercase mb-1 flex items-center gap-2">
                    <Activity size={14} /> Site Prep
                  </p>
                  <p className="text-[10px] font-bold text-accent/80 leading-relaxed uppercase opacity-80 italic">
                    Forecast indicates {Math.max(...weather.hourly.precipitation_probability.slice(0, 12))}% chance of rain in coming 12h.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-border-subtle">
              <p className="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-40">Data updated every 5 mins</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const UploadData = ({ onUploadComplete }: { onUploadComplete?: () => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIsDone(false);
      setProgress(0);
    }
  };

  const saveRecordToFirestore = async (record: DailyRecord) => {
    try {
      // Use date as ID to avoid duplicates (e.g. "26 Mar" -> doc id)
      const docId = record.date.replace(/\s+/g, '-').toLowerCase();
      await setDoc(doc(db, 'dailyRecords', docId), record);
    } catch (error) {
      // Don't rethrow, just log and keep processing if possible
      console.error("Error saving record:", error);
    }
  };

  const processDataRows = async (data: any[]) => {
    const totalRows = data.length;
    if (totalRows === 0) {
      setIsProcessing(false);
      alert("File kosong atau tidak terbaca.");
      return;
    }

    try {
      for (let i = 0; i < totalRows; i++) {
        const row: any = data[i];
        
        // Normalize numeric values
        const num = (v: any) => {
          if (v === null || v === undefined || v === '') return 0;
          if (typeof v === 'number') return v;
          let s = String(v).trim();
          // Handle Indonesian/European style: 1.234,56 -> 1234.56
          if (s.includes(',') && !s.includes('.')) {
            s = s.replace(',', '.');
          } else if (s.includes(',') && s.includes('.')) {
            if (s.lastIndexOf('.') > s.lastIndexOf(',')) {
              s = s.replace(/,/g, '');
            } else {
              s = s.replace(/\./g, '').replace(',', '.');
            }
          }
          const clean = s.replace(/[^-0-9.]/g, ''); 
          return parseFloat(clean) || 0;
        };

        // Find key case-insensitively
        const findVal = (keys: string[]) => {
          const rowKeys = Object.keys(row);
          for (const searchKey of keys) {
            const found = rowKeys.find(rk => rk.toLowerCase() === searchKey.toLowerCase());
            if (found) return row[found];
          }
          return null;
        };

        // Map row to DailyRecord structure
        let rawDate = findVal(['Date', 'tanggal']);
        let formattedDate = '';
        let timestamp = Date.now();

        if (!rawDate) {
          const now = new Date();
          formattedDate = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          timestamp = now.getTime();
        } else {
          // Function to handle Excel serial dates or normal strings
          const parseDate = (val: any) => {
            if (typeof val === 'number') {
              // Heuristic: Excel dates are typically > 40000 (roughly years 2010+)
              if (val > 30000 && val < 60000) {
                return new Date((val - 25569) * 86400 * 1000);
              }
              return new Date(val); // Assume unix ms
            }
            const d = new Date(String(val));
            return isNaN(d.getTime()) ? new Date(val) : d;
          };

          const dateObj = parseDate(rawDate);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            timestamp = dateObj.getTime();
          } else {
            formattedDate = String(rawDate);
            timestamp = Date.now();
          }
        }

        const record: DailyRecord = {
          date: formattedDate,
          timestamp,
          ob: {
            plan: num(findVal(['OB_Plan', 'obPlan', 'ob_p', 'rencana_ob'])),
            actual: num(findVal(['OB_Actual', 'obActual', 'ob_a', 'aktual_ob'])),
            fuel: num(findVal(['OB_Fuel', 'obFuel', 'ob_f', 'solar_ob', 'fuel_ob']))
          },
          cg: {
            plan: num(findVal(['CG_Plan', 'cgPlan', 'cg_p', 'rencana_cg'])),
            actual: num(findVal(['CG_Actual', 'cgActual', 'cg_a', 'aktual_cg'])),
            fuel: num(findVal(['CG_Fuel', 'cgFuel', 'cg_f', 'solar_cg', 'fuel_cg']))
          },
          weather: {
            rainPlan: num(findVal(['Rain_Plan', 'rainPlan', 'rencana_hujan'])),
            rainActual: num(findVal(['Rain_Actual', 'rainActual', 'aktual_hujan'])),
            slipperyPlan: num(findVal(['Slippery_Plan', 'slipperyPlan', 'rencana_licin'])),
            slipperyActual: num(findVal(['Slippery_Actual', 'slipperyActual', 'aktual_licin'])),
            rainfall: num(findVal(['Rainfall', 'curah_hujan']))
          },
          productivity: {
            t100: num(findVal(['Prod_T100', 't100'])),
            t50: num(findVal(['Prod_T50', 't50'])),
            t30: num(findVal(['Prod_T30', 't30']))
          },
          pa: {
            loader: num(findVal(['PA_Loader', 'pa_loader', 'ketersediaan_loader'])),
            hauler: num(findVal(['PA_Hauler', 'pa_hauler', 'ketersediaan_hauler'])),
            cg: num(findVal(['PA_CG', 'pa_cg', 'ketersediaan_cg'])),
            grader: num(findVal(['PA_Grader', 'pa_grader', 'ketersediaan_grader'])),
            bulldozer: num(findVal(['PA_Bulldozer', 'pa_bulldozer', 'ketersediaan_dozer'])),
            support: num(findVal(['PA_Support', 'pa_support', 'ketersediaan_support']))
          }
        };

        await saveRecordToFirestore(record);
        setProgress(Math.round(((i + 1) / totalRows) * 100));
        
        // Minor delay to keep UI responsive and allow progress to update
        if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
      }
      setIsDone(true);
      if (onUploadComplete) onUploadComplete();
    } catch (err) {
      console.error("Error during row processing:", err);
      alert("Error memproses data. Silakan periksa format file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcess = () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          await processDataRows(jsonData);
        } catch (err) {
          console.error("Excel Read Error:", err);
          setIsProcessing(false);
          alert("Gagal membaca file Excel.");
        }
      };
      reader.onerror = () => {
        setIsProcessing(false);
        alert("Gagal membaca file.");
      };
      reader.readAsArrayBuffer(file);
    } else {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: async (results) => {
          await processDataRows(results.data);
        },
        error: (error) => {
          console.error("CSV Parsing Error:", error);
          setIsProcessing(false);
          alert("Error parsing CSV: " + error.message);
        }
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-card-bg border border-border-subtle rounded-xl p-10 text-center space-y-6 relative overflow-hidden">
        {/* Success Overlay Glow */}
        {isDone && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-success/5 pointer-events-none"
          />
        )}

        <div className={cn(
          "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto transition-all duration-500",
          isDone ? "bg-success text-white scale-110" : "bg-accent/10 text-accent"
        )}>
          {isDone ? <CheckCircle size={40} /> : <Upload size={40} strokeWidth={1.5} />}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight uppercase">
            {isDone ? 'Upload Selesai' : 'Upload Operational Data'}
          </h2>
          <p className="text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
            {isDone 
              ? 'Data Anda telah berhasil diproses dan diintegrasikan ke dalam sistem dashboard.'
              : 'Unggah file laporan harian (CSV, XLSX) untuk memperbarui statistik produksi, pengunaan bahan bakar, dan metrics PA unit.'}
          </p>
        </div>

        {!isProcessing && !isDone && (
          <div className="flex flex-col items-center gap-4">
            <label className="cursor-pointer bg-accent text-white px-10 py-4 rounded-xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-accent/20 hover:brightness-110 active:scale-95 transition-all inline-block">
              {file ? 'Ganti File Laporan' : 'Pilih File Laporan'}
              <input type="file" onChange={handleFileChange} className="hidden" accept=".csv, .xlsx, .xls" />
            </label>
            {file && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-border-subtle">
                <FileText size={14} className="text-accent" />
                <span className="text-[10px] font-bold text-text-primary tracking-wider">{file.name}</span>
              </div>
            )}
            <p className="text-[10px] uppercase tracking-widest text-text-secondary opacity-40 italic">Maksimal ukuran file: 25MB</p>
            
            <button 
              onClick={downloadTemplate}
              className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-accent/60 hover:text-accent transition-colors"
            >
              <Download size={14} /> Download Template CSV
            </button>
            
            {file && (
              <motion.button 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleProcess}
                className="mt-4 bg-white text-app-bg px-10 py-4 rounded-xl font-black uppercase text-xs tracking-[0.2em] hover:bg-white/90 active:scale-95 transition-all"
              >
                Proses Data Sekarang
              </motion.button>
            )}
          </div>
        )}

        {(isProcessing || isDone) && (
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-full h-3 bg-app-bg rounded-full overflow-hidden border border-border-subtle p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className={cn(
                  "h-full rounded-full",
                  isDone ? "bg-success shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-accent"
                )}
              />
            </div>
            <div className="flex justify-between items-center px-1">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-colors",
                isDone ? "text-success" : "text-accent"
              )}>
                {isProcessing ? 'Memproses Data...' : 'Berhasil'}
              </span>
              <span className={cn(
                "text-[10px] font-black font-mono",
                isDone ? "text-success" : "text-text-primary text-xl"
              )}>
                {progress}% {isDone && 'Data berhasil di upload'}
              </span>
            </div>
            {isDone && (
              <button 
                onClick={() => { setFile(null); setIsDone(false); setProgress(0); }}
                className="mt-6 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-accent transition-colors"
              >
                Unggah File Baru
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-card-bg border border-border-subtle rounded-xl space-y-4">
          <div className="flex items-center gap-3 text-accent mb-2">
            <Info size={16} />
            <h4 className="text-[10px] font-black uppercase tracking-widest">Petunjuk Format</h4>
          </div>
          <ul className="space-y-3">
            {['Gunakan template Excel standar BIZCON', 'Pastikan format tanggal DD/MM/YYYY', 'Input angka tanpa pemisah ribuan'].map((txt, i) => (
              <li key={i} className="flex gap-3 text-xs text-text-secondary items-start leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" /> {txt}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-6 bg-card-bg border border-border-subtle rounded-xl space-y-4">
          <div className="flex items-center gap-3 text-success mb-2">
            <CheckCircle size={16} />
            <h4 className="text-[10px] font-black uppercase tracking-widest">Sistem Validasi</h4>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Sistem kami secara otomatis melakukan pembersihan data (data cleaning) dan 
            anomali detection sebelum diaplikasikan ke dashboard utama.
          </p>
        </div>
      </div>
    </div>
  );
};

const NotificationPanel = () => {
  const alerts = [
    { type: 'update', title: 'Data Produksi Diperbarui', desc: 'Laporan harian untuk 16 April 2026 telah diverifikasi.', time: '10m ago', icon: CheckCircle, color: 'text-success' },
    { type: 'market', title: 'Update Market Price', desc: 'Kurs Dollar BI Rate naik menjadi Rp 17.245.', time: '1h ago', icon: TrendingUp, color: 'text-accent' },
    { type: 'alert', title: 'Peringatan Cuaca', desc: 'Rata-rata rainfall meningkat di Site LHL, waspada area slippery.', time: '3h ago', icon: AlertTriangle, color: 'text-danger' },
    { type: 'info', title: 'Informasi Sistem', desc: 'Menu Market Watch sekarang tersedia untuk semua supervisor.', time: '5h ago', icon: Info, color: 'text-info' },
  ];

  return (
    <div className="max-w-2xl mx-auto bg-card-bg border border-border-subtle rounded-xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-border-subtle bg-[#11141B] flex justify-between items-center">
        <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
          <Bell className="w-4 h-4 text-accent" /> Pusat Notifikasi
        </h3>
        <button className="text-[9px] font-black uppercase tracking-widest text-accent hover:underline">Mark all as read</button>
      </div>
      <div className="divide-y divide-border-subtle/30">
        {alerts.map((a, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-5 flex gap-5 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className={cn("w-10 h-10 rounded-xl bg-app-bg border border-border-subtle flex items-center justify-center shrink-0", a.color)}>
              <a.icon size={18} />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex justify-between items-start">
                <h4 className="text-xs font-bold text-text-primary">{a.title}</h4>
                <span className="text-[9px] uppercase tracking-widest text-text-secondary opacity-40">{a.time}</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed opacity-70 italic">"{a.desc}"</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const MarketPrice = () => {
  const prices = [
    { name: 'Coal ICI 4', value: '$54.20', unit: '/ Ton', trend: '+1.2%', icon: Activity },
    { name: 'Solar B40 (Kalsel/Kaltim)', value: 'Rp 20.350', unit: '/ Liter', trend: '+2.5%', icon: Fuel },
    { name: 'USD / IDR (BI Rate)', value: 'Rp 17.245', unit: 'JISDOR Update', trend: '+4.15%', icon: TrendingUp },
  ];

  const news = [
    { title: "Kementerian ESDM Tetapkan HBA April 2026, ICI 4 Stabil di Level $54", date: "16 Apr 2026", source: "Minerba News" },
    { title: "Harga Solar Industri Kalimantan Tembus Rp 20 Ribu, Tekanan Biaya Logistik Meningkat", date: "16 Apr 2026", source: "Energi Today" },
    { title: "Rupiah Tembus 17.200 per Dollar, Bank Indonesia Intervensi Pasar Valas", date: "14 Apr 2026", source: "Bisnis News" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {prices.map((p) => (
          <StatCard 
            key={p.name}
            title={p.name}
            value={p.value}
            subValue={`${p.trend} ${p.unit}`}
            icon={p.icon}
            color={p.trend.startsWith('+') ? "bg-success/5 border-success/20" : "bg-danger/5 border-danger/20"}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <ChartContainer title="ICI 4 Coal Price Index (Forecast 2026)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[
              { month: 'Jan', price: 52 },
              { month: 'Feb', price: 53.5 },
              { month: 'Mar', price: 53 },
              { month: 'Apr', price: 54.2 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2D3748" />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} />
              <YAxis domain={[50, 60]} stroke="#94A3B8" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#1A1E26', borderColor: '#2D3748' }} />
              <Line type="monotone" dataKey="price" stroke="#F37021" strokeWidth={3} dot={{ fill: '#F37021' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="bg-card-bg border border-border-subtle rounded-xl p-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-6 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-accent" /> Economic & Market News
          </h3>
          <div className="space-y-4">
            {news.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 bg-app-bg/40 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
              >
                <p className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors leading-relaxed mb-2">
                  {item.title}
                </p>
                <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-text-secondary opacity-60">
                  <span>{item.source}</span>
                  <span>{item.date}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <GlobalErrorBoundary>
      <AppContent />
    </GlobalErrorBoundary>
  );
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'fuel' | 'chat' | 'market' | 'upload' | 'notifications' | 'users' | 'weather'>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [mounted, setMounted] = useState(false);
  const [allData, setAllData] = useState<DailyRecord[]>(RAW_DATA);

  useEffect(() => {
    setMounted(true);
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || undefined,
          position: 'Dashboard User',
          photoURL: firebaseUser.photoURL || undefined
        });
      } else {
        setUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Real-time listener for daily records
    const q = query(collection(db, 'dailyRecords'), orderBy('timestamp', 'asc'));
    const unsubscribeData = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const records = snapshot.docs.map(doc => {
          const d = doc.data();
          // Ensure nested objects exist to prevent dashboard crashes
          return {
            ...d,
            ob: d.ob || { plan: 0, actual: 0, fuel: 0 },
            cg: d.cg || { plan: 0, actual: 0, fuel: 0 },
            weather: d.weather || { rainPlan: 0, rainActual: 0, slipperyPlan: 0, slipperyActual: 0, rainfall: 0 },
            productivity: d.productivity || { t100: 0, t50: 0, t30: 0 },
            pa: d.pa || { loader: 0, hauler: 0, cg: 0, grader: 0, bulldozer: 0, support: 0 }
          } as DailyRecord;
        });
        setAllData(records);
      } else {
        console.log("Firestore collection empty, using mock data.");
        setAllData(RAW_DATA);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'dailyRecords');
    });

    return () => unsubscribeData();
  }, [user?.uid]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const seedInitialData = async () => {
    if (confirm("Ingin memuat data awal (Mock Data) ke database?")) {
      try {
        for (const record of RAW_DATA) {
          const docId = record.date.replace(/\s+/g, '-').toLowerCase();
          await setDoc(doc(db, 'dailyRecords', docId), record);
        }
        alert("Data berhasil dimuat!");
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'dailyRecords');
      }
    }
  };

  const clearDatabase = async () => {
    if (confirm("PERINGATAN: Ini akan menghapus SEMUA data operasional. Lanjutkan?")) {
      try {
        const q = query(collection(db, 'dailyRecords'));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        alert("Database dikosongkan.");
        setAllData(RAW_DATA);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'dailyRecords');
      }
    }
  };

  const monthNames = ['All', ...Array.from(new Set(allData.map(d => {
    // Extract month name from date string (supports "DD MMM", "YYYY-MM-DD", etc.)
    const parts = d.date.split(/[- /]/);
    
    // Check for string months (e.g. "Apr", "April", "Mei")
    const isLikelyMonth = (s: string) => s && /^[a-zA-Z]{3,9}$/.test(s);
    const m = parts.find(isLikelyMonth);
    if (m) return m;

    // Fallback: try to get month from a real date object
    try {
      const date = new Date(d.date);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-GB', { month: 'short' });
      }
    } catch(e) {}
    return 'Unknown';
  }))).filter((m): m is string => typeof m === 'string' && m !== 'Unknown' && m.toUpperCase() !== 'TOTAL')];

  const filteredData = selectedMonth === 'All' 
    ? allData 
    : allData.filter(d => {
        const lowerDate = d.date.toLowerCase();
        const lowerMonth = selectedMonth.toLowerCase();
        return lowerDate.includes(lowerMonth);
      });

  // Automatically select the first available month if current selection is empty and data exists
  useEffect(() => {
    if (activeTab === 'dashboard' && filteredData.length === 0 && allData.length > 0 && selectedMonth !== 'All') {
      const availableMonths = Array.from(new Set(allData.map(d => {
        try {
          return new Date(d.date).toLocaleDateString('en-GB', { month: 'short' });
        } catch(e) { return null; }
      }))).filter(Boolean) as string[];
      
      if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
        setSelectedMonth(availableMonths[0]);
      }
    }
  }, [allData, activeTab]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
          <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary animate-pulse">Inisialisasi Sistem...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-app-bg text-text-primary flex font-sans selection:bg-accent selection:text-white">
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -260 }}
        animate={{ x: 0 }}
        className="w-64 bg-sidebar-bg border-r border-border-subtle flex flex-col fixed h-full z-20"
      >
        <div className="p-8 border-b border-border-subtle">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent rounded flex items-center justify-center font-black text-white italic">B</div>
              <div>
                 <h2 className="font-black text-sm tracking-tight uppercase">
                    <span className="text-accent">BIZ</span>
                    <span className="text-text-primary">CON</span>
                 </h2>
                 <p className="text-[7px] uppercase tracking-wider text-text-secondary opacity-50">PT. BIZCON INDONESIA</p>
              </div>
           </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 mt-6">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg transition-all font-bold uppercase text-[10px] tracking-[0.15em]",
              activeTab === 'dashboard' ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
            )}
          >
            <LayoutDashboard size={14} /> Realtime Stats
          </button>
          <button 
            onClick={() => setActiveTab('fuel')}
             className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg transition-all font-bold uppercase text-[10px] tracking-[0.15em]",
              activeTab === 'fuel' ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
            )}
          >
            <Fuel size={14} /> Fuel Logistics
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
             className={cn(
               "w-full flex items-center gap-3 p-3 rounded-lg transition-all font-bold uppercase text-[10px] tracking-[0.15em]",
               activeTab === 'chat' ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
             )}
          >
            <MessageSquare size={14} /> Site Discussion
          </button>
          <button 
            onClick={() => setActiveTab('market')}
             className={cn(
               "w-full flex items-center gap-3 p-3 rounded-lg transition-all font-bold uppercase text-[10px] tracking-[0.15em]",
               activeTab === 'market' ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
             )}
          >
            <BarChart3 size={14} /> Market Price
          </button>

          <button 
            onClick={() => setActiveTab('weather')}
             className={cn(
               "w-full flex items-center gap-3 p-3 rounded-lg transition-all font-bold uppercase text-[10px] tracking-[0.15em]",
               activeTab === 'weather' ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
             )}
          >
            <CloudRain size={14} /> Weather Lemo
          </button>
          
          <div className="pt-4 pb-2">
            <p className="px-3 text-[8px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-30">Tools & Management</p>
          </div>

          <button 
            onClick={() => setActiveTab('upload')}
             className={cn(
               "w-full flex items-center gap-3 p-3 rounded-lg transition-all font-bold uppercase text-[10px] tracking-[0.15em]",
               activeTab === 'upload' ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
             )}
          >
            <Upload size={14} /> Upload Data
          </button>
          
          <button 
            onClick={() => setActiveTab('users')}
             className={cn(
               "w-full flex items-center gap-3 p-3 rounded-lg transition-all font-bold uppercase text-[10px] tracking-[0.15em]",
               activeTab === 'users' ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
             )}
          >
            <Users size={14} /> User Directory
          </button>
        </nav>

        <div className="p-4 border-t border-border-subtle">
          <div className="p-4 bg-app-bg/40 rounded-xl border border-border-subtle mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-accent/20 bg-card-bg flex items-center justify-center">
                <UserIcon size={16} className="text-accent" />
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-xs truncate text-text-primary">{user.name}</p>
                <p className="text-[9px] uppercase tracking-wider text-text-secondary opacity-60">{user.position}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3 text-[10px] font-bold uppercase tracking-widest text-danger hover:bg-danger/10 rounded-lg transition-all"
          >
            <LogOut size={12} /> Logout System
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="h-[72px] bg-card-bg border-b border-border-subtle flex items-center justify-between px-10 sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <h1 className="text-xs font-black uppercase tracking-[0.3em] text-text-primary border-r border-border-subtle pr-6">
              {(() => {
                switch(activeTab) {
                  case 'dashboard': return 'Operations';
                  case 'fuel': return 'Logistics';
                  case 'chat': return 'Communication';
                  case 'market': return 'Market Watch';
                  case 'weather': return 'Lemo Weather';
                  case 'upload': return 'Data Center';
                  case 'notifications': return 'Notifications';
                  case 'users': return 'User Management';
                  default: return 'Site Dashboard';
                }
              })()}
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-text-secondary mr-2">Timeframe:</span>
              {monthNames.map((month) => (
                <button
                  key={month}
                  onClick={() => setSelectedMonth(month)}
                  className={cn(
                    "px-3 py-1.5 rounded-md transition-all text-[10px] font-bold uppercase tracking-wider border",
                    selectedMonth === month 
                      ? "bg-accent/10 border-accent text-accent" 
                      : "bg-transparent border-border-subtle text-text-secondary hover:border-text-secondary"
                  )}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
             <button 
              onClick={() => setActiveTab('notifications')}
              className="relative p-2 hover:bg-white/5 rounded-full transition-colors group"
             >
                <Bell size={18} className={cn(activeTab === 'notifications' ? "text-accent" : "text-text-secondary group-hover:text-text-primary")} />
                <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-danger border-2 border-card-bg rounded-full flex items-center justify-center text-[6px] text-white">4</span>
             </button>
             <div className="flex items-center gap-2 bg-success/10 text-success px-3 py-1.5 rounded-full border border-success/20">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Live Monitoring
             </div>
             <div className="hidden lg:flex items-center gap-1 border-l border-border-subtle pl-6">
                Site PT.LHL - Kalteng
             </div>
          </div>
        </header>

        <div className="p-8 lg:p-10 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + selectedMonth}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <Dashboard data={filteredData} />}
              {activeTab === 'weather' && <WeatherView />}
              {activeTab === 'fuel' && <FuelLog data={filteredData} />}
              {activeTab === 'chat' && <Chat user={user} />}
              {activeTab === 'market' && <MarketPrice />}
              {activeTab === 'upload' && <UploadData onUploadComplete={() => setActiveTab('dashboard')} />}
              {activeTab === 'notifications' && <NotificationPanel />}
              {activeTab === 'users' && <UserList />}
            </motion.div>
          </AnimatePresence>
        </div>

        {activeTab === 'dashboard' && (
          <div className="fixed bottom-6 right-6 z-50 flex gap-4">
             {allData === RAW_DATA && (
               <button 
                  onClick={seedInitialData}
                  className="bg-accent/20 hover:bg-accent/40 text-accent px-4 py-2 rounded-lg border border-accent/30 text-[10px] font-black uppercase tracking-widest transition-all"
               >
                  Seed Database
               </button>
             )}
             {allData !== RAW_DATA && (
               <button 
                  onClick={clearDatabase}
                  className="bg-danger/20 hover:bg-danger/40 text-danger px-4 py-2 rounded-lg border border-danger/30 text-[10px] font-black uppercase tracking-widest transition-all"
               >
                  Clear Data
               </button>
             )}
          </div>
        )}
      </main>
    </div>
  );
}
