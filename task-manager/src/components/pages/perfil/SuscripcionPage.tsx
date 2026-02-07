import { useState, useEffect } from 'react';
import { getSubscription, updateSubscription, cancelSubscription } from '../../../services/userProfileApi';
import type { UserSubscription } from '../../../types';

export function SuscripcionPage() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const res = await getSubscription();
      setSubscription(res.data);
    } catch {
      // First load might not have a subscription
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSelectPlan = async (plan: string) => {
    try {
      const res = await updateSubscription({ plan });
      setSubscription(res.data);
      showMessage('success', `Plan cambiado a ${plan}`);
    } catch {
      showMessage('error', 'Error al cambiar de plan');
    }
  };

  const handleCancelPlan = async () => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar tu suscripción?')) return;
    try {
      await cancelSubscription();
      await loadSubscription();
      showMessage('success', 'Suscripción cancelada');
    } catch {
      showMessage('error', 'Error al cancelar la suscripción');
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'basico': return 'Básico';
      case 'profesional': return 'Profesional';
      case 'empresarial': return 'Empresarial';
      default: return plan;
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  const currentPlan = subscription?.plan || 'basico';

  return (
    <div className="profile-page">
      {message && (
        <div className={`profile-toast ${message.type === 'success' ? 'profile-toast-success' : 'profile-toast-error'}`}>
          {message.text}
        </div>
      )}

      <div className="profile-page-header">
        <h1>Suscripción</h1>
        <p className="profile-page-subtitle">Gestiona tu plan y pago</p>
      </div>

      {/* Current Plan */}
      {currentPlan !== 'basico' && (
        <div className="profile-card subscription-current">
          <div className="subscription-current-left">
            <span className="subscription-badge">Recomendado</span>
            <h2 className="subscription-plan-name">{getPlanLabel(currentPlan)}</h2>
            <p className="subscription-plan-desc">
              {currentPlan === 'profesional' && 'Para propietarios que quieren cobrar a tiempo'}
              {currentPlan === 'empresarial' && 'Para administradores grandes'}
            </p>
            <ul className="subscription-features">
              {currentPlan === 'profesional' && (
                <>
                  <li><span className="feature-check">✓</span> Automatiza recordatorios de renta</li>
                  <li><span className="feature-check">✓</span> Alertas de pagos atrasados</li>
                  <li><span className="feature-check">✓</span> Reportes financieros mensuales</li>
                  <li><span className="feature-check">✓</span> Exportación a Excel / PDF</li>
                </>
              )}
              {currentPlan === 'empresarial' && (
                <>
                  <li><span className="feature-check">✓</span> Propiedades ilimitadas</li>
                  <li><span className="feature-check">✓</span> Automatización avanzada de cobros</li>
                  <li><span className="feature-check">✓</span> Múltiples usuarios y roles</li>
                </>
              )}
            </ul>
          </div>
          <div className="subscription-current-right">
            {subscription?.tarjetaUltimos4 && (
              <div className="subscription-card-info">
                <span className="card-label">Tarjeta de pago</span>
                <span className="card-number">•••• {subscription.tarjetaUltimos4}</span>
                {subscription.tarjetaExpiracion && (
                  <span className="card-expiry">Válida hasta {subscription.tarjetaExpiracion}</span>
                )}
                <button className="btn btn-outline btn-sm">Actualizar tarjeta</button>
              </div>
            )}
            {subscription?.proximoPago && (
              <div className="subscription-next-payment">
                <span>Próximo pago:</span>
                <strong>{formatDate(subscription.proximoPago)}</strong>
              </div>
            )}
            <div className="subscription-actions">
              <button className="btn btn-danger-outline" onClick={handleCancelPlan}>
                Cancelar plan
              </button>
              <button className="btn btn-outline">Me plan pago</button>
              <button className="btn btn-primary">Cambiar plan</button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Options */}
      <div className="subscription-plans">
        {/* Básico */}
        <div className={`subscription-plan-card ${currentPlan === 'basico' ? 'plan-active' : ''}`}>
          <h3>Básico</h3>
          <p className="plan-audience">Para propietarios pequeños</p>
          <p className="plan-price"><strong>GRATIS</strong></p>
          <ul className="plan-features">
            <li><span className="feature-check">✓</span> Hasta 2 propiedades</li>
            <li><span className="feature-check">✓</span> Gestión básica</li>
            <li><span className="feature-check">✓</span> Registro manual de pagos</li>
            <li><span className="feature-check">✓</span> Vista de contratos</li>
            <li><span className="feature-cross">✕</span> Sin recordatorios automáticos</li>
            <li><span className="feature-cross">✕</span> Sin reportes financieros</li>
          </ul>
          <button
            className={`btn ${currentPlan === 'basico' ? 'btn-outline btn-disabled' : 'btn-outline'}`}
            onClick={() => handleSelectPlan('basico')}
            disabled={currentPlan === 'basico'}
          >
            {currentPlan === 'basico' ? 'Plan actual' : 'Elegir gratis'}
          </button>
        </div>

        {/* Profesional */}
        <div className={`subscription-plan-card plan-recommended ${currentPlan === 'profesional' ? 'plan-active' : ''}`}>
          <span className="plan-badge">Recomendado</span>
          <h3>Profesional</h3>
          <p className="plan-price-amount">$249 <span className="plan-price-currency">MxN / mes</span></p>
          <p className="plan-audience">Para propietarios que quieren cobrar a tiempo.</p>
          <ul className="plan-features">
            <li><span className="feature-check">✓</span> Hasta 15 propiedades</li>
            <li><span className="feature-check">✓</span> Recordatorios automáticos (email)</li>
            <li><span className="feature-check">✓</span> Alertas de pagos atrasados</li>
            <li><span className="feature-check">✓</span> Exportaciones Excel / PDF</li>
            <li><span className="feature-check">✓</span> Soporte prioritario</li>
          </ul>
          <button
            className={`btn ${currentPlan === 'profesional' ? 'btn-primary btn-disabled' : 'btn-primary'}`}
            onClick={() => handleSelectPlan('profesional')}
            disabled={currentPlan === 'profesional'}
          >
            {currentPlan === 'profesional' ? 'Plan actual' : 'Elegir Profesional'}
          </button>
        </div>

        {/* Empresarial */}
        <div className={`subscription-plan-card ${currentPlan === 'empresarial' ? 'plan-active' : ''}`}>
          <h3 className="plan-enterprise-title">Empresarial</h3>
          <p className="plan-price-amount">$999 <span className="plan-price-currency">MxN/mes</span></p>
          <p className="plan-audience">Para administradores grandes</p>
          <ul className="plan-features">
            <li><span className="feature-check">✓</span> Propiedades ilimitadas</li>
            <li><span className="feature-check">✓</span> Automatización avanzada de cobros</li>
            <li><span className="feature-check">✓</span> Múltiples usuarios y roles</li>
          </ul>
          <button
            className={`btn ${currentPlan === 'empresarial' ? 'btn-enterprise btn-disabled' : 'btn-enterprise'}`}
            onClick={() => handleSelectPlan('empresarial')}
            disabled={currentPlan === 'empresarial'}
          >
            {currentPlan === 'empresarial' ? 'Plan actual' : 'Elegir Empresarial'}
          </button>
        </div>
      </div>
    </div>
  );
}
