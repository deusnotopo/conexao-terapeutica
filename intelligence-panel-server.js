const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8787;
const ROOT = __dirname;
const OUTPUT_DIR = path.join(ROOT, 'output');
const DASHBOARD_FILE = path.join(ROOT, 'painel-douglas-riedlinger.html');

const jobs = {
  radar: { running: false, lastRun: null, exitCode: null, log: '', error: '' },
  maps: { running: false, lastRun: null, exitCode: null, log: '', error: '' },
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data, null, 2));
}

function sendFile(res, filePath, contentType = 'text/html; charset=utf-8') {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendJson(res, 404, { error: 'Arquivo não encontrado', filePath });
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function parseCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf-8').trim();
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = cols[index] ?? '';
    });
    return row;
  });
}

function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function runPythonJob(jobName, scriptPath, args) {
  return new Promise((resolve) => {
    if (jobs[jobName].running) {
      resolve({ ok: false, message: `Job ${jobName} já está em execução.` });
      return;
    }

    jobs[jobName] = {
      running: true,
      lastRun: new Date().toISOString(),
      exitCode: null,
      log: '',
      error: '',
    };

    const child = spawn('python', [scriptPath, ...args], {
      cwd: ROOT,
      windowsHide: true,
    });

    child.stdout.on('data', (data) => {
      jobs[jobName].log += data.toString();
    });

    child.stderr.on('data', (data) => {
      jobs[jobName].error += data.toString();
    });

    child.on('close', (code) => {
      jobs[jobName].running = false;
      jobs[jobName].exitCode = code;
    });

    child.on('error', (error) => {
      jobs[jobName].running = false;
      jobs[jobName].exitCode = -1;
      jobs[jobName].error += String(error);
    });

    resolve({ ok: true, message: `Job ${jobName} iniciado.` });
  });
}

function buildOverview() {
  const radarFile = path.join(OUTPUT_DIR, 'radar_social.csv');
  const mapsFile = path.join(OUTPUT_DIR, 'leads_sp.csv');
  const radarRows = parseCsv(radarFile);
  const mapsRows = parseCsv(mapsFile);

  return {
    jobs,
    files: {
      radar: {
        path: radarFile,
        exists: fs.existsSync(radarFile),
        count: radarRows.length,
        updatedAt: fs.existsSync(radarFile) ? fs.statSync(radarFile).mtime.toISOString() : null,
      },
      maps: {
        path: mapsFile,
        exists: fs.existsSync(mapsFile),
        count: mapsRows.length,
        updatedAt: fs.existsSync(mapsFile) ? fs.statSync(mapsFile).mtime.toISOString() : null,
      },
    },
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/painel')) {
    sendFile(res, DASHBOARD_FILE);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/overview') {
    sendJson(res, 200, buildOverview());
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/leads/radar') {
    sendJson(res, 200, { rows: parseCsv(path.join(OUTPUT_DIR, 'radar_social.csv')) });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/leads/maps') {
    sendJson(res, 200, { rows: parseCsv(path.join(OUTPUT_DIR, 'leads_sp.csv')) });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/run/radar') {
    const body = await collectBody(req).catch(() => null);
    if (body === null) {
      sendJson(res, 400, { ok: false, error: 'JSON inválido.' });
      return;
    }
    const keywords = Array.isArray(body.keywords) ? body.keywords.filter(Boolean) : [];
    const maxPorConsulta = Number(body.maxPorConsulta || 8);
    const args = ['tools/radar_demanda_social.py', '--saida', 'output/radar_social.csv', '--max-por-consulta', String(maxPorConsulta)];
    if (keywords.length) {
      args.push('--keywords', ...keywords);
    }
    const result = await runPythonJob('radar', args[0], args.slice(1));
    sendJson(res, result.ok ? 200 : 409, result);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/run/maps') {
    const body = await collectBody(req).catch(() => null);
    if (body === null) {
      sendJson(res, 400, { ok: false, error: 'JSON inválido.' });
      return;
    }
    const cidade = String(body.cidade || 'Sao Paulo SP').trim();
    const maxPorBusca = Number(body.maxPorBusca || 8);
    const args = ['tools/prospeccao_leads.py', '--cidade', cidade, '--max-por-busca', String(maxPorBusca), '--saida', 'output/leads_sp.csv'];
    const result = await runPythonJob('maps', args[0], args.slice(1));
    sendJson(res, result.ok ? 200 : 409, result);
    return;
  }

  sendJson(res, 404, { error: 'Rota não encontrada', path: url.pathname });
});

server.listen(PORT, () => {
  console.log(`Painel Douglas Riedlinger disponível em http://localhost:${PORT}/painel`);
});