# Blue Lily Pretoria East OTP Transaction Tracker - Agent Split Version

This version adds agent-office split logic and supports Agent 1, Agent 2 and Agent 3 on each transaction.

## Built-in links

Transaction tracker sheet:

```text
https://docs.google.com/spreadsheets/d/15VXtcZTey2Ml1jl0tLakFm8F5ImSpvsRgKmtjVmrn2g/edit
```

Agent data sheet:

```text
https://docs.google.com/spreadsheets/d/1OcpmU2rveF1s633NCvCy9BsZN--44lKocjqYSAx5wAY/edit
```

Current deployed Apps Script URL already built into the frontend:

```text
https://script.google.com/macros/s/AKfycbzcViQ_NJstbPuLYMrPIyaYwwUlY-1bYzvcxsKq1Imb77CYUfpWVGjwuYwTXSsQp6Co/exec
```

## What changed

- Added Agent 1, Agent 2 and Agent 3 sections.
- Each agent can be selected from the agent Google Sheet.
- The app pulls available agent details automatically:
  - Name
  - Email
  - Number
  - FFC
  - Agent Split %
  - Office Split %
- Each transaction has a separate Deal Share % per agent.
- Company income is calculated from total commission less the agents' net income.

## Required agent sheet columns

The app is flexible. It can read columns with names like:

```text
Name
Email
Number
FFC
Agent Split %
Office Split %
```

It will also accept similar names such as:

```text
Agent Name
Cell Number
Contact Number
Commission Split
Company Split
Market Centre Split
MC Split
KW Split
```

If the sheet only has Agent Split %, the Office Split % is calculated as:

```text
Office Split % = 100 - Agent Split %
```

If the sheet only has Office Split %, the Agent Split % is calculated as:

```text
Agent Split % = 100 - Office Split %
```

If neither split exists for an agent, the backend uses the fallback:

```text
Agent Split: 70%
Office Split: 30%
```

## Calculation logic

Example:

```text
Total commission: R100,000

Agent 1 Deal Share: 50%
Agent 1 Agent Split with Office: 70%
Agent 1 Office Split: 30%

Agent 1 Gross Commission = R100,000 x 50% = R50,000
Agent 1 Net Income = R50,000 x 70% = R35,000
Office Income from Agent 1 = R50,000 - R35,000 = R15,000
```

The same calculation is done for Agent 2 and Agent 3.

Overall:

```text
Total Agent Gross Commission = all agent gross shares added together
Total Agent Income = all agent net income added together
Total Office Income = all office portions added together
Unallocated Commission = total commission minus allocated agent gross commission
Company Income = total commission minus total agent net income
```

## Deployment steps

1. Open Google Apps Script.
2. Replace the existing `Code.gs` with the updated file in `google-apps-script/Code.gs`.
3. Save.
4. Deploy a new version of the Web App.
5. Keep:
   - Execute as: Me
   - Who has access: Anyone
6. Upload the updated `frontend/index.html` to GitHub/Netlify.

## Important

After updating Apps Script, click `Setup Sheet` inside the app once. This will add the new Agent 3 and split columns to the transaction sheet without deleting existing data.


## Logo added

The frontend now includes the Blue Lily Properties logo in the top header using `frontend/logo.jpg`.

## Commission split fix

The agent sheet currently uses the column `Split with office` with values such as `80/20`, `75/25` and `70/30`.

This build now reads that combined split correctly:
- `80/20` becomes Agent Split 80% and Office Split 20%.
- `75/25` becomes Agent Split 75% and Office Split 25%.
- `70/30` becomes Agent Split 70% and Office Split 30%.

## Frontend agent split refresh update

When Agent 1, Agent 2 or Agent 3 is changed on the frontend, the app now immediately refreshes:
- Agent Split %
- Office Split %
- Agent email, number and FFC
- Split with office display, such as 80/20, 75/25 or 70/30

Opening an existing saved transaction keeps the saved split values on that transaction unless the user changes the agent selection.

## Install on MacBook and phone

This build includes PWA install files:
- `manifest.webmanifest`
- `sw.js`
- app icons in `frontend/icons/`

After deploying to Netlify, open the Netlify link on each device.

### MacBook
Chrome or Edge:
1. Open the web app.
2. Click the install icon in the address bar, or use the browser menu.
3. Choose Install.
4. The app will open like a normal Mac app.

Safari:
1. Open the web app.
2. Use File > Add to Dock.
3. The app will appear in the Dock and Launchpad.

### iPhone
1. Open the web app in Safari.
2. Tap Share.
3. Tap Add to Home Screen.
4. Tap Add.

### Android
1. Open the web app in Chrome.
2. Tap the three-dot menu.
3. Tap Install app or Add to Home screen.
4. Tap Install.

The app still needs internet access for Google Sheet read/write.
