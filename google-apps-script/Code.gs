/**
 * Blue Lily Pretoria East OTP Transaction Tracker Backend
 *
 * Transaction Sheet:
 * https://docs.google.com/spreadsheets/d/15VXtcZTey2Ml1jl0tLakFm8F5ImSpvsRgKmtjVmrn2g/edit
 *
 * Agent Data Sheet:
 * https://docs.google.com/spreadsheets/d/1OcpmU2rveF1s633NCvCy9BsZN--44lKocjqYSAx5wAY/edit
 *
 * Deploy as Web App:
 * Execute as: Me
 * Who has access: Anyone
 */

const SPREADSHEET_ID = '15VXtcZTey2Ml1jl0tLakFm8F5ImSpvsRgKmtjVmrn2g';
const AGENTS_SPREADSHEET_ID = '1OcpmU2rveF1s633NCvCy9BsZN--44lKocjqYSAx5wAY';

const SHEET_NAME = 'OTP Tracker';
const SETTINGS_SHEET_NAME = 'Settings';

const STATUSES = [
  'Offer Accepted',
  'Submitted to Attorneys',
  'FICA and Supporting Docs Outstanding',
  'Seller Docs Signed',
  'Purchaser Docs Signed',
  'Bond Application Submitted',
  'Bond Approved',
  'Cash Paid / Guarantees Requested',
  'Guarantees Issued',
  'COC Needed',
  'COC Booked',
  'COC Received',
  'Rates Clearance Requested',
  'Rates Clearance Received',
  'Levy Clearance Requested',
  'Levy Clearance Received',
  'Transfer Duty Requested',
  'Transfer Duty Receipt Received',
  'Prep',
  'Lodged',
  'Registered',
  'Paid Out',
  'Cancelled'
];

