// Proxy a Metabase (card 18922 · búsqueda de un equipo por serial) usado por el
// panel WMS del pistoleo en index.html.
//
// La API key se guarda de forma segura en Vercel (variable de entorno
// MB_API_KEY) y nunca se expone al navegador; el cliente solo envía el serial.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { serial } = req.body || {};
  if (!serial) return res.status(400).json({ error: 'Falta el serial' });

  // API Key guardada de forma segura en Vercel - nunca expuesta al navegador
  const apiKey = process.env.MB_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API Key no configurada en el servidor' });

  try {
    const response = await fetch('https://bia.metabaseapp.com/api/card/18922/query/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        parameters: [
          {
            type: 'category',
            target: ['variable', ['template-tag', 'serial']],
            value: serial
          }
        ]
      })
    });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
