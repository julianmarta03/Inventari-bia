// Proxy a Metabase (card 18021 · inventario completo con vencimientos de
// certificación) para el Módulo de Vencidos (certcontrol.html).
//
//   · serial '*' o vacío  -> consulta el card SIN parámetros y devuelve TODO el
//     inventario. Es lo que usa ccLoad() para poblar el módulo en vivo.
//   · serial específico    -> filtra del lado del servidor por ese serial. Es lo
//     que usa ccLive() para refrescar un equipo puntual.
//
// La API key se guarda de forma segura en Vercel (variable de entorno
// MB_API_KEY) y nunca se expone al navegador, igual que api/metabase.js.
//
// Si la consulta falla (sin key, Metabase caído, etc.) se devuelve un código de
// error; el cliente cae con elegancia al snapshot del repo (mb-data.json) sin
// romper nada.

const MB_CARD_URL = 'https://bia.metabaseapp.com/api/card/18021/query/json';

// Extrae el serial de una fila cruda de Metabase tolerando alias de columna.
function rowSerial(r) {
  for (const k of ['serial', 'Serial', 'serial_number', 'Serial Number', 'numero_serie', 'serie', 'Serie']) {
    if (r && r[k] != null && String(r[k]).trim() !== '') return String(r[k]).trim();
  }
  return '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  // API Key guardada de forma segura en Vercel - nunca expuesta al navegador
  const apiKey = process.env.MB_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API Key no configurada en el servidor' });

  const serial = (req.body || {}).serial;

  try {
    const response = await fetch(MB_CARD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      // Sin parámetros: el card 18021 devuelve el inventario completo.
      body: JSON.stringify({ parameters: [] })
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      return res.status(response.status).json({
        error: 'Metabase respondió ' + response.status,
        detail: detail.slice(0, 500)
      });
    }

    const data = await response.json();
    const rows = Array.isArray(data) ? data : [];

    // serial específico (no '*') -> filtra del lado del servidor.
    if (serial && serial !== '*') {
      const target = String(serial).trim();
      return res.status(200).json(rows.filter(r => rowSerial(r) === target));
    }

    return res.status(200).json(rows);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