const HEADERS = [
  'Timestamp',
  'Updated At',
  'Reference Number',
  'Status',
  'Stage Index',
  'Property Address',
  'Suburb',
  'Seller Name',
  'Seller Contact',
  'Purchaser Name',
  'Purchaser Contact',
  'Sales Price',
  'Commission Amount',
  'Commission Percentage',

  'Agent 1 Name',
  'Agent 1 Email',
  'Agent 1 Number',
  'Agent 1 FFC',
  'Agent 1 Deal Share %',
  'Agent 1 Agent Split %',
  'Agent 1 Office Split %',
  'Agent 1 Gross Commission',
  'Agent 1 Agent Income',
  'Agent 1 Office Income',

  'Agent 2 Name',
  'Agent 2 Email',
  'Agent 2 Number',
  'Agent 2 FFC',
  'Agent 2 Deal Share %',
  'Agent 2 Agent Split %',
  'Agent 2 Office Split %',
  'Agent 2 Gross Commission',
  'Agent 2 Agent Income',
  'Agent 2 Office Income',

  'Agent 3 Name',
  'Agent 3 Email',
  'Agent 3 Number',
  'Agent 3 FFC',
  'Agent 3 Deal Share %',
  'Agent 3 Agent Split %',
  'Agent 3 Office Split %',
  'Agent 3 Gross Commission',
  'Agent 3 Agent Income',
  'Agent 3 Office Income',

  'Total Deal Share %',
  'Total Agent Gross Commission',
  'Total Agent Income',
  'Total Office Income',
  'Unallocated Commission',
  'Company Income',
  'Company Income %',

  'COC Needed',
  'COC Electrical',
  'COC Gas',
  'COC Electric Fence',
  'COC Beetle/Wood Borer',
  'COC Plumbing',
  'COC Solar',
  'Conveyancer',
  'Conveyancer Contact',
  'Bond Bank',
  'Bond Amount',
  'OTP Date',
  'Expected Registration Date',
  'Next Action',
  'Next Action Date',
  'Notes',
  'Created By',
  'Last Edited By',
  'Branch'
];

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const action = params.action || 'list';
  let result;

  try {
    if (action === 'setup') {
      result = setup_();
    } else if (action === 'list') {
      result = listRecords_();
    } else if (action === 'get') {
      result = getRecord_(params.referenceNumber || '');
    } else if (action === 'nextRef') {
      result = { success: true, referenceNumber: makeNextReference_() };
    } else if (action === 'statusOptions') {
      result = { success: true, statuses: STATUSES };
    } else if (action === 'listAgents') {
      result = listAgents_();
    } else {
      result = { success: false, error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = {
      success: false,
      error: String(err && err.message ? err.message : err)
    };
  }

  return output_(result, params.callback);
}

function doPost(e) {
  let data = {};

  try {
    data = parsePostData_(e);
    const action = data.action || 'save';
    let result;

    if (action === 'save') {
      result = saveRecord_(data);
    } else if (action === 'setup') {
      result = setup_();
    } else {
      result = { success: false, error: 'Unknown action: ' + action };
    }

    return output_(result);
  } catch (err) {
    return output_({
      success: false,
      error: String(err && err.message ? err.message : err)
    });
  }
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getAgentsSpreadsheet_() {
  return SpreadsheetApp.openById(AGENTS_SPREADSHEET_ID);
}

function parsePostData_(e) {
  const data = {};

  if (e && e.parameter) {
    Object.keys(e.parameter).forEach(function (key) {
      data[key] = e.parameter[key];
    });
  }

  const contents = e && e.postData && e.postData.contents
    ? e.postData.contents
    : '';

  if (contents && contents.trim().charAt(0) === '{') {
    const parsed = JSON.parse(contents);
    Object.keys(parsed).forEach(function (key) {
      data[key] = parsed[key];
    });
  }

  return data;
}

function setup_() {
  const ss = getSpreadsheet_();
  const sheet = getOrCreateSheet_();

  ensureHeaders_(sheet);

  let settings = ss.getSheetByName(SETTINGS_SHEET_NAME);

  if (!settings) {
    settings = ss.insertSheet(SETTINGS_SHEET_NAME);
  }

  settings.clear();
  settings.getRange(1, 1, 1, 2).setValues([['Setting', 'Value']]);
  settings
    .getRange(2, 1, STATUSES.length, 2)
    .setValues(STATUSES.map(function (status, index) {
      return ['Status ' + (index + 1), status];
    }));

  settings.autoResizeColumns(1, 2);

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, Math.min(HEADERS.length, 25));

  return {
    success: true,
    message: 'Blue Lily Pretoria East OTP Tracker sheet setup complete.',
    spreadsheetId: SPREADSHEET_ID,
    agentSpreadsheetId: AGENTS_SPREADSHEET_ID,
    sheetName: SHEET_NAME,
    headers: HEADERS,
    statuses: STATUSES,
    agents: listAgents_().agents
  };
}

function getOrCreateSheet_() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  return sheet;
}

function ensureHeaders_(sheet) {
  const currentLastColumn = Math.max(sheet.getLastColumn(), HEADERS.length);

  const current = sheet
    .getRange(1, 1, 1, currentLastColumn)
    .getValues()[0]
    .filter(String);

  const missing = HEADERS.filter(function (header) {
    return current.indexOf(header) === -1;
  });

  if (current.length === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  } else if (missing.length) {
    sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
  }

  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  headerRange
    .setFontWeight('bold')
    .setBackground('#07111f')
    .setFontColor('#ffffff');
}

function getHeaderMap_(sheet) {
  ensureHeaders_(sheet);

  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0];

  const map = {};

  headers.forEach(function (header, index) {
    if (header) {
      map[header] = index;
    }
  });

  return {
    headers: headers,
    map: map
  };
}

