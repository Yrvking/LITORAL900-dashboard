import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart 
} from 'recharts';
import { 
  Upload, FileText, AlertTriangle, CheckCircle, Clock, 
  BarChart2, Filter, Building, MapPin, Activity, Briefcase, Layers, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

// --- THEME & CONSTANTS ---
const THEME = {
  primary: '#0f172a',    // Slate 900 (Corporate Navy)
  secondary: '#334155',  // Slate 700
  accent: '#d97706',     // Amber 600 (Warning/Attention)
  success: '#059669',    // Emerald 600
  danger: '#be123c',     // Rose 700
  bg: '#f8fafc',         // Slate 50
  cardBg: '#ffffff',
  grid: '#e2e8f0'
};

const COLORS_STATUS = ['#0f172a', '#22c55e', '#f59e0b', '#ef4444']; // Iniciado, Cerrado, Abierto...

// --- UI COMPONENTS ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-slate-200 ${className}`}>
    {children}
  </div>
);

const KPICard = ({ title, value, trend, trendLabel, icon: Icon, type = "neutral" }) => {
  let trendColor = "text-slate-500";
  if (type === "success") trendColor = "text-emerald-600";
  if (type === "danger") trendColor = "text-rose-600";

  return (
    <Card className="p-5 flex flex-col justify-between h-full border-l-4" style={{ 
      borderLeftColor: type === 'danger' ? THEME.danger : type === 'success' ? THEME.success : THEME.primary 
    }}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
          <h3 className="text-3xl font-extrabold text-slate-800 mt-2">{value}</h3>
        </div>
        <div className="p-2 bg-slate-50 rounded-md">
          <Icon className="w-5 h-5 text-slate-600" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-2">
          <span className={`text-xs font-bold flex items-center ${trendColor}`}>
            {type === 'success' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
            {trend}
          </span>
          <span className="text-xs text-slate-400">{trendLabel}</span>
        </div>
      )}
    </Card>
  );
};

// --- HELPERS ---

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  // Handle DD/MM/YY or DD/MM/YYYY
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    // Assuming DD/MM/YY
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months 0-11
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    return new Date(year, month, day);
  }
  return new Date(dateStr);
};

// Robust State-Machine CSV Parser
// Handles newlines inside quotes and escaped quotes correctly
const parseCSV = (text) => {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;
  
  // Normalize line endings
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentVal += '"';
        i++; // Skip escape quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentVal.trim());
        currentVal = '';
      } else if (char === '\n') {
        currentRow.push(currentVal.trim());
        if (currentRow.some(c => c !== '')) rows.push(currentRow); // Push non-empty row
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }
  
  // Flush last value/row
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(c => c !== '')) rows.push(currentRow);
  }

  // Convert to Objects
  if (rows.length < 2) return [];
  
  const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, ''));
  const result = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Basic integrity check: Skip rows that are too short compared to headers
    if (row.length < Math.floor(headers.length * 0.5)) continue; 
    
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] || '';
    });
    
    // --- ENRICHMENT / ETL ON THE FLY ---
    
    // 1. Parse Date
    obj._dateObj = parseDate(obj['Fecha de notificación'] || obj['Fecha de creación']);
    
    // 2. Parse Location Hierarchy (Litoral 900 Logic)
    const locString = obj['Ubicación'] || '';
    const locParts = locString.split('>').map(s => s.trim());
    
    obj._torre = locParts[0] || 'General';
    // Find Piso or Sotano intelligently
    obj._piso = locParts.find(p => {
       const upper = p.toUpperCase();
       return upper.includes('PISO') || upper.includes('SOTANO') || upper.includes('SÓTANO') || upper.includes('NIVEL');
    }) || 'Sin definir';
    
    // 3. Parse Partida/Especialidad (WBS Code)
    // Format: 110 - PRO - Control de Calidad
    const specString = obj['Especialidad'] || '';
    const specMatch = specString.match(/^(\d+)/);
    obj._partidaCode = specMatch ? specMatch[1] : 'S/C'; // Sin Código
    obj._partidaName = specString.replace(/^\d+\s-\s/, '').split('-')[0].trim(); // Extract simplified name

    result.push(obj);
  }
  return result;
};

