/**
 * Error handler to catch loading issues before React mounts.
 */
window.addEventListener('error', function(event) {
  const errorMessage = event.message || 'Terjadi kesalahan yang tidak diketahui';
  const errorSource = event.filename || 'Source unknown';
  
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0a0a0a; color: #E0E6ED; margin: 0; padding: 20px;">
        <div style="max-width: 600px; text-align: center; background: #1A1E26; padding: 40px; border-radius: 12px; border: 1px solid #2D3748;">
          <div style="font-size: 32px; margin-bottom: 20px;">⚠️</div>
          <h2 style="color: #E74C3C; font-size: 20px; margin: 0 0 20px 0; text-transform: uppercase; font-weight: bold; letter-spacing: 2px;">Error Deteksi Sistem</h2>
          
          <p style="color: #94A3B8; font-size: 14px; margin: 0 0 20px 0; line-height: 1.6;">
            Dashboard mengalami kesalahan saat loading. Mohon periksa:
          </p>
          
          <ul style="text-align: left; color: #94A3B8; font-size: 13px; margin: 0 0 20px 0; line-height: 2; padding: 0 20px;">
            <li>✓ Koneksi internet stabil dan aktif</li>
            <li>✓ Browser support ES6+ Module</li>
            <li>✓ Firebase configuration sudah ter-setup</li>
          </ul>
          
          <div style="background: #0F1218; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 3px solid #F37021; text-align: left;">
            <p style="color: #F37021; font-family: 'JetBrains Mono', monospace; font-size: 11px; word-break: break-all; margin: 0;">
              💥 ${errorMessage}
            </p>
            <p style="color: #94A3B8; font-family: 'JetBrains Mono', monospace; font-size: 10px; margin: 10px 0 0 0; opacity: 0.6;">
              📍 ${errorSource}
            </p>
          </div>
          
          <button id="error-reload-btn" style="background: #F37021; color: white; border: none; padding: 12px 32px; border-radius: 6px; font-weight: bold; text-transform: uppercase; cursor: pointer; font-size: 12px; letter-spacing: 1.5px; transition: all 0.3s ease; margin-bottom: 15px;">
            ↻ Muat Ulang Halaman
          </button>
          
          <p style="color: #94A3B8; font-size: 11px; margin: 0; opacity: 0.5; text-transform: uppercase; letter-spacing: 1px;">
            Hubungi IT Administrator jika masalah berlanjut
          </p>
        </div>
      </div>
    `;

    // Use event listener instead of inline onclick to prevent CSP violations
    const reloadBtn = document.getElementById('error-reload-btn');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', () => {
        window.location.reload();
      });
    }
  }
});

// Environment logging
(function() {
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (!isDev) {
    console.log('[BIZCON] Environment: Production');
    console.log('[BIZCON] Pathname: ' + window.location.pathname);
  }
})();