function saveRecord_(input) {
  const sheet = getOrCreateSheet_();
  const hm = getHeaderMap_(sheet);
  const headers = hm.headers;
  const map = hm.map;

  const referenceNumber =
    String(input.referenceNumber || input['Reference Number'] || '').trim() ||
    makeNextReference_();

  const existingRow = findRowByReference_(sheet, referenceNumber, map);
  const now = new Date();

  const salesPrice = parseNumber_(input.salesPrice || input['Sales Price']);

  let commissionAmount = parseNumber_(
    input.commissionAmount || input['Commission Amount']
  );

  let commissionPercentage = parseNumber_(
    input.commissionPercentage || input['Commission Percentage']
  );

  if (!commissionAmount && salesPrice && commissionPercentage) {
    commissionAmount = (salesPrice * commissionPercentage) / 100;
  }

  if (!commissionPercentage && salesPrice && commissionAmount) {
    commissionPercentage = (commissionAmount / salesPrice) * 100;
  }

  const status = String(input.status || input['Status'] || STATUSES[0]).trim();
  const stageIndex = Math.max(0, STATUSES.indexOf(status)) + 1;

  const existingValues = existingRow
    ? sheet.getRange(existingRow, 1, 1, headers.length).getValues()[0]
    : [];

  const agents = listAgents_().agents || [];
  const agentRows = [];
  let totalDealShare = 0;
  let totalAgentGross = 0;
  let totalAgentIncome = 0;
  let totalOfficeIncome = 0;

  for (let i = 1; i <= 3; i++) {
    const data = resolveTransactionAgent_(input, i, agents);
    const dealSharePct = data.dealSharePct;
    let agentSplitPct = data.agentSplitPct;
    let officeSplitPct = data.officeSplitPct;

    if (!agentSplitPct && officeSplitPct) {
      agentSplitPct = 100 - officeSplitPct;
    }

    if (!officeSplitPct && agentSplitPct) {
      officeSplitPct = 100 - agentSplitPct;
    }

    const grossCommission = commissionAmount * dealSharePct / 100;
    const agentIncome = grossCommission * agentSplitPct / 100;
    const officeIncome = grossCommission - agentIncome;

    totalDealShare += dealSharePct;
    totalAgentGross += grossCommission;
    totalAgentIncome += agentIncome;
    totalOfficeIncome += officeIncome;

    agentRows.push({
      index: i,
      name: data.name,
      email: data.email,
      number: data.number,
      ffc: data.ffc,
      dealSharePct: dealSharePct,
      agentSplitPct: agentSplitPct,
      officeSplitPct: officeSplitPct,
      grossCommission: grossCommission,
      agentIncome: agentIncome,
      officeIncome: officeIncome
    });
  }

  const unallocatedCommission = commissionAmount - totalAgentGross;
  const companyIncome = commissionAmount - totalAgentIncome;
  const companyIncomePct = commissionAmount ? (companyIncome / commissionAmount) * 100 : 0;

  const rowObj = {
    'Timestamp': existingRow ? existingValues[map['Timestamp']] : now,
    'Updated At': now,
    'Reference Number': referenceNumber,
    'Status': status,
    'Stage Index': stageIndex,
    'Property Address': clean_(input.propertyAddress || input['Property Address']),
    'Suburb': clean_(input.suburb || input['Suburb']),
    'Seller Name': clean_(input.sellerName || input['Seller Name']),
    'Seller Contact': clean_(input.sellerContact || input['Seller Contact']),
    'Purchaser Name': clean_(input.purchaserName || input['Purchaser Name']),
    'Purchaser Contact': clean_(input.purchaserContact || input['Purchaser Contact']),
    'Sales Price': round2_(salesPrice),
    'Commission Amount': round2_(commissionAmount),
    'Commission Percentage': round4_(commissionPercentage),

    'Total Deal Share %': round4_(totalDealShare),
    'Total Agent Gross Commission': round2_(totalAgentGross),
    'Total Agent Income': round2_(totalAgentIncome),
    'Total Office Income': round2_(totalOfficeIncome),
    'Unallocated Commission': round2_(unallocatedCommission),
    'Company Income': round2_(companyIncome),
    'Company Income %': round4_(companyIncomePct),

    'COC Needed': clean_(input.cocNeeded || input['COC Needed']),
    'COC Electrical': yes_(input.cocElectrical || input['COC Electrical']),
    'COC Gas': yes_(input.cocGas || input['COC Gas']),
    'COC Electric Fence': yes_(input.cocElectricFence || input['COC Electric Fence']),
    'COC Beetle/Wood Borer': yes_(input.cocBeetle || input['COC Beetle/Wood Borer']),
    'COC Plumbing': yes_(input.cocPlumbing || input['COC Plumbing']),
    'COC Solar': yes_(input.cocSolar || input['COC Solar']),
    'Conveyancer': clean_(input.conveyancer || input['Conveyancer']),
    'Conveyancer Contact': clean_(input.conveyancerContact || input['Conveyancer Contact']),
    'Bond Bank': clean_(input.bondBank || input['Bond Bank']),
    'Bond Amount': round2_(parseNumber_(input.bondAmount || input['Bond Amount'])),
    'OTP Date': clean_(input.otpDate || input['OTP Date']),
    'Expected Registration Date': clean_(input.expectedRegistrationDate || input['Expected Registration Date']),
    'Next Action': clean_(input.nextAction || input['Next Action']),
    'Next Action Date': clean_(input.nextActionDate || input['Next Action Date']),
    'Notes': clean_(input.notes || input['Notes']),
    'Created By': clean_(input.createdBy || input['Created By']),
    'Last Edited By': clean_(input.lastEditedBy || input['Last Edited By']),
    'Branch': 'Blue Lily Pretoria East'
  };

  agentRows.forEach(function (agent) {
    rowObj['Agent ' + agent.index + ' Name'] = agent.name;
    rowObj['Agent ' + agent.index + ' Email'] = agent.email;
    rowObj['Agent ' + agent.index + ' Number'] = agent.number;
    rowObj['Agent ' + agent.index + ' FFC'] = agent.ffc;
    rowObj['Agent ' + agent.index + ' Deal Share %'] = round4_(agent.dealSharePct);
    rowObj['Agent ' + agent.index + ' Agent Split %'] = round4_(agent.agentSplitPct);
    rowObj['Agent ' + agent.index + ' Office Split %'] = round4_(agent.officeSplitPct);
    rowObj['Agent ' + agent.index + ' Gross Commission'] = round2_(agent.grossCommission);
    rowObj['Agent ' + agent.index + ' Agent Income'] = round2_(agent.agentIncome);
    rowObj['Agent ' + agent.index + ' Office Income'] = round2_(agent.officeIncome);
  });

  const values = headers.map(function (header) {
    return Object.prototype.hasOwnProperty.call(rowObj, header) ? rowObj[header] : '';
  });

  const targetRow = existingRow || sheet.getLastRow() + 1;
  sheet.getRange(targetRow, 1, 1, values.length).setValues([values]);
  sheet.autoResizeColumns(1, Math.min(sheet.getLastColumn(), 25));

  return {
    success: true,
    message: existingRow ? 'Transaction updated.' : 'Transaction created.',
    referenceNumber: referenceNumber,
    record: objectForOutput_(rowObj)
  };
}

