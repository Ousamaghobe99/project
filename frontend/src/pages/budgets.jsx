import React, { useEffect, useState, useCallback, useMemo } from 'react';
import useStore from '../store';
import api from '../libs/apiCall';
import { toast } from 'sonner';
import Title from '../components/title';
import Input from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { formatCurrency } from '../libs';
import { format, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import PropTypes from 'prop-types';

const COLORS = ['#4ade80', '#f87171', '#60a5fa', '#fbbf24', '#a78bfa', '#f472b6'];

const BudgetPage = () => {
  const user = useStore(state => state.user);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [spending, setSpending] = useState({});
  const [newBudget, setNewBudget] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [sortOption, setSortOption] = useState('name');

  const monthKey = format(selectedMonth, 'yyyy-MM');

  // Totals
  const totalBudget = useMemo(
    () => budgets.reduce((sum, b) => sum + b.budget_amount, 0),
    [budgets]
  );
  const totalSpending = useMemo(
    () => Object.values(spending[monthKey] || {}).reduce((sum, x) => sum + x, 0),
    [spending, monthKey]
  );
  const totalRemaining = totalBudget - totalSpending;

  // Pie chart data: spending by category
  const pieData = useMemo(
    () => categories
      .map((cat, idx) => {
        const spent = spending[monthKey]?.[cat.category_id] || 0;
        return { name: cat.category_name || cat.name, value: spent, color: COLORS[idx % COLORS.length] };
      })
      .filter(d => d.value > 0),
    [categories, spending, monthKey]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const year = format(selectedMonth, 'yyyy');
      const month = format(selectedMonth, 'MM');
      const params = new URLSearchParams({ year, month });

      const [bRes, sRes, cRes] = await Promise.all([
        api.get(`/budgets?${params}`),
        api.get(`/budgets/status?${params}`),
        api.get(`/categories?${new URLSearchParams({ type: 'expense', userId: user?.id })}`)
      ]);

      setBudgets(bRes.data.data || []);
      setSpending(sRes.data.data || {});
      setCategories(cRes.data.data || []);
    } catch (err) {
      console.error('Budget fetch error:', err);
      toast.error('Impossible de charger les données du budget');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Save or update a budget for a category
  const saveBudget = async (catId) => {
    const amt = newBudget[catId];
    if (!amt || isNaN(amt)) {
      return toast.error('Entrez un montant valide');
    }
    try {
      const year = format(selectedMonth, 'yyyy');
      const month = format(selectedMonth, 'MM');
      const payload = { category_id: catId, budget_month: `${year}-${month}-01`, budget_amount: amt };
      const existing = budgets.find(b => b.category_id === catId);
      const endpoint = existing ? `/budgets/${existing.budget_id}` : '/budgets';
      const method = existing ? api.put : api.post;
      await method(endpoint, payload);

      toast.success('Budget enregistré');
      setNewBudget(prev => ({ ...prev, [catId]: undefined }));
      fetchData();
    } catch (err) {
      console.error('Save budget error:', err);
      if (err.response?.status === 404) {
        toast.error("Route d'API introuvable (404). Vérifiez le chemin de l'endpoint '/budgets'.");
      } else {
        toast.error(err.response?.data?.message || 'Échec de la sauvegarde du budget');
      }
    }
  };

  const visibleCategories = useMemo(() => {
    let list = categories.filter(cat =>
      (cat.category_name || cat.name || '')
        .toLowerCase()
        .includes(filter.toLowerCase())
    );
    list = [...list].sort((a, b) => {
      const aSpent = spending[monthKey]?.[a.category_id] || 0;
      const bSpent = spending[monthKey]?.[b.category_id] || 0;
      const aBudget = budgets.find(x => x.category_id === a.category_id)?.budget_amount || 0;
      const bBudget = budgets.find(x => x.category_id === b.category_id)?.budget_amount || 0;

      if (sortOption === 'spent') return bSpent - aSpent;
      if (sortOption === 'remaining') return (bBudget - bSpent) - (aBudget - aSpent);
      return (a.category_name || a.name).localeCompare(b.category_name || b.name);
    });
    return list;
  }, [categories, filter, sortOption, spending, budgets, monthKey]);

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Title title="Gestion du Budget" />
        <MonthNavigator
          selectedMonth={selectedMonth}
          onChange={dir => setSelectedMonth(d => dir === 'next' ? addMonths(d, 1) : subMonths(d, 1))}
        />
      </div>

      {/* Summary + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent>
            <h4 className="text-sm font-medium mb-2">Dépenses par catégorie</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={value => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm">Budget total</p>
            <p className="text-xl font-semibold">{formatCurrency(totalBudget)}</p>
          </div>
          <div>
            <p className="text-sm">Dépenses</p>
            <p className="text-xl font-semibold">{formatCurrency(totalSpending)}</p>
          </div>
          <div>
            <p className="text-sm">Restant</p>
            <p className="text-xl font-semibold">{formatCurrency(totalRemaining)}</p>
          </div>
        </div>
      </div>

      {/* Filter & Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Input
          placeholder="Rechercher une catégorie..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="flex-1"
        />
        <select
          value={sortOption}
          onChange={e => setSortOption(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="name">Nom (A–Z)</option>
          <option value="spent">Dépenses (desc)</option>
          <option value="remaining">Restant (desc)</option>
        </select>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleCategories.map((cat, idx) => {
          const budgetAmt = budgets.find(b => b.category_id === cat.category_id)?.budget_amount || 0;
          const spent = spending[monthKey]?.[cat.category_id] || 0;
          const remaining = budgetAmt - spent;
          const pct = budgetAmt > 0 ? Math.min((spent / budgetAmt) * 100, 100) : 0;

          return (
            <div key={`${cat.category_id}-${idx}`} className="h-full flex flex-col justify-between transition-opacity duration-300" style={{ transitionDelay: `${idx * 50}ms` }}>
              <Card className="h-full flex flex-col justify-between">
                <CardContent>
                  <h3 className="text-lg font-semibold mb-2">
                    {cat.category_name || cat.name || '—'}
                  </h3>
                  <p className="text-sm mb-1">Budget: {budgetAmt > 0 ? formatCurrency(budgetAmt) : '—'}</p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full ${remaining < 0 ? 'bg-red-600' : 'bg-green-600'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{formatCurrency(spent)} dépensé</span>
                    <span>{formatCurrency(remaining)} restant</span>
                  </div>
                </CardContent>
                <div className="p-4 pt-0 flex gap-2">
                  <Input
                    type="number"
                    placeholder="Nouveau budget"
                    value={newBudget[cat.category_id] ?? ''}
                    onChange={e => setNewBudget(prev => ({ ...prev, [cat.category_id]: parseFloat(e.target.value) }))}
                    className="flex-1"
                  />
                  <Button onClick={() => saveBudget(cat.category_id)} disabled={!newBudget[cat.category_id]}>
                    Save
                  </Button>
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MonthNavigator = ({ selectedMonth, onChange }) => (
  <div className="flex items-center gap-4">
    <Button variant="outline" onClick={() => onChange('previous')} aria-label="Mois précédent">
      <MdChevronLeft className="w-5 h-5" />
    </Button>
    <span className="font-semibold text-lg text-gray-700 dark:text-gray-300">
      {format(selectedMonth, 'MMMM yyyy', { locale: fr })}
    </span>
    <Button variant="outline" onClick={() => onChange('next')} aria-label="Mois suivant">
      <MdChevronRight className="w-5 h-5" />
    </Button>
  </div>
);

MonthNavigator.propTypes = {
  selectedMonth: PropTypes.instanceOf(Date).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default BudgetPage;
