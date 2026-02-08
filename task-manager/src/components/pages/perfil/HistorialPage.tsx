import { useState, useEffect, useCallback } from 'react';
import { getBillingHistory } from '../../../services/userProfileApi';
import { useLanguage } from '../../../i18n/LanguageContext';
import type { BillingRecord } from '../../../types';

type FilterType = 'todo' | '30d' | '12m' | 'custom';

export function HistorialPage() {
  const { t } = useLanguage();
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('todo');
  const [customDate, setCustomDate] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 5;

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      let filter: string | undefined;
      if (activeFilter === '30d') filter = '30d';
      else if (activeFilter === '12m') filter = '12m';
      else if (activeFilter === 'custom' && customDate) filter = customDate;

      const res = await getBillingHistory({
        page,
        size: pageSize,
        search: search || undefined,
        filter,
      });
      setRecords(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
    } catch {
      // On error, show empty state
      setRecords([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, activeFilter, customDate]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setPage(0);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatMonto = (monto: number, moneda: string) => {
    return `$${monto.toLocaleString('es-MX')} ${moneda}`;
  };

  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = ['Fecha', 'Descripción', 'Monto', 'Moneda'];
    const rows = records.map(r => [
      r.fecha,
      r.descripcion,
      r.monto.toString(),
      r.moneda,
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'historial_facturas.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    for (let i = 0; i < totalPages; i++) {
      pages.push(
        <button
          key={i}
          className={`historial-page-btn ${page === i ? 'historial-page-btn-active' : ''}`}
          onClick={() => setPage(i)}
        >
          {i + 1}
        </button>
      );
    }
    return (
      <div className="historial-pagination">
        <span className="historial-pagination-info">
          {t('hist.mostrando')} {records.length} {t('hist.de')} {totalElements} {t('hist.registros')}
        </span>
        <div className="historial-pagination-controls">
          <button
            className="historial-page-btn"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            &lt;
          </button>
          {pages}
          <button
            className="historial-page-btn"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
          >
            &gt;
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <h1>{t('hist.titulo')}</h1>
        <p className="profile-page-subtitle">{t('hist.subtitulo')}</p>
      </div>

      <div className="profile-card">
        {/* Search and Export */}
        <div className="historial-toolbar">
          <div className="historial-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder={t('hist.buscar')}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={handleExportCSV}>
            {t('hist.exportar')}
          </button>
        </div>

        {/* Filters */}
        <div className="historial-filters">
          <span className="historial-filter-label">Filtrar:</span>
          <button
            className={`historial-filter-btn ${activeFilter === 'todo' ? 'historial-filter-btn-active' : ''}`}
            onClick={() => handleFilterChange('todo')}
          >
            {t('hist.todo')}
          </button>
          <button
            className={`historial-filter-btn ${activeFilter === '30d' ? 'historial-filter-btn-active' : ''}`}
            onClick={() => handleFilterChange('30d')}
          >
            {t('hist.ultimos30')}
          </button>
          <button
            className={`historial-filter-btn ${activeFilter === '12m' ? 'historial-filter-btn-active' : ''}`}
            onClick={() => handleFilterChange('12m')}
          >
            {t('hist.ultimos12')}
          </button>
          <input
            type="date"
            className="historial-date-input"
            value={customDate}
            onChange={(e) => {
              setCustomDate(e.target.value);
              setActiveFilter('custom');
              setPage(0);
            }}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="historial-loading">
            <div className="loading-spinner"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="historial-empty">
            <p>{t('hist.sinRegistros')}</p>
          </div>
        ) : (
          <>
            <div className="historial-table-wrapper">
              <table className="historial-table">
                <thead>
                  <tr>
                    <th>{t('hist.fecha')}</th>
                    <th>{t('hist.descripcion')}</th>
                    <th>{t('hist.monto')}</th>
                    <th>{t('hist.factura')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td>{formatDate(record.fecha)}</td>
                      <td>{record.descripcion}</td>
                      <td>{formatMonto(record.monto, record.moneda)}</td>
                      <td></td>
                      <td>
                        {record.facturaUrl && (
                          <a
                            href={record.facturaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-sm"
                          >
                            {t('hist.descargar')}
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
}
