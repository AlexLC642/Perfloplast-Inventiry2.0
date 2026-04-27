'use client';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#c5a059', '#1a1a1b', '#334155', '#64748b', '#94a3b8'];

export function SalesTrendChart({ data }) {
  return (
    <div style={{ width: '100%', height: 300, background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.05)' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '24px' }}>Tendencia de Ventas</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#c5a059" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#c5a059" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
          />
          <Area type="monotone" dataKey="ventas" stroke="#c5a059" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function InventoryDistribution({ data }) {
  return (
    <div style={{ width: '100%', height: 300, background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.05)' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '24px' }}>Distribución de Inventario</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProductionByShift({ data }) {
  return (
    <div style={{ width: '100%', height: 300, background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.05)' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '24px' }}>Producción por Turno</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="cantidad" fill="#1a1a1b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