function resolveTransactionAgent_(input, index, agents) {
  const name = clean_(input['agent' + index + 'Name'] || input['Agent ' + index + ' Name']);
  const selected = findAgentByName_(agents, name);

  let dealSharePct = parseNumber_(input['agent' + index + 'DealSharePct'] || input['Agent ' + index + ' Deal Share %']);
  let agentSplitPct = parseNumber_(input['agent' + index + 'AgentSplitPct'] || input['Agent ' + index + ' Agent Split %']);
  let officeSplitPct = parseNumber_(input['agent' + index + 'OfficeSplitPct'] || input['Agent ' + index + ' Office Split %']);

  if (!agentSplitPct && selected && selected.agentSplitPct) {
    agentSplitPct = parseNumber_(selected.agentSplitPct);
  }

  if (!officeSplitPct && selected && selected.officeSplitPct) {
    officeSplitPct = parseNumber_(selected.officeSplitPct);
  }

  if (name && !agentSplitPct && !officeSplitPct) {
    agentSplitPct = 70;
    officeSplitPct = 30;
  }

  return {
    name: name,
    email: clean_(input['agent' + index + 'Email'] || input['Agent ' + index + ' Email'] || (selected ? selected.email : '')),
    number: clean_(input['agent' + index + 'Number'] || input['Agent ' + index + ' Number'] || (selected ? selected.number : '')),
    ffc: clean_(input['agent' + index + 'Ffc'] || input['Agent ' + index + ' FFC'] || (selected ? selected.ffc : '')),
    dealSharePct: dealSharePct,
    agentSplitPct: agentSplitPct,
    officeSplitPct: officeSplitPct
  };
}

function findAgentByName_(agents, name) {
  const key = clean_(name).toLowerCase();

  if (!key) {
    return null;
  }

  for (let i = 0; i < agents.length; i++) {
    if (clean_(agents[i].name).toLowerCase() === key) {
      return agents[i];
    }
  }

  return null;
}

