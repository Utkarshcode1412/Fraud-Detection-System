import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import SearchFilterBar from '../components/SearchFilterBar';
import TransactionTable from '../components/TransactionTable';
import TransactionDetailModal from '../components/TransactionDetailModal';
import Pagination from '../components/Pagination';
import { transactionsApi } from '../api/endpoints';

export default function Transactions() {
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], pagination: { totalPages: 1 } });
  const [selectedTx, setSelectedTx] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    transactionsApi
      .list({ page, pageSize: 15, search: search || undefined, riskLevel: riskLevel || undefined })
      .then((res) => setResult(res.data))
      .catch(() => setResult({ data: [], pagination: { totalPages: 1 } }))
      .finally(() => setLoading(false));
  }, [page, search, riskLevel]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { setPage(1); }, [search, riskLevel]);

  return (
    <Layout title="Transactions" subtitle="Search, filter, and investigate individual transactions">
      <div className="bg-surface-raised border border-surface-border rounded-xl p-5 shadow-card">
        <SearchFilterBar
          search={search}
          onSearchChange={setSearch}
          riskLevel={riskLevel}
          onRiskLevelChange={setRiskLevel}
        />

        <div className="mt-4">
          {loading ? (
            <div className="text-ink-muted text-sm py-16 text-center">Loading transactions…</div>
          ) : (
            <TransactionTable transactions={result.data} onRowClick={setSelectedTx} />
          )}
        </div>

        <Pagination page={page} totalPages={result.pagination?.totalPages || 1} onChange={setPage} />
      </div>

      <TransactionDetailModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </Layout>
  );
}
