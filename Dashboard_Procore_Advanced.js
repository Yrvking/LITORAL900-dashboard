import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  ComposedChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  Upload, FileText, AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown,
  BarChart2, Filter, Building, MapPin, Activity, Briefcase, Layers, ArrowUpRight, 
  ArrowDownRight, Download, RefreshCw, Eye, EyeOff, Zap, Shield, Wrench, Home,
  Calendar, Users, Percent
} from 'lucide-react';

// --- COLORES GERENCIALES (Litoral 900 Inspired) ---
const THEME = {
  primary: '#0f172a',      // Navy oscuro - Profesional
  secondary: '#1e293b',    // Slate 800
  accent: '#d97706',       // Amber - Atención
  success: '#059669',      // Emerald - OK
  danger: '#be123c',       // Rose - Crítico
  warning: '#f59e0b',      // Amber - Alerta
  info: '#3b82f6',         // Blue
  neutral: '#64748b',      // Slate
  bg: '#f8fafc',           // Muy claro
  cardBg: '#ffffff',
  grid: '#e2e8f0',
  gold: '#d4af37',         // Dorado elegante
};

const COLORS_PRIORITY = {
  'Urgent': THEME.danger,
  'High': THEME.warning,
  'Medium': THEME.info,
  'Low': THEME.neutral
};

const COLORS_STATUS = {
  'Cerrado': THEME.success,
  'Iniciado': THEME.warning,
  'Abierto': THEME.danger,
  'Listo para revisión': THEME.info
};

// --- COMPONENTES UI ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-slate-200 ${className}`}>
    {children}
  </div>
);

