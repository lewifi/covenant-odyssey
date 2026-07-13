# Developer Instructions

Follow these clear, step-by-step commands in **PowerShell** to run, test, and develop Covenant Odyssey.

> [!IMPORTANT]
> **Action Required**: Due to Windows directory locking issues in the IDE background environment, some frontend node packages could not be finalized. Please run the following command block in your PowerShell terminal to clean and restore packages.

## 🛠️ Step 1: Clean and Install Frontend Dependencies
Copy and paste this command block directly into your PowerShell terminal:
```powershell
cd "c:\Users\lewih\Dev\Covenant Odyssey\frontend"
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
npm install
```

---

## 🚀 Step 2: Running the Applications

Once dependencies are installed:

### 1. Start the Cloudflare Worker Backend
Open a PowerShell terminal and run:
```powershell
cd "c:\Users\lewih\Dev\Covenant Odyssey\backend"
npm run dev
```
*The API worker will start locally at `http://localhost:8787`.*

### 2. Start the Expo Frontend (Web support)
Open a second PowerShell terminal and run:
```powershell
cd "c:\Users\lewih\Dev\Covenant Odyssey\frontend"
npm run web
```
*This will compile and host the Expo app. It will open in your default browser at `http://localhost:8081`.*

---

## 🧪 Step 3: Running Tests

To run vitest test suites in the backend:
```powershell
cd "c:\Users\lewih\Dev\Covenant Odyssey\backend"
npm run test
```

---

## 🐙 Step 4: Git Workflow

The remote repository has been successfully set up and the initial commit pushed to:
`https://github.com/lewifi/covenant-odyssey.git`

To commit and push new changes in the future, run:
```powershell
git add .
git commit -m "Your commit message"
git push
```
