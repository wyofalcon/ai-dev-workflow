# CI/CD Setup & Environment Gates

To fully enable the "Notification-Driven" and "Manual Approval" workflow, you need to configure **Environments** in your GitHub Repository settings.

## 1. Create Environments

1. Go to your GitHub Repository -> **Settings** -> **Environments**.
2. Create two environments:
   - `staging`
   - `production`

## 2. Configure "Staging" Protection Rules

1. Click on **staging**.
2. **Deployment protection rules**:
   - Check **Required reviewers**.
   - Add yourself (or the Lead Developer/Auditor) as the reviewer.
   - (Optional) **Wait timer**: Set to 0 or 1 minute.
3. **Deployment branches**:
   - Limit to selected branches: `staging`.

## 3. Configure "Production" Protection Rules

1. Click on **production**.
2. **Deployment protection rules**:
   - Check **Required reviewers**.
   - Add yourself (and potentially a second approver).
3. **Deployment branches**:
   - Limit to selected branches: `main`.

## 4. How It Works

1. **Dev:** You push to `dev`. CI runs tests.
2. **Promote:** You run the "🚀 Promote Branch" task in VS Code. It merges `dev` -> `staging`.
3. **Gate:** The GitHub Action for `staging` will start, but **PAUSE** at the deployment step.
4. **Notify:** GitHub sends you an email/notification: "Deployment to staging needs approval."
5. **Approve:** You click "Approve and Deploy" in GitHub.
6. **Repeat:** The same process applies for `staging` -> `main` (Production).
