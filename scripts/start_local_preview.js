const express = require('express');
const path = require('path');
const qr = require('qr-image');
const app = express();
const workspaceRoot = path.resolve(__dirname, '..');

const settings = require(path.join(workspaceRoot, 'lib/settings'));
const pkg = require(path.join(workspaceRoot, 'package.json'));
settings.explorer_version = pkg.version;
settings.revision = '';

// Ensure panels are configured for full visual demonstration
settings.panel1 = 'network_panel';
settings.panel2 = 'difficulty_panel';
settings.panel3 = 'logo_panel';
settings.panel4 = 'coin_supply_panel';
settings.panel5 = 'masternodes_panel';

app.set('views', path.join(workspaceRoot, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(workspaceRoot, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const commonLocals = {
  settings: settings,
  showSync: false,
  customHash: Date.now(),
  styleHash: Date.now(),
  themeHash: Date.now(),
  market_currency: 'USD',
  labels: settings.labels || {}
};

// QR Code route
app.get('/qr/:string', (req, res) => {
  const code = qr.image(req.params.string, { type: 'png' });
  res.type('png');
  code.pipe(res);
});

// Search redirect
app.post('/search', (req, res) => {
  const query = (req.body && req.body.search ? req.body.search.trim() : '');
  if (!query) return res.redirect('/');
  if (query.length === 64) {
    if (query.startsWith('0000')) return res.redirect('/block/' + query);
    return res.redirect('/tx/' + query);
  }
  if (!isNaN(query)) return res.redirect('/block/' + query);
  return res.redirect('/address/' + query);
});

// API /ext endpoints used by frontend JS
app.get('/ext/getsummary', (req, res) => {
  res.json({
    difficulty: '142.8459',
    difficultyHybrid: '',
    hashrate: '25.68',
    supply: '12,500,450.00',
    blockcount: 148520,
    connections: 32,
    masternodeCountOnline: 142,
    masternodeCountOffline: 4,
    lastPrice: '0.045',
    lastUSDPrice: '0.045',
    marketCap: '562520.25',
    usdMarketCap: '562520.25'
  });
});

app.get('/ext/getlastupdated/:type', (req, res) => {
  res.json({ last_updated_date: Math.floor(Date.now() / 1000) });
});

app.get('/ext/getlasttxs/:index/:count/internal', (req, res) => {
  const count = parseInt(req.params.count) || 10;
  const data = [];
  for (let i = 0; i < count; i++) {
    const blockIndex = 148520 - i;
    data.push([
      blockIndex,
      '000000000001a4bc589de67f18320498efc' + (1000 + i),
      '8f9c4b2a8d3e1109ff62e5c83b4a221f7e0984' + (2000 + i),
      Math.floor(Math.random() * 5) + 1,
      (Math.random() * 250 + 10).toFixed(8),
      Math.floor(Date.now() / 1000) - (i * 120),
      'algo:sha256d',
      'extracted_by:[{"a_id":"KSH1qxyz79824jklm90123456789abcdef0123","claimname":"MiningPool-EU"}]'
    ]);
  }
  res.json({
    data: data,
    recordsTotal: 148520,
    recordsFiltered: 148520
  });
});

app.get('/ext/getaddresstxs/:hash/:start/:length/internal', (req, res) => {
  const length = parseInt(req.params.length) || 10;
  const data = [];
  let balance = 12500.50;
  for (let i = 0; i < length; i++) {
    const isCredit = i % 2 === 0;
    const amount = (Math.random() * 50 + 5).toFixed(8);
    balance = isCredit ? balance + parseFloat(amount) : balance - parseFloat(amount);
    data.push([
      Math.floor(Date.now() / 1000) - (i * 3600),
      '5e2b8c91a03f44d8b9e67123aa4f8c901234' + (3000 + i),
      balance.toFixed(8),
      amount,
      isCredit ? '+' : '-',
      isCredit ? 'table-success' : 'table-danger'
    ]);
  }
  res.json({
    data: data,
    recordsTotal: 150,
    recordsFiltered: 150
  });
});

app.get('/ext/getmasternodelist', (req, res) => {
  const list = [];
  const statuses = ['ENABLED', 'ENABLED', 'ENABLED', 'PRE_ENABLED', 'EXPIRED'];
  for (let i = 1; i <= 25; i++) {
    list.push({
      rank: i,
      network: 'ipv4',
      status: statuses[i % statuses.length],
      addr: 'KSH1qmasternodeaddr' + (100 + i) + 'xyz789',
      claim_name: i === 1 ? 'Core-Node-Alpha' : (i === 2 ? 'StakingHub-01' : ''),
      version: 70216,
      lastseen: Math.floor(Date.now() / 1000) - (i * 45),
      activetime: 86400 * i + 3600,
      lastpaid: Math.floor(Date.now() / 1000) - (i * 900),
      last_paid_block: 148520 - (i * 12),
      ip_address: `198.51.100.${i}:9776`
    });
  }
  res.json(list);
});

app.get('/ext/getnetworkpeers/internal', (req, res) => {
  const peers = [];
  const countries = [
    { country: 'Germany', code: 'DE' },
    { country: 'United States', code: 'US' },
    { country: 'Singapore', code: 'SG' },
    { country: 'Finland', code: 'FI' },
    { country: 'United Kingdom', code: 'GB' },
    { country: 'Canada', code: 'CA' }
  ];
  for (let i = 1; i <= 20; i++) {
    const c = countries[i % countries.length];
    peers.push({
      address: `185.220.101.${i}`,
      port: 9776,
      protocol: 70216,
      version: '/KorshCore:1.2.0/',
      country: c.country,
      country_code: c.code
    });
  }
  res.json({
    connection_peers: peers
  });
});

// Front-end Views
app.get('/', (req, res) => {
  res.render('index', {
    ...commonLocals,
    active: 'home',
    error: null,
    last_updated: Math.floor(Date.now() / 1000),
    page_title_prefix: settings.coin.name + ' Block Explorer'
  });
});

app.get('/block/:hash', (req, res) => {
  const block = {
    hash: req.params.hash || '000000000001a4bc589de67f18320498efc1234567890abcdef',
    height: 148520,
    time: Math.floor(Date.now() / 1000) - 300,
    difficulty: '142.8459',
    size: '42.50',
    bits: '1b03a4c1',
    nonce: 384729104,
    confirmations: 15,
    previousblockhash: '000000000001a4bc589de67f18320498efc1234567890abcdee',
    nextblockhash: '000000000001a4bc589de67f18320498efc1234567890abcdf0'
  };
  const txs = [
    {
      txid: '9f8b7c6d5e4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c',
      vin: [{ addresses: 'coinbase', amount: 5000000000 }],
      vout: [{ addresses: 'KSH1qmineraddress789abcdef0123456789', amount: 5000000000 }],
      total: '50.00000000',
      totalFixed: '50.00'
    },
    {
      txid: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      vin: [{ addresses: 'KSH1qsenderaddress111111111111111111', amount: 2500000000, amountFixed: '25.00' }],
      vout: [
        { addresses: 'KSH1qrecipientaddress2222222222222222', amount: 2000000000 },
        { addresses: 'KSH1qchangeaddress333333333333333333', amount: 49990000 }
      ],
      total: '25.00000000',
      totalFixed: '25.00'
    }
  ];
  res.render('block', {
    ...commonLocals,
    active: 'block',
    block: block,
    orphan: false,
    confirmations: 40,
    txs: txs,
    extracted_by_addresses: [{ a_id: 'KSH1qmineraddress789abcdef0123456789', claimname: 'Main-Mining-Pool' }],
    page_title_prefix: settings.coin.name + ' Block 148520'
  });
});

app.get('/tx/:txid', (req, res) => {
  const tx = {
    txid: req.params.txid || '8f9c4b2a8d3e1109ff62e5c83b4a221f7e09842000deadbeef123456',
    blockhash: '000000000001a4bc589de67f18320498efc1234567890abcdef',
    blockindex: 148520,
    timestamp: Math.floor(Date.now() / 1000) - 600,
    op_return: '',
    vin: [
      { addresses: 'KSH1qwalletAlpha9876543210fedcba987654', amount: 1500000000, amountFixed: '15.00000000', claim_name: 'StakingRewards' }
    ],
    vout: [
      { addresses: 'KSH1qwalletBeta1234567890abcdef123456', amount: 1450000000, claim_name: 'ColdStorageVault' },
      { addresses: 'KSH1qwalletChange5555555555555555555', amount: 49900000, claim_name: '' }
    ]
  };
  res.render('tx', {
    ...commonLocals,
    active: 'tx',
    tx: tx,
    confirmations: 40,
    blockcount: 148520,
    orphan: false,
    extracted_by_addresses: [],
    page_title_prefix: settings.coin.name + ' Transaction ' + tx.txid.substring(0, 10)
  });
});

app.get('/address/:hash', (req, res) => {
  const addr = {
    a_id: req.params.hash || 'KSH1qgenesisaddress0000000000000000000000000000'
  };
  res.render('address', {
    ...commonLocals,
    active: 'address',
    address: addr,
    balance: '125000.45000000',
    sent: '350000.00000000',
    received: '475000.45000000',
    claim_name: 'Korsh Foundation Treasury',
    page_title_prefix: settings.coin.name + ' Address ' + addr.a_id.substring(0, 10)
  });
});

app.get('/richlist', (req, res) => {
  const balance = [];
  const received = [];
  for (let i = 1; i <= 100; i++) {
    const bal = (1000000 / (i * 0.8)).toFixed(8);
    balance.push({
      a_id: 'KSH1qtoprichaddress' + i + 'abcdef1234567890',
      balance: bal,
      claim_name: i === 1 ? 'Genesis Treasury' : (i === 2 ? 'Binance Cold' : (i === 3 ? 'Korsh Staking Pool' : ''))
    });
    received.push({
      a_id: 'KSH1qtoprichaddress' + i + 'abcdef1234567890',
      received: (parseFloat(bal) * 1.5).toFixed(8),
      claim_name: i === 1 ? 'Genesis Treasury' : ''
    });
  }
  res.render('richlist', {
    ...commonLocals,
    active: 'richlist',
    balance: balance,
    received: received,
    burned: { total: '150000', totalFixed: '150,000', percentFixed: '1.20' },
    stats: { supply: 12500450 },
    dista: { total: '4500000', totalFixed: '4,500,000', percentFixed: '36.00' },
    distb: { total: '2500000', totalFixed: '2,500,000', percentFixed: '20.00' },
    distc: { total: '1800000', totalFixed: '1,800,000', percentFixed: '14.40' },
    distd: { total: '1200000', totalFixed: '1,200,000', percentFixed: '9.60' },
    diste: { total: '2500450', totalFixed: '2,500,450', percentFixed: '20.00' },
    last_updated: Math.floor(Date.now() / 1000),
    page_title_prefix: settings.coin.name + ' Rich List'
  });
});

app.get('/masternodes', (req, res) => {
  res.render('masternodes', {
    ...commonLocals,
    active: 'masternodes',
    page_title_prefix: settings.coin.name + ' Masternodes'
  });
});

app.get('/network', (req, res) => {
  res.render('network', {
    ...commonLocals,
    active: 'network',
    last_updated: Math.floor(Date.now() / 1000),
    page_title_prefix: settings.coin.name + ' Network'
  });
});

app.get('/movement', (req, res) => {
  res.render('movement', {
    ...commonLocals,
    active: 'movement',
    page_title_prefix: settings.coin.name + ' Coin Movement'
  });
});

app.get('/claim', (req, res) => {
  res.render('claim_address', {
    ...commonLocals,
    active: 'claim-address',
    hash: 'KSH1qdemoclaimaddress1234567890abcdef',
    claim_name: 'Demo Owner',
    page_title_prefix: 'Claim Address'
  });
});

app.get('/claim/:hash', (req, res) => {
  res.render('claim_address', {
    ...commonLocals,
    active: 'claim-address',
    hash: req.params.hash,
    claim_name: '',
    page_title_prefix: 'Claim Address'
  });
});

app.get('/info', (req, res) => {
  res.render('info', {
    ...commonLocals,
    active: 'info',
    address: 'localhost:' + PORT,
    pluginApisExt: [],
    page_title_prefix: settings.coin.name + ' Public API'
  });
});

app.get('/error', (req, res) => {
  res.render('error', {
    ...commonLocals,
    active: 'error',
    page_title_prefix: 'Error 404',
    error: 'The requested resource was not found on this blockchain explorer.'
  });
});

const PORT = process.env.PORT || settings.webserver.port || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`================================================================`);
  console.log(`  KORSH BLOCK EXPLORER - SERVIDOR LOCAL ACTIVO`);
  console.log(`  URL Local:   http://localhost:${PORT}`);
  console.log(`  URL Red:     http://127.0.0.1:${PORT}`);
  console.log(`================================================================`);
});