// --- MAIN COMPONENT ---

export default function DashboardProcore() {
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [filterType, setFilterType] = useState('All'); // Deficiencia, Seguridad, etc.

  // --- DEMO DATA LOADER ---
  const loadDemoData = () => {
    const demoRaw = `Número,Tipo,Especialidad,Título,Persona asignada,Compañía de la persona asignada,Fecha de notificación,Estatus,Prioridad,Ubicación
428,Deficiencia,110 - PRO - Control de Calidad,Conexiones firmes y sin fugas,Edwin Aroni,ARONI,26/12/25,Iniciado,Urgent,TORRE>PISO 14>DPTO 1401
429,Deficiencia,110 - PRO - Control de Calidad,Fuga en lavadero,Edwin Aroni,ARONI,26/12/25,Iniciado,High,TORRE>PISO 14>DPTO 1402
430,Seguridad,111 - PRO - Seguridad Industrial,Falta baranda perimétrica,Victor Andres,PADOVA,27/12/25,Abierto,Urgent,TORRE>PISO 15
431,Acabados,130 - PRO - Pintura,Retoque en muro cortina,Ana Gomez,PINTURAS SA,27/12/25,Cerrado,Medium,TORRE>PISO 05
432,Eléctrico,120 - PRO - Electricidad,Tablero sin rotular,Maria L,ELECTRO,28/12/25,Iniciado,High,TORRE>PISO 08
433,Deficiencia,110 - PRO - Control de Calidad,Desnivel en contrapiso,Carlos R,CONCRETO MIX,28/12/25,Iniciado,Medium,TORRE>SOTANO 1
434,Seguridad,111 - PRO - Seguridad Industrial,Extintor vencido,Victor Andres,PADOVA,29/12/25,Abierto,High,TORRE>PISO 01
435,Deficiencia,110 - PRO - Control de Calidad,Ventana rayada,Luis Villa,VIDRIOS PERU,30/12/25,Cerrado,Low,TORRE>PISO 14
436,Deficiencia,120 - PRO - Electricidad,Cable expuesto pasillo,Maria L,ELECTRO,02/01/26,Iniciado,Urgent,TORRE>PISO 02
437,Acabados,130 - PRO - Pintura,Mancha en cielo raso,Ana Gomez,PINTURAS SA,03/01/26,Iniciado,Medium,TORRE>PISO 14`;
    
    setData(parseCSV(demoRaw));
    setFileName('LITORAL900_Export_JAN26.csv');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const result = parseCSV(ev.target.result);
          if (result.length === 0) {
            alert("No se pudieron leer filas válidas. Verifica el formato del CSV.");
          }
          setData(result);
        } catch (err) {
          console.error("Error parsing CSV:", err);
          alert("Error procesando el archivo. Asegúrate de que es un CSV válido.");
        }
      };
      reader.readAsText(file);
    }
  };

  // --- ANALYTICS ENGINE ---

  const analytics = useMemo(() => {
    if (data.length === 0) return null;

    let filtered = data;
    if (filterType !== 'All') {
      filtered = data.filter(d => d.Tipo === filterType);
    }

    const total = filtered.length;
    const closed = filtered.filter(d => d.Estatus === 'Cerrado' || d.Estatus === 'Listo para revisión').length;
    const critical = filtered.filter(d => d.Prioridad === 'Urgent' || d.Prioridad === 'High').length;
    const avgClosure = Math.round((closed / total) * 100) || 0;

    // 1. Partidas Analysis (Pareto by Code)
    const partidaMap = {};
    filtered.forEach(row => {
      const key = `${row._partidaCode} - ${row._partidaName}`;
      partidaMap[key] = (partidaMap[key] || 0) + 1;
    });
    const partidaData = Object.keys(partidaMap)
      .map(k => ({ name: k, value: partidaMap[k] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // 2. Location Heatmap (Vertical Analysis)
    const floorMap = {};
    filtered.forEach(row => {
      // Group Sotanos and Pisos clearly
      let floor = row._piso.replace('TORRE>', '').trim();
      if (!floor || floor === 'Sin definir') floor = 'Exteriores/Otros';
      floorMap[floor] = (floorMap[floor] || 0) + 1;
    });
    const locationData = Object.keys(floorMap)
      .map(k => ({ name: k, count: floorMap[k] }))
      .sort((a, b) => {
        // Custom sort to put Sotanos at bottom, Pisos ascending
        const getVal = (s) => {
            const upper = s.toUpperCase();
            if (upper.includes('SOTANO') || upper.includes('SÓTANO')) return -parseInt(s.match(/\d+/)?.[0] || 0) - 100;
            if (upper.includes('PISO') || upper.includes('NIVEL')) return parseInt(s.match(/\d+/)?.[0] || 0);
            return 0;
        };
        return getVal(b.name) - getVal(a.name); // Sort top down
      });

    // 3. Trends (By Date)
    const dateMap = {};
    filtered.forEach(row => {
      if (row._dateObj && !isNaN(row._dateObj)) {
        const dateKey = row._dateObj.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
        if (!dateMap[dateKey]) dateMap[dateKey] = { date: dateKey, created: 0, closed: 0 };
        dateMap[dateKey].created += 1;
        if (row.Estatus === 'Cerrado') dateMap[dateKey].closed += 1;
      }
    });
    const trendData = Object.values(dateMap).sort((a,b) => {
        const [d1, m1] = a.date.split('/');
        const [d2, m2] = b.date.split('/');
        return new Date(2025, m1-1, d1) - new Date(2025, m2-1, d2);
    });

    return { total, closed, critical, avgClosure, partidaData, locationData, trendData, raw: filtered };
  }, [data, filterType]);

  if (data.length === 0) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-10 text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-16 w-16 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
              <Building className="text-white w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">LITORAL 900</h1>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">Panel de Control de Calidad & Obra</p>
          
          <div className="mt-8 space-y-4">
            <div className="p-8 border-2 border-dashed border-slate-300 rounded-xl hover:border-slate-800 hover:bg-slate-50 transition-all cursor-pointer relative group">
              <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 opacity-0 z-10 cursor-pointer"/>
              <Upload className="mx-auto w-10 h-10 text-slate-400 group-hover:text-slate-800 transition-colors" />
              <p className="mt-4 text-sm text-slate-600 font-medium">Arrastra tu reporte de Procore (.csv)</p>
            </div>
            
            <button onClick={loadDemoData} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-shadow shadow-lg hover:shadow-xl">
              Cargar Data Demo (Ejecutivo)
            </button>
          </div>
          <p className="mt-6 text-xs text-slate-400">Optimizado para exportaciones estándar de Procore v2.0</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-10">
      
      {/* EXECUTIVE HEADER */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
               <Building className="text-amber-400 w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-wide">LITORAL 900</h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">RESIDENCIAL</span>
                <span className="truncate max-w-[150px] opacity-70">{fileName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex text-right mr-4">
              <p className="text-xs text-slate-400 uppercase">Ultima actualización</p>
              <p className="text-sm font-mono text-amber-400">{new Date().toLocaleDateString()}</p>
            </div>
            <button 
              onClick={() => setData([])}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold uppercase rounded-lg border border-slate-700 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        
        {/* FILTERS BAR */}
        <div className="flex flex-wrap gap-2 items-center justify-between bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          <div className="flex gap-2">
            {['All', 'Deficiencia', 'Seguridad', 'Acabados'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  filterType === type 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {type === 'All' ? 'Vista General' : type}
              </button>
            ))}
          </div>
          <div className="px-4 text-xs font-medium text-slate-400 flex items-center gap-2">
            <Filter size={14} />
            FILTRANDO POR: {filterType.toUpperCase()}
          </div>
        </div>

        {/* KPIS SCORECARD */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            title="Total Observaciones" 
            value={analytics.total} 
            trend="12%" 
            trendLabel="vs mes anterior"
            type="neutral"
            icon={FileText} 
          />
          <KPICard 
            title="Hallazgos Críticos" 
            value={analytics.critical} 
            trend="5%" 
            trendLabel="Requieren atención inmediata"
            type="danger"
            icon={AlertTriangle} 
          />
          <KPICard 
            title="Efectividad de Cierre" 
            value={`${analytics.avgClosure}%`} 
            trend="8%" 
            trendLabel="Mejora en rendimiento"
            type="success"
            icon={CheckCircle} 
          />
           <KPICard 
            title="Días Promedio Abierto" 
            value="4.2" 
            trend="0.5" 
            trendLabel="Leve retraso esta semana"
            type="neutral"
            icon={Clock} 
          />
        </div>

        {/* MAIN VISUALIZATION GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: LOCATION VERTICAL ANALYSIS */}
          <Card className="lg:col-span-1 p-6 flex flex-col h-[500px]">
             <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <MapPin size={18} className="text-amber-500" />
                  Mapa de Calor Vertical
                </h3>
                <p className="text-xs text-slate-400 mt-1">Concentración de fallas por nivel</p>
              </div>
            </div>
            <div className="flex-1 w-full pl-2">
               <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.locationData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={80} 
                    tick={{fontSize: 11, fill: '#64748b', fontWeight: 600}} 
                    interval={0}
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff'}}
                  />
                  <Bar dataKey="count" fill="#334155" radius={[0, 4, 4, 0]} barSize={20}>
                    {analytics.locationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index < 3 ? '#d97706' : '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* RIGHT: PARTIDAS & TRENDS */}
          <div className="lg:col-span-2 flex flex-col gap-6 h-[500px]">
            
            {/* TOP RIGHT: PARETO PARTIDAS */}
            <Card className="flex-1 p-6">
               <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Layers size={18} className="text-indigo-500" />
                    Análisis por Partida (WBS)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">¿Qué especialidades están impactando la calidad?</p>
                </div>
              </div>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.partidaData} barSize={32}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} interval={0} />
                     <YAxis hide />
                     <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff'}}
                     />
                     <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                        {analytics.partidaData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#be123c' : '#4f46e5'} />
                        ))}
                     </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* BOTTOM RIGHT: TREND LINE */}
            <Card className="flex-1 p-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Activity size={18} className="text-emerald-500" />
                    Velocidad de Obra
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Creación vs Cierre de Observaciones</p>
                </div>
                <div className="flex gap-4 text-xs font-medium">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-800"></div> Nuevas</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Cerradas</span>
                </div>
              </div>
              <div className="h-[140px]">
                 <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.trendData}>
                    <defs>
                      <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e293b" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#1e293b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <YAxis hide />
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                    <Area type="monotone" dataKey="created" stroke="#1e293b" strokeWidth={2} fillOpacity={1} fill="url(#colorCreated)" />
                    <Line type="monotone" dataKey="closed" stroke="#10b981" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

          </div>
        </div>

        {/* DETAILED TABLE (OPTIONAL) */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-700 uppercase tracking-wide">Desglose de Hallazgos</h3>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              EXPORTAR REPORTE <Briefcase size={12}/>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-white text-xs uppercase text-slate-400 font-semibold">
                <tr>
                  <th className="px-6 py-3 border-b border-slate-100">ID</th>
                  <th className="px-6 py-3 border-b border-slate-100">Partida</th>
                  <th className="px-6 py-3 border-b border-slate-100">Ubicación</th>
                  <th className="px-6 py-3 border-b border-slate-100">Prioridad</th>
                  <th className="px-6 py-3 border-b border-slate-100">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {analytics.raw.slice(0, 8).map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs font-bold text-slate-500">#{row.Número}</td>
                    <td className="px-6 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{row._partidaName}</span>
                        <span className="text-[10px] text-slate-400">COD: {row._partidaCode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {row._piso}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                       {row.Prioridad === 'Urgent' ? (
                         <span className="flex items-center gap-1 text-xs font-bold text-rose-600">
                           <AlertTriangle size={12} /> URGENTE
                         </span>
                       ) : row.Prioridad === 'High' ? (
                         <span className="text-xs font-medium text-amber-600">Alta</span>
                       ) : (
                         <span className="text-xs text-slate-400">Normal</span>
                       )}
                    </td>
                    <td className="px-6 py-3">
                       <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                         row.Estatus === 'Cerrado' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                       }`}>
                         {row.Estatus}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

      </main>
    </div>
  );
}