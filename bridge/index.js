import express from 'express';

const app = express();
app.use(express.json());

const SECRET = process.env.BRIDGE_SECRET || 'anan0712';
let queue = [];
let waiters = [];

app.post('/cmd', (req, res) => {
  const { secret, cmd } = req.body;
  if (secret !== SECRET) return res.status(403).json({ error: 'denied' });
  if (cmd === 'status') return res.json({ online: true });
  queue.push(cmd);
  while (waiters.length) waiters.shift()(queue.shift());
  res.json({ ok: true });
});

app.get('/toy-next', async (req, res) => {
  if (req.query.secret !== SECRET) return res.status(403).json({ error: 'denied' });
  if (queue.length) return res.json({ cmd: queue.shift() });
  await new Promise(r => waiters.push(r));
  res.json({ cmd: queue.shift() || { action: 'noop' } });
});
app.get('/send', (req, res) => {
    if (req.query.secret !== SECRET) return res.status(403).json({ error: 'denied' });
    const cmd = {};
    if (req.query.speed !== undefined) cmd.speed = parseFloat(req.query.speed);
    if (req.query.pattern !== undefined) cmd.pattern = parseInt(req.query.pattern);
    if (req.query.level !== undefined) cmd.level = parseFloat(req.query.level);
    if (req.query.stop !== undefined) cmd.stop = true;
    if (req.query.sec !== undefined) cmd.sec = parseFloat(req.query.sec);
    if (req.query.clap !== undefined) cmd.clap = parseInt(req.query.clap);
    if (req.query.heat !== undefined) cmd.heat = req.query.heat === 'true';
    if (Object.keys(cmd).length === 0) return res.json({ online: true });
    queue.push(cmd);
    while (waiters.length) waiters.shift()(queue.shift());
    res.json({ ok: true, cmd });
});

app.get('/mcp', (req, res) => {
  res.json({
    tools: [
      { name: 'toy_set_speed', description: 'Set intensity 0-100' },
      { name: 'toy_set_pattern', description: 'Vibration pattern 1-8, level 1-5' },
      { name: 'toy_stop', description: 'Stop immediately' },
      { name: 'toy_status', description: 'Check if relay is online' }
    ]
  });
});

app.listen(process.env.PORT || 3000, () => console.log('bridge running'));