function listRecords_() {
  const sheet = getOrCreateSheet_();
  const hm = getHeaderMap_(sheet);
  const headers = hm.headers;
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return {
      success: true,
      records: []
    };
  }

  const values = sheet
    .getRange(2, 1, lastRow - 1, headers.length)
    .getValues();

  const records = values
    .filter(function (row) {
      return row.some(function (cell) {
        return cell !== '' && cell !== null;
      });
    })
    .map(function (row) {
      const record = {};

      headers.forEach(function (header, index) {
        record[header] = formatForJson_(row[index]);
      });

      return record;
    })
    .sort(function (a, b) {
      return String(b['Updated At']).localeCompare(String(a['Updated At']));
    });

  return {
    success: true,
    records: records
  };
}

function getRecord_(referenceNumber) {
  const sheet = getOrCreateSheet_();
  const hm = getHeaderMap_(sheet);
  const row = findRowByReference_(sheet, referenceNumber, hm.map);

  if (!row) {
    return {
      success: false,
      error: 'Reference number not found.'
    };
  }

  const values = sheet.getRange(row, 1, 1, hm.headers.length).getValues()[0];
  const record = {};

  hm.headers.forEach(function (header, index) {
    record[header] = formatForJson_(values[index]);
  });

  return {
    success: true,
    record: record
  };
}

function findRowByReference_(sheet, referenceNumber, map) {
  if (!referenceNumber || map['Reference Number'] === undefined) {
    return null;
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return null;
  }

  const col = map['Reference Number'] + 1;

  const refs = sheet
    .getRange(2, col, lastRow - 1, 1)
    .getValues()
    .flat();

  const target = String(referenceNumber).trim().toLowerCase();

  for (let i = 0; i < refs.length; i++) {
    if (String(refs[i]).trim().toLowerCase() === target) {
      return i + 2;
    }
  }

  return null;
}

function makeNextReference_() {
  const sheet = getOrCreateSheet_();

  ensureHeaders_(sheet);

  const hm = getHeaderMap_(sheet);
  const year = new Date().getFullYear();
  const prefix = 'BLPE-OTP-' + year + '-';

  let max = 0;

  if (sheet.getLastRow() >= 2 && hm.map['Reference Number'] !== undefined) {
    const col = hm.map['Reference Number'] + 1;

    const refs = sheet
      .getRange(2, col, sheet.getLastRow() - 1, 1)
      .getValues()
      .flat();

    refs.forEach(function (ref) {
      const text = String(ref || '');

      if (text.indexOf(prefix) === 0) {
        const n = Number(text.replace(prefix, ''));

        if (Number.isFinite(n) && n > max) {
          max = n;
        }
      }
    });
  }

  return prefix + String(max + 1).padStart(4, '0');
}

