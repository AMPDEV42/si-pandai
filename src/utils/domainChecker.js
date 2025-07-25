/**
 * Domain Authorization Checker for Google Drive API
 * Helps debug domain authorization issues
 */

export const checkDomainAuthorization = () => {
  const currentDomain = window.location.origin;
  const isLocalhost = currentDomain.includes('localhost') || currentDomain.includes('127.0.0.1');
  const isFlyDev = currentDomain.includes('fly.dev');
  const isHTTPS = window.location.protocol === 'https:';
  
  const requiredDomains = [
    'http://localhost:5173',
    'http://localhost:3000',
    currentDomain // Current domain should be added
  ];

  const domainInfo = {
    currentDomain,
    isLocalhost,
    isFlyDev,
    isHTTPS,
    isProduction: !isLocalhost,
    requiredDomains,
    recommendations: []
  };

  // Add recommendations based on domain type
  if (isFlyDev) {
    domainInfo.recommendations.push({
      type: 'warning',
      message: `You're using a fly.dev domain (${currentDomain}). Make sure this exact domain is added to Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client ID > Authorized JavaScript origins.`
    });
  }

  if (!isHTTPS && !isLocalhost) {
    domainInfo.recommendations.push({
      type: 'error',
      message: 'Google OAuth requires HTTPS for production domains. Your domain must use HTTPS.'
    });
  }

  if (isLocalhost) {
    domainInfo.recommendations.push({
      type: 'info',
      message: 'You\'re using localhost. Make sure http://localhost:5173 and http://localhost:3000 are added to authorized JavaScript origins.'
    });
  }

  return domainInfo;
};

export const formatDomainReport = (domainInfo) => {
  let report = `🌐 Domain Authorization Report\n`;
  report += `Current Domain: ${domainInfo.currentDomain}\n`;
  report += `Is Localhost: ${domainInfo.isLocalhost}\n`;
  report += `Is Fly.dev: ${domainInfo.isFlyDev}\n`;
  report += `Is HTTPS: ${domainInfo.isHTTPS}\n`;
  report += `Is Production: ${domainInfo.isProduction}\n\n`;
  
  report += `📋 Required domains for Google Cloud Console:\n`;
  domainInfo.requiredDomains.forEach((domain, index) => {
    report += `${index + 1}. ${domain}\n`;
  });
  
  if (domainInfo.recommendations.length > 0) {
    report += `\n💡 Recommendations:\n`;
    domainInfo.recommendations.forEach((rec, index) => {
      const icon = rec.type === 'error' ? '❌' : rec.type === 'warning' ? '⚠️' : 'ℹ️';
      report += `${index + 1}. ${icon} ${rec.message}\n`;
    });
  }
  
  return report;
};