const KPICard = ({ title, value, trend, trendLabel, icon: Icon, type = "neutral", percentage = false }) => {
  const colors = {
    success: { border: THEME.success, icon: 'text-emerald-600', bg: 'bg-emerald-50' },
    danger: { border: THEME.danger, icon: 'text-rose-600', bg: 'bg-rose-50' },
    warning: { border: THEME.warning, icon: 'text-amber-600', bg: 'bg-amber-50' },
    neutral: { border: THEME.primary, icon: 'text-slate-600', bg: 'bg-slate-50' },
    info: { border: THEME.info, icon: 'text-blue-600', bg: 'bg-blue-50' }
  };
  
  const config = colors[type] || colors.neutral;
  
  return (
    <Card className="p-6 flex flex-col justify-between h-full border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: config.border }}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-extrabold text-slate-900 mt-2">{value}</h3>
            {percentage && <span className="text-sm text-slate-500">%</span>}
          </div>
        </div>
        <div className={`p-3 ${config.bg} rounded-lg`}>
          <Icon className={`w-6 h-6 ${config.icon}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-2">
          {trend >= 0 ? (
            <ArrowUpRight size={16} className={`${type === 'danger' ? 'text-rose-600' : 'text-emerald-600'}`} />
          ) : (
            <ArrowDownRight size={16} className="text-emerald-600" />
          )}
          <span className={`text-xs font-bold ${trend >= 0 && type === 'danger' ? 'text-rose-600' : 'text-emerald-600'}`}>
            {Math.abs(trend)}%
          </span>
          <span className="text-xs text-slate-400">{trendLabel}</span>
        </div>
      )}
    </Card>
  );
};

const StatBox = ({ label, value, icon: Icon, color = "slate" }) => (
  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
    <div className="flex items-center gap-3">
      <div className={`p-2 bg-${color}-100 rounded-lg`}>
        <Icon className={`w-5 h-5 text-${color}-600`} />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-semibold uppercase">{label}</p>
        <p className="text-lg font-bold text-slate-800">{value}</p>
      </div>
    </div>
  </div>
);

// --- HELPER FUNCTIONS ---

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    return new Date(year, month, day);
  }
  return new Date(dateStr);
};

const parseCSV = (text) => {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;
  
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentVal += '"';
        i++;
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
        if (currentRow.some(c => c !== '')) rows.push(currentRow);
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }
  
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(c => c !== '')) rows.push(currentRow);
  }

  if (rows.length < 2) return [];
  
  const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, ''));
  const result = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < Math.floor(headers.length * 0.5)) continue;
    
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] || '';
    });
    
    // ETL / ENRICHMENT
    obj._dateObj = parseDate(obj['Fecha de notificación'] || obj['Fecha de creación']);
    
    // Ubicación
    const locString = obj['Ubicación'] || '';
    const locParts = locString.split('>').map(s => s.trim());
    
    obj._torre = locParts[0] || 'General';
    obj._piso = locParts.find(p => {
       const upper = p.toUpperCase();
       return upper.includes('PISO') || upper.includes('SOTANO') || upper.includes('SÓTANO') || upper.includes('NIVEL');
    }) || 'Sin definir';
    
    obj._departamento = locParts.find(p => {
       const upper = p.toUpperCase();
       return upper.includes('DPTO') || upper.includes('DP');
    }) || '';
    
    // Especialidad / Partida
    const specString = obj['Especialidad'] || '';
    const specMatch = specString.match(/^(\d+)/);
    obj._partidaCode = specMatch ? specMatch[1] : 'S/C';
    obj._partidaName = specString.replace(/^\d+\s-\s/, '').split('-')[0].trim();
    
    // Tipo de Observación
    const tipoMap = {
      'Deficiencia': 'Deficiencia',
      'Seguridad': 'Seguridad',
      'Acabados': 'Acabados',
      'Eléctrico': 'Eléctrico',
      'Sanitario': 'Sanitario',
      'Estructural': 'Estructural'
    };
    obj._tipoLabel = tipoMap[obj['Tipo']] || obj['Tipo'] || 'Otros';

    result.push(obj);
  }
  return result;
};

// --- MAIN COMPONENT ---

export default function DashboardProcoreAdvanced() {
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [viewMode, setViewMode] = useState('dashboard'); // dashboard | detailed
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Demo Data
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
436,Eléctrico,120 - PRO - Electricidad,Cable expuesto pasillo,Maria L,ELECTRO,02/01/26,Iniciado,Urgent,TORRE>PISO 02
437,Acabados,130 - PRO - Pintura,Mancha en cielo raso,Ana Gomez,PINTURAS SA,03/01/26,Iniciado,Medium,TORRE>PISO 14
438,Sanitario,140 - PRO - Sanitaria,Tuberías mal selladas,Pedro Sánchez,SANITARIA PERU,04/01/26,Cerrado,Low,TORRE>PISO 10
439,Estructural,150 - PRO - Estructura,Grieta menor en muro,Roberto Lee,STRUCT ING,05/01/26,Iniciado,High,TORRE>PISO 03
440,Seguridad,111 - PRO - Seguridad Industrial,Salida de emergencia bloqueada,Victor Andres,PADOVA,05/01/26,Abierto,Urgent,TORRE>PISO 12
441,Deficiencia,110 - PRO - Control de Calidad,Piso rayado,Luis Villa,VIDRIOS PERU,06/01/26,Cerrado,Medium,TORRE>PISO 06
442,Acabados,130 - PRO - Pintura,Falta pintura en moldura,Ana Gomez,PINTURAS SA,06/01/26,Iniciado,Low,TORRE>PISO 07`;
    
    setData(parseCSV(demoRaw));
    setFileName('LITORAL900_DEMO_26DIC2025.csv');
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
          alert("Error procesando el archivo.");
        }
      };
      reader.readAsText(file);
    }
  };

  // Auto-refresh simulation
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      // En producción, aquí harías una llamada a un servidor para obtener datos nuevos
      console.log('Auto-refresh triggered');
    }, 60000); // Cada minuto
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // --- ADVANCED ANALYTICS ENGINE ---

  const analytics = useMemo(() => {
    if (data.length === 0) return null;

    let filtered = data;
    if (filterType !== 'All') {
      filtered = filtered.filter(d => d['Tipo'] === filterType);
    }
    if (filterPriority !== 'All') {
      filtered = filtered.filter(d => d['Prioridad'] === filterPriority);
    }

    const total = filtered.length;
    const closed = filtered.filter(d => d['Estatus'] === 'Cerrado').length;
    const open = filtered.filter(d => d['Estatus'] === 'Abierto').length;
    const inProgress = filtered.filter(d => d['Estatus'] === 'Iniciado').length;
    const critical = filtered.filter(d => d['Prioridad'] === 'Urgent').length;
    const highPriority = filtered.filter(d => d['Prioridad'] === 'High').length;
    
    const effectivenessRate = Math.round((closed / total) * 100) || 0;
    const criticalityIndex = Math.round((critical / total) * 100) || 0;

    // 1. PARTIDAS ANALYSIS (Pareto)
    const partidaMap = {};
    filtered.forEach(row => {
      const key = `${row._partidaCode} - ${row._partidaName}`;
      partidaMap[key] = (partidaMap[key] || 0) + 1;
    });
    const partidaData = Object.keys(partidaMap)
      .map(k => ({ name: k, value: partidaMap[k] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // 2. LOCATION HEATMAP (Pisos/Niveles)
    const floorMap = {};
    filtered.forEach(row => {
      let floor = row._piso.replace('TORRE>', '').trim();
      if (!floor || floor === 'Sin definir') floor = 'Exteriores';
      floorMap[floor] = (floorMap[floor] || 0) + 1;
    });
    const locationData = Object.keys(floorMap)
      .map(k => ({ name: k, count: floorMap[k] }))
      .sort((a, b) => {
        const getVal = (s) => {
            const upper = s.toUpperCase();
            if (upper.includes('SOTANO') || upper.includes('SÓTANO')) return -parseInt(s.match(/\d+/)?.[0] || 0) - 100;
            if (upper.includes('PISO') || upper.includes('NIVEL')) return parseInt(s.match(/\d+/)?.[0] || 0);
            return 0;
        };
        return getVal(b.name) - getVal(a.name);
      });

    // 3. DEPARTAMENTOS (si existe)
    const departamentoMap = {};
    filtered.forEach(row => {
      const dept = row._departamento || 'Áreas Comunes';
      departamentoMap[dept] = (departamentoMap[dept] || 0) + 1;
    });
    const departamentoData = Object.keys(departamentoMap)
      .map(k => ({ name: k, value: departamentoMap[k] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // 4. STATUS DISTRIBUTION
    const statusMap = {};
    filtered.forEach(row => {
      const status = row['Estatus'];
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    const statusData = Object.keys(statusMap).map(k => ({
      name: k,
      value: statusMap[k],
      fill: COLORS_STATUS[k] || THEME.neutral
    }));

    // 5. PRIORITY DISTRIBUTION
    const priorityMap = {};
    filtered.forEach(row => {
      const priority = row['Prioridad'];
      priorityMap[priority] = (priorityMap[priority] || 0) + 1;
    });
    const priorityData = Object.keys(priorityMap).map(k => ({
      name: k,
      value: priorityMap[k],
      fill: COLORS_PRIORITY[k] || THEME.neutral
    }));

    // 6. TIPO DE OBSERVACIÓN
    const tipoMap = {};
    filtered.forEach(row => {
      const tipo = row._tipoLabel;
      tipoMap[tipo] = (tipoMap[tipo] || 0) + 1;
    });
    const tipoData = Object.keys(tipoMap).map(k => ({
      name: k,
      value: tipoMap[k]
    })).sort((a, b) => b.value - a.value);

    // 7. TRENDS (Por fecha)
    const dateMap = {};
    filtered.forEach(row => {
      if (row._dateObj && !isNaN(row._dateObj)) {
        const dateKey = row._dateObj.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
        if (!dateMap[dateKey]) dateMap[dateKey] = { date: dateKey, created: 0, closed: 0, open: 0 };
        dateMap[dateKey].created += 1;
        if (row['Estatus'] === 'Cerrado') dateMap[dateKey].closed += 1;
        if (row['Estatus'] === 'Abierto') dateMap[dateKey].open += 1;
      }
    });
    const trendData = Object.values(dateMap).sort((a,b) => {
        const [d1, m1] = a.date.split('/');
        const [d2, m2] = b.date.split('/');
        return new Date(2025, m1-1, d1) - new Date(2025, m2-1, d2);
    });

    // 8. COMPAÑÍAS
    const companiaMap = {};
    filtered.forEach(row => {
      const cia = row['Compañía de la persona asignada'] || 'Sin asignar';
      companiaMap[cia] = (companiaMap[cia] || 0) + 1;
    });
    const companiaData = Object.keys(companiaMap)
      .map(k => ({ name: k, value: companiaMap[k] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // 9. RESPONSABLES
    const responsableMap = {};
    filtered.forEach(row => {
      const resp = row['Persona asignada'] || 'Sin asignar';
      responsableMap[resp] = (responsableMap[resp] || 0) + 1;
    });
    const responsableData = Object.keys(responsableMap)
      .map(k => ({ name: k, value: responsableMap[k] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // 10. PERFORMANCE INDICATORS
    const avgDaysOpen = filtered
      .filter(d => d._dateObj)
      .reduce((acc, d) => acc + Math.floor((new Date() - d._dateObj) / (1000 * 60 * 60 * 24)), 0) / (filtered.filter(d => d._dateObj).length || 1);

    return {
      total, closed, open, inProgress, critical, highPriority, 
      effectivenessRate, criticalityIndex, avgDaysOpen,
      partidaData, locationData, departamentoData, 
      statusData, priorityData, tipoData, trendData, companiaData, responsableData,
      raw: filtered
    };
  }, [data, filterType, filterPriority]);

  // --- PANTALLA DE CARGA ---
  if (data.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6 font-sans">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-12 text-center">
          <div className="mb-8 flex justify-center">
            <div className="h-20 w-20 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl flex items-center justify-center shadow-lg">
              <Building className="text-white w-10 h-10" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">LITORAL 900</h1>
          <p className="text-lg font-semibold text-slate-600 mt-2">Sistema de Control de Calidad</p>
          <p className="text-sm text-slate-400 mt-1">Análisis en Tiempo Real de Observaciones</p>
          
          <div className="mt-10 space-y-6">
            <div className="p-10 border-2 border-dashed border-slate-300 rounded-xl hover:border-slate-800 hover:bg-slate-50 transition-all cursor-pointer relative group">
              <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 opacity-0 z-10 cursor-pointer"/>
              <Upload className="mx-auto w-12 h-12 text-slate-400 group-hover:text-slate-800 transition-colors" />
              <p className="mt-4 text-base font-semibold text-slate-700">Carga tu archivo CSV</p>
              <p className="mt-1 text-sm text-slate-500">O arrastra el archivo desde Procore</p>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500 font-medium">O prueba con</span>
              </div>
            </div>

            <button onClick={loadDemoData} className="w-full py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all shadow-lg">
              📊 Cargar Datos Demo
            </button>
          </div>
          <p className="mt-8 text-xs text-slate-400">Dashboard profesional para Litoral 900 • Soporta exportaciones CSV de Procore</p>
        </div>
      </div>
    );
  }

  // --- DASHBOARD MAIN VIEW ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 font-sans">
      
      {/* HEADER EJECUTIVO */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg sticky top-0 z-30 border-b-4 border-amber-500">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
               <Building className="text-amber-400 w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-2xl tracking-wide">LITORAL 900</h1>
              <p className="text-xs text-slate-300 uppercase tracking-widest">Dashboard de Control de Calidad</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-xs text-slate-300 uppercase">Archivo Cargado</p>
              <p className="text-sm font-mono text-amber-300">{fileName}</p>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs text-slate-300 uppercase">Actualizado</p>
              <p className="text-sm font-mono text-amber-300">{new Date().toLocaleDateString()}</p>
            </div>
            <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold uppercase rounded-lg border border-slate-700 transition-colors cursor-pointer">
              <Upload size={14} />
              Cargar CSV
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
            <button 
              onClick={() => setData([])}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-xs font-bold uppercase rounded-lg transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8 pb-12 space-y-8">
        
        {/* CONTROL PANEL */}
        <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-1">
              {['All', 'Deficiencia', 'Seguridad', 'Acabados', 'Eléctrico', 'Sanitario'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterType === type 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {type === 'All' ? '📊 Todos' : type}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {['All', 'Urgent', 'High', 'Medium', 'Low'].map(priority => (
                <button
                  key={priority}
                  onClick={() => setFilterPriority(priority)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterPriority === priority 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {priority === 'All' ? '⚡ Prioridad' : priority}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg transition-all ${autoRefresh ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
              title="Auto-actualizar cada minuto"
            >
              <RefreshCw size={16} className={autoRefresh ? 'animate-spin' : ''} />
            </button>
            <span className="text-xs text-slate-500 font-medium">
              {analytics.raw.length} registros
            </span>
          </div>
        </div>

        {/* KPIs SCORECARD */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            title="Total Observaciones" 
            value={analytics.total} 
            icon={FileText} 
            type="neutral"
          />
          <KPICard 
            title="Hallazgos Críticos" 
            value={analytics.critical} 
            trend={analytics.critical > 5 ? 3 : -2}
            trendLabel="vs semana anterior"
            type="danger"
            icon={AlertTriangle} 
          />
          <KPICard 
            title="Efectividad de Cierre" 
            value={analytics.effectivenessRate} 
            percentage={true}
            trend={analytics.effectivenessRate >= 60 ? 5 : -3}
            trendLabel="vs mes anterior"
            type="success"
            icon={CheckCircle} 
          />
          <KPICard 
            title="Índice de Criticidad" 
            value={analytics.criticalityIndex} 
            percentage={true}
            type={analytics.criticalityIndex > 20 ? "danger" : "warning"}
            icon={Zap} 
          />
        </div>

        {/* SECONDARY METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatBox label="Iniciadas" value={analytics.inProgress} icon={Clock} color="amber" />
          <StatBox label="Abiertas" value={analytics.open} icon={AlertTriangle} color="red" />
          <StatBox label="Cerradas" value={analytics.closed} icon={CheckCircle} color="green" />
          <StatBox label="Alta Prioridad" value={analytics.highPriority} icon={TrendingUp} color="orange" />
          <StatBox label="Días Promedio" value={Math.round(analytics.avgDaysOpen)} icon={Calendar} color="blue" />
          <StatBox label="Responsables" value={analytics.responsableData.length} icon={Users} color="purple" />
        </div>

        {/* MAIN ANALYSIS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* MAPA DE CALOR - UBICACIONES */}
          <Card className="p-6 flex flex-col h-[500px]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                  <MapPin size={20} className="text-amber-500" />
                  Distribución por Nivel
                </h3>
                <p className="text-xs text-slate-400 mt-1">Concentración vertical de problemas</p>
              </div>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.locationData} layout="vertical" margin={{ left: 100, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke={THEME.neutral} style={{fontSize: '12px'}} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={95} 
                    tick={{fontSize: 12, fill: '#334155', fontWeight: 600}} 
                    interval={0}
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff', fontSize: '12px'}}
                    formatter={(value) => [`${value} problemas`, '']}
                  />
                  <Bar dataKey="count" fill="#334155" radius={[0, 4, 4, 0]} barSize={24}>
                    {analytics.locationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index < 3 ? THEME.danger : index < 6 ? THEME.warning : THEME.neutral} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* PIE CHART - ESTADO */}
          <Card className="p-6 flex flex-col h-[500px]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                  <Activity size={20} className="text-emerald-500" />
                  Estado de Observaciones
                </h3>
                <p className="text-xs text-slate-400 mt-1">Distribución por estado actual</p>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, value}) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} casos`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* PARTIDAS & DEPARTAMENTOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* PARTIDAS (Especialidades) */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                  <Layers size={20} className="text-indigo-500" />
                  Top Especialidades
                </h3>
                <p className="text-xs text-slate-400 mt-1">Pareto: ¿Qué causa más problemas?</p>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.partidaData} barSize={40}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" tick={{fontSize: 11, fill: '#64748b'}} angle={-45} textAnchor="end" height={100} />
                   <YAxis hide />
                   <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff'}}
                      formatter={(value) => [`${value} registros`, '']}
                   />
                   <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                      {analytics.partidaData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? THEME.danger : index === 1 ? THEME.warning : '#4f46e5'} />
                      ))}
                   </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* DEPARTAMENTOS */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                  <Home size={20} className="text-cyan-500" />
                  Problemas por Departamento
                </h3>
                <p className="text-xs text-slate-400 mt-1">Top 10 áreas afectadas</p>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.departamentoData.slice(0, 10)} layout="vertical" margin={{left: 80}}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                   <XAxis type="number" hide />
                   <YAxis 
                     dataKey="name" 
                     type="category" 
                     width={75}
                     tick={{fontSize: 11, fill: '#64748b'}} 
                   />
                   <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff'}}
                   />
                   <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* TRENDS & PRIORITY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* TRENDS */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                  <TrendingUp size={20} className="text-emerald-500" />
                  Velocidad de Obra
                </h3>
                <p className="text-xs text-slate-400 mt-1">Observaciones por fecha</p>
              </div>
            </div>
            <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.trendData}>
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e293b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1e293b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{fontSize: 11, fill: '#94a3b8'}} />
                  <YAxis hide />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff'}}/>
                  <Area type="monotone" dataKey="created" stroke="#1e293b" strokeWidth={2} fillOpacity={1} fill="url(#colorCreated)" name="Creadas" />
                  <Line type="monotone" dataKey="closed" stroke="#059669" strokeWidth={2.5} dot={{r: 3}} name="Cerradas" />
                  <Line type="monotone" dataKey="open" stroke="#be123c" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Abiertas" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* PRIORIDADES */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                  <Zap size={20} className="text-amber-500" />
                  Distribución de Prioridades
                </h3>
                <p className="text-xs text-slate-400 mt-1">Nivel de urgencia</p>
              </div>
            </div>
            <div className="space-y-4">
              {analytics.priorityData.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                    <span className="text-sm font-bold text-slate-800">{item.value}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${(item.value / analytics.total) * 100}%`,
                        backgroundColor: item.fill
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* TIPOS DE OBSERVACIÓN & COMPAÑÍAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* TIPOS */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                  <Shield size={20} className="text-blue-500" />
                  Tipos de Observaciones
                </h3>
                <p className="text-xs text-slate-400 mt-1">Clasificación por tipo</p>
              </div>
            </div>
            <div className="space-y-3">
              {analytics.tipoData.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">{item.name}</span>
                    <span className="px-2 py-1 bg-slate-900 text-white text-xs rounded font-bold">{item.value}</span>
                  </div>
                  <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-indigo-500 transition-all"
                      style={{width: `${(item.value / analytics.total) * 100}%`}}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* COMPAÑÍAS RESPONSABLES */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                  <Briefcase size={20} className="text-purple-500" />
                  Compañías Asignadas
                </h3>
                <p className="text-xs text-slate-400 mt-1">Top especialistas</p>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.companiaData} layout="vertical" margin={{left: 120}}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                   <XAxis type="number" hide />
                   <YAxis 
                     dataKey="name" 
                     type="category" 
                     width={115}
                     tick={{fontSize: 11, fill: '#64748b'}} 
                   />
                   <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff'}}
                   />
                   <Bar dataKey="value" fill="#a855f7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* TABLA DETALLADA */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <FileText size={20} />
                Desglose Detallado
              </h3>
              <p className="text-xs text-slate-500 mt-1">{analytics.raw.length} registros totales</p>
            </div>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 px-3 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <Download size={14}/>
              EXPORTAR
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Especialidad</th>
                  <th className="px-6 py-4">Ubicación</th>
                  <th className="px-6 py-4">Responsable</th>
                  <th className="px-6 py-4">Prioridad</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {analytics.raw.slice(0, 15).map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs font-bold text-slate-500">#{row.Número}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                        {row._tipoLabel}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs">{row._partidaName}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-amber-500" />
                        <span className="text-xs font-semibold">{row._piso}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-xs">{row['Persona asignada']}</td>
                    <td className="px-6 py-3">
                       <span style={{color: COLORS_PRIORITY[row['Prioridad']] || THEME.neutral}} className="text-xs font-bold">
                         {row['Prioridad']}
                       </span>
                    </td>
                    <td className="px-6 py-3">
                       <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{backgroundColor: COLORS_STATUS[row['Estatus']] + '20', color: COLORS_STATUS[row['Estatus']]}}>
                         {row['Estatus']}
                       </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-400">
                      {row._dateObj ? row._dateObj.toLocaleDateString('es-PE') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500">Mostrando 15 de {analytics.raw.length} registros</p>
          </div>
        </Card>

      </main>
    </div>
  );
}