function listAgents_() {
  const ss = getAgentsSpreadsheet_();
  const sheet = ss.getSheets()[0];
  const data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    return {
      success: true,
      agents: []
    };
  }

  const headers = data[0].map(function (header) {
    return String(header || '').trim();
  });

  const index = makeFlexibleHeaderIndex_(headers);

  const agents = data.slice(1)
    .map(function (row) {
      const name = getByKeys_(row, index, [
        'name',
        'agent',
        'fullname',
        'agentname',
        'agentfullname'
      ]);

      const email = getByKeys_(row, index, [
        'email',
        'emailaddress',
        'mail'
      ]);

      const number = getByKeys_(row, index, [
        'number',
        'cell',
        'cellnumber',
        'phone',
        'mobile',
        'contactnumber'
      ]);

      const ffc = getByKeys_(row, index, [
        'ffc',
        'ffcnr',
        'ffcnumber',
        'ppra'
      ]);

      const combinedSplitRaw = getByKeys_(row, index, [
        'splitwithoffice',
        'splitwiththeoffice',
        'agentsplitwithoffice',
        'agentofficesplit',
        'agentoffice',
        'commissionwithoffice',
        'commissionsplitwithoffice',
        'commissionagentsplitwithoffice'
      ]);

      const combinedSplit = parseSplitWithOffice_(combinedSplitRaw);

      let agentSplitPct = parseNumber_(
        getByKeys_(row, index, [
          'agentsplit',
          'agentsplitpct',
          'agentsplitpercent',
          'agentcommission',
          'agentcommissionpct',
          'agentcommissionpercent',
          'commissionagentsplit',
          'commissionagentsplitpct'
        ])
      );

      let officeSplitPct = parseNumber_(
        getByKeys_(row, index, [
          'officesplit',
          'officesplitpct',
          'officesplitpercent',
          'companysplit',
          'companysplitpct',
          'companysplitpercent',
          'mcsplit',
          'mcsplitpct',
          'marketsplit',
          'marketsplitpct',
          'marketcentresplit',
          'marketcentresplitpct',
          'kwsplit',
          'kwsplitpct'
        ])
      );

      if (!agentSplitPct && combinedSplit.agentSplitPct) {
        agentSplitPct = combinedSplit.agentSplitPct;
      }

      if (!officeSplitPct && combinedSplit.officeSplitPct) {
        officeSplitPct = combinedSplit.officeSplitPct;
      }

      if (!officeSplitPct && agentSplitPct) {
        officeSplitPct = 100 - agentSplitPct;
      }

      if (!agentSplitPct && officeSplitPct) {
        agentSplitPct = 100 - officeSplitPct;
      }

      if (!agentSplitPct && !officeSplitPct && name) {
        agentSplitPct = 70;
        officeSplitPct = 30;
      }

      return {
        name: clean_(name),
        email: clean_(email),
        number: clean_(number),
        ffc: clean_(ffc),
        agentSplitPct: round4_(agentSplitPct),
        officeSplitPct: round4_(officeSplitPct),
        splitWithOffice: clean_(combinedSplitRaw)
      };
    })
    .filter(function (agent) {
      return agent.name;
    })
    .sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });

  return {
    success: true,
    agents: agents
  };
}

function parseSplitWithOffice_(value) {
  const text = clean_(value);

  if (!text) {
    return {
      agentSplitPct: 0,
      officeSplitPct: 0
    };
  }

  const matches = text.match(/\d+(?:[.,]\d+)?/g) || [];

  if (matches.length >= 2) {
    return {
      agentSplitPct: parseNumber_(matches[0]),
      officeSplitPct: parseNumber_(matches[1])
    };
  }

  if (matches.length === 1) {
    const agentSplitPct = parseNumber_(matches[0]);

    return {
      agentSplitPct: agentSplitPct,
      officeSplitPct: agentSplitPct ? 100 - agentSplitPct : 0
    };
  }

  return {
    agentSplitPct: 0,
    officeSplitPct: 0
  };
}

function makeFlexibleHeaderIndex_(headers) {
  const index = {};

  headers.forEach(function (header, i) {
    const key = normalizeHeader_(header);
    if (key) {
      index[key] = i;
    }
  });

  return index;
}

function getByKeys_(row, index, keys) {
  for (let i = 0; i < keys.length; i++) {
    const key = normalizeHeader_(keys[i]);
    if (index[key] !== undefined) {
      return row[index[key]];
    }
  }

  return '';
}

function normalizeHeader_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/%/g, 'pct')
    .replace(/[^a-z0-9]/g, '');
}

function parseNumber_(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const text = String(value)
    .replace(/R/gi, '')
    .replace(/%/g, '')
    .replace(/\s/g, '')
    .replace(/,/g, '.')
    .replace(/[^\d.-]/g, '');

  const n = Number(text);

  return Number.isFinite(n) ? n : 0;
}

function clean_(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function yes_(value) {
  const text = clean_(value).toLowerCase();

  return text === 'yes' ||
    text === 'true' ||
    text === 'on' ||
    text === '1'
    ? 'Yes'
    : '';
}

function round2_(num) {
  return Math.round((Number(num) || 0) * 100) / 100;
}

function round4_(num) {
  return Math.round((Number(num) || 0) * 10000) / 10000;
}

function objectForOutput_(obj) {
  const out = {};

  Object.keys(obj).forEach(function (key) {
    out[key] = formatForJson_(obj[key]);
  });

  return out;
}

function formatForJson_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone(),
      'yyyy-MM-dd HH:mm:ss'
    );
  }

  return value === null || value === undefined ? '' : value;
}

function output_(payload, callback) {
  const json = JSON.stringify(payload);

  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
